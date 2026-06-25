
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS broker_status text NOT NULL DEFAULT 'pending'
    CHECK (broker_status IN ('pending', 'verified'));

-- Backfill existing brokers as verified with Varna default
UPDATE public.profiles p
SET broker_status = 'verified',
    city = COALESCE(p.city, 'Варна')
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'broker'
);

-- Update handle_new_user trigger to populate city + broker_status for brokers
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

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  RETURN NEW;
END;
$function$;
