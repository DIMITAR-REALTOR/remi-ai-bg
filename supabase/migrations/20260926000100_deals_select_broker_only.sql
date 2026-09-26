-- deals_select_broker_only (вече приложена в Supabase на 2026-09-26)
-- Клиентът вече не чете `deals` директно (там са комисиона и AI анализ на брокера);
-- вижда сделките си само през public.get_my_client_deals().
-- Изисква deals_hardening_v1 (PR #2) и фронтенд, който ползва rpc get_my_client_deals.

alter policy "Brokers manage own deals select" on public.deals
  using (broker_id = auth.uid());
