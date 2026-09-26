-- deals_hardening_v1 (вече приложена в Supabase като "deals_hardening_v1" на 2026-09-26)
-- Записана тук, за да може репото да пресъздава базата.

-- 7. Излишни права през REST
revoke execute on function public.auto_assign_agency_lead() from public, anon, authenticated;
revoke execute on function public.set_initial_role(public.app_role) from public, anon;

-- 2. (подготовка) безопасен изглед на сделките за клиента, без комисиона и AI анализ
create or replace function public.get_my_client_deals()
returns table (id uuid, broker_id uuid, status text, closed_at timestamptz,
               created_at timestamptz, listing_id uuid, broker_name text, listing_title text)
language sql stable security definer set search_path = public as $$
  select d.id, d.broker_id, d.status, d.closed_at, d.created_at, d.listing_id,
         p.full_name, l.title
  from public.deals d
  left join public.profiles p on p.id = d.broker_id
  left join public.listings l on l.id = d.listing_id
  where d.client_id = auth.uid()
  order by d.created_at desc;
$$;
revoke execute on function public.get_my_client_deals() from public, anon;
grant  execute on function public.get_my_client_deals() to authenticated;

-- 2. (подготовка) ревюто да не зависи от четене на deals от клиента
create or replace function public.client_can_review_deal(_deal uuid, _broker uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.deals d
    where d.id = _deal and d.client_id = auth.uid()
      and d.broker_id = _broker and d.status = 'completed');
$$;
revoke execute on function public.client_can_review_deal(uuid, uuid) from public, anon;
grant  execute on function public.client_can_review_deal(uuid, uuid) to authenticated;

alter policy "Client can review completed own deal" on public.broker_reviews
  with check (client_id = auth.uid() and public.client_can_review_deal(deal_id, broker_id));

-- 5. Целост
alter policy "Brokers create own deals" on public.deals
  with check (
    broker_id = auth.uid() and public.has_role(auth.uid(), 'broker')
    and (deals.crm_client_id is null or exists (
          select 1 from public.clients c
          where c.id = deals.crm_client_id and c.broker_id = auth.uid()))
    and (deals.listing_id is null or exists (
          select 1 from public.listings l where l.id = deals.listing_id))
  );

alter policy "Brokers update own deals" on public.deals
  with check (
    broker_id = auth.uid() and public.has_role(auth.uid(), 'broker')
    and (deals.crm_client_id is null or exists (
          select 1 from public.clients c
          where c.id = deals.crm_client_id and c.broker_id = auth.uid()))
  );

alter policy "Brokers manage participants of own deals" on public.deal_participants
  with check (
    exists (select 1 from public.deals d
            where d.id = deal_participants.deal_id and d.broker_id = auth.uid())
    and exists (select 1 from public.clients c
            where c.id = deal_participants.client_id and c.broker_id = auth.uid())
  );

-- 4. Връщане от closed връща статуса и затрива closed_at
create or replace function public.sync_deal_status_from_stage()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.stage = 'closed' then
    new.status := 'completed';
    if new.closed_at is null then new.closed_at := now(); end if;
  elsif tg_op = 'UPDATE' and old.stage = 'closed' then
    new.status := 'active';
    new.closed_at := null;
  end if;
  return new;
end $$;

-- 4. История на етапите (пише се само от тригер)
create table public.deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  broker_id uuid not null,
  from_stage text,
  to_stage text not null,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now()
);
create index on public.deal_stage_history (deal_id, changed_at);
alter table public.deal_stage_history enable row level security;
revoke all on public.deal_stage_history from anon, authenticated;
grant select on public.deal_stage_history to authenticated;
create policy "Brokers read own deal history" on public.deal_stage_history
  for select to authenticated using (broker_id = auth.uid());

create or replace function public.log_deal_stage_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    insert into public.deal_stage_history (deal_id, broker_id, from_stage, to_stage)
    values (new.id, new.broker_id, case when tg_op = 'UPDATE' then old.stage end, new.stage);
  end if;
  return null;
end $$;
revoke execute on function public.log_deal_stage_change() from public, anon, authenticated;

create trigger deals_log_stage_change
  after insert or update of stage on public.deals
  for each row execute function public.log_deal_stage_change();

insert into public.deal_stage_history (deal_id, broker_id, from_stage, to_stage)
select id, broker_id, null, stage from public.deals;
