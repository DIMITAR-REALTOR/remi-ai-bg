DROP POLICY IF EXISTS "Brokers manage own clients" ON public.clients;
CREATE POLICY "Brokers manage own clients" ON public.clients
FOR ALL TO authenticated
USING (auth.uid() = broker_id AND public.has_role(auth.uid(), 'broker'::public.app_role))
WITH CHECK (auth.uid() = broker_id AND public.has_role(auth.uid(), 'broker'::public.app_role));

DROP POLICY IF EXISTS "Brokers manage own tasks" ON public.tasks;
CREATE POLICY "Brokers manage own tasks" ON public.tasks
FOR ALL TO authenticated
USING (auth.uid() = broker_id AND public.has_role(auth.uid(), 'broker'::public.app_role))
WITH CHECK (auth.uid() = broker_id AND public.has_role(auth.uid(), 'broker'::public.app_role));

-- Trigger functions must never be callable via the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.add_agency_creator_as_member() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_broker_status_self_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- Role helper is only needed inside policies for signed-in users
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_confirmed_agency_member(uuid, uuid) FROM anon, public;
