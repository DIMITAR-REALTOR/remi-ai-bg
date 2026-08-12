CREATE OR REPLACE FUNCTION public.sync_deal_status_from_stage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.stage = 'closed' THEN
    NEW.status := 'completed';
    IF NEW.closed_at IS NULL THEN NEW.closed_at := now(); END IF;
  END IF;
  RETURN NEW;
END;
$function$;