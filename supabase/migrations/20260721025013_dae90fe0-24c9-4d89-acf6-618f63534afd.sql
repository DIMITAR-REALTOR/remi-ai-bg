
-- AGENCIES
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agencies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.agencies TO authenticated;
GRANT ALL ON public.agencies TO service_role;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies are viewable by everyone" ON public.agencies
  FOR SELECT USING (true);

CREATE POLICY "Brokers can create agencies" ON public.agencies
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(), 'broker'::public.app_role));

CREATE POLICY "Creator can update own agency" ON public.agencies
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creator can delete own agency" ON public.agencies
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- AGENCY MEMBERS
CREATE TABLE public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agency_id, profile_id)
);
GRANT SELECT ON public.agency_members TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.agency_members TO authenticated;
GRANT ALL ON public.agency_members TO service_role;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- Helper: is confirmed member
CREATE OR REPLACE FUNCTION public.is_confirmed_agency_member(_agency UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = _agency AND profile_id = _user AND status = 'confirmed'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_agency_creator(_agency UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.agencies WHERE id = _agency AND created_by = _user)
$$;

CREATE POLICY "Confirmed members visible to all" ON public.agency_members
  FOR SELECT USING (
    status = 'confirmed'
    OR profile_id = auth.uid()
    OR invited_by = auth.uid()
    OR public.is_agency_creator(agency_id, auth.uid())
  );

CREATE POLICY "Members or creator can invite" ON public.agency_members
  FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND public.has_role(auth.uid(), 'broker'::public.app_role)
    AND (
      public.is_confirmed_agency_member(agency_id, auth.uid())
      OR public.is_agency_creator(agency_id, auth.uid())
    )
  );

CREATE POLICY "Invitee can update own membership status" ON public.agency_members
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Invitee or agency creator can delete membership" ON public.agency_members
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid() OR public.is_agency_creator(agency_id, auth.uid()));

-- Auto-add creator as confirmed member
CREATE OR REPLACE FUNCTION public.add_agency_creator_as_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.agency_members (agency_id, profile_id, status, invited_by)
  VALUES (NEW.id, NEW.created_by, 'confirmed', NEW.created_by)
  ON CONFLICT (agency_id, profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER agencies_add_creator_member
  AFTER INSERT ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.add_agency_creator_as_member();

CREATE INDEX idx_agency_members_agency ON public.agency_members(agency_id);
CREATE INDEX idx_agency_members_profile ON public.agency_members(profile_id);
