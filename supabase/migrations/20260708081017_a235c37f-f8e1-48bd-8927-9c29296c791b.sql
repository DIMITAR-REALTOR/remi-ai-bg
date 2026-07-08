CREATE OR REPLACE FUNCTION public.prevent_broker_status_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.broker_status IS DISTINCT FROM OLD.broker_status THEN
    IF auth.uid() = OLD.id AND NOT public.has_role(auth.uid(), 'broker'::public.app_role) IS NULL THEN
      -- always block self-change of broker_status regardless of role
      NEW.broker_status := OLD.broker_status;
    END IF;
    IF auth.uid() = OLD.id THEN
      NEW.broker_status := OLD.broker_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_broker_status_self_update ON public.profiles;
CREATE TRIGGER profiles_prevent_broker_status_self_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_broker_status_self_update();