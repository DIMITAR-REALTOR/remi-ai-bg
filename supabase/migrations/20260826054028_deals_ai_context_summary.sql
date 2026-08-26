-- REMI Core Engine: AI Context Summary per сделка (Reasoning layer, Blueprint Гл. 7.6)
-- Автоматичен, без ръчен вход на брокера — базиран на etap + last_activity_at.

ALTER TABLE public.deals
  ADD COLUMN last_activity_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.deals
  ADD COLUMN ai_context_summary jsonb;

ALTER TABLE public.deals
  ADD COLUMN ai_context_summary_updated_at timestamptz;

-- last_activity_at се обновява автоматично при всяка промяна на етапа на сделката.
CREATE OR REPLACE FUNCTION public.touch_deal_activity()
RETURNS trigger AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.last_activity_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER deals_touch_activity
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.touch_deal_activity();
