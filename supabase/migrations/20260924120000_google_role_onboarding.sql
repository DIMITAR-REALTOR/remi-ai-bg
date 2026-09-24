ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS role_selection_pending BOOLEAN NOT NULL DEFAULT false;

-- Preserve the client fallback while marking Google-created users for onboarding.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'client');

  INSERT INTO public.profiles (id, full_name, phone, email, agency_name, bio, city, broker_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    NEW.raw_user_meta_data->>'agency_name',
    NEW.raw_user_meta_data->>'bio',
    COALESCE(NEW.raw_user_meta_data->>'city', CASE WHEN v_role = 'broker' THEN 'Варна' ELSE NULL END),
    CASE WHEN v_role = 'broker' THEN 'pending' ELSE 'pending' END
  );

  INSERT INTO public.user_roles (user_id, role, role_selection_pending)
  VALUES (NEW.id, v_role, NEW.raw_user_meta_data->>'role' IS NULL);
  RETURN NEW;
END;
$function$;

-- Allow an authenticated user to choose exactly one application role during onboarding.
CREATE OR REPLACE FUNCTION public.set_my_role(p_role public.app_role)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  DELETE FROM public.user_roles
  WHERE user_id = v_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, p_role);

  IF p_role = 'broker' THEN
    UPDATE public.profiles
    SET broker_status = 'pending'
    WHERE id = v_user_id;
  END IF;

  RETURN p_role;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_my_role(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_role(public.app_role) TO authenticated;