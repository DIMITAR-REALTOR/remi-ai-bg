-- broker_verification_gate (вече приложена в Supabase на 2026-09-26)
-- Брокерските права изискват верификация: has_role(..., 'broker') връща true
-- само ако profiles.broker_status = 'verified'. Покрива всички политики с has_role(..., 'broker').
-- Верификацията е ръчна: update public.profiles set broker_status = 'verified' where id = '<user id>';

-- Акаунтът dimitar.varna.realtor@gmail.com става верифициран брокер
update public.user_roles
   set role = 'broker', role_selection_pending = false
 where user_id = 'ca4dc7c1-0120-4836-a1cc-f4c1cd09dd9c';

update public.profiles
   set broker_status = 'verified'
 where id = 'ca4dc7c1-0120-4836-a1cc-f4c1cd09dd9c';

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _user_id and ur.role = _role
      and (_role <> 'broker' or exists (
            select 1 from public.profiles p
            where p.id = _user_id and p.broker_status = 'verified'))
  )
$$;
