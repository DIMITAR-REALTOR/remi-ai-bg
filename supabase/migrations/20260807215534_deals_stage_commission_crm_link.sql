-- Сделки: истински етапи + комисиона + връзка към CRM клиент

ALTER TABLE public.deals
  ADD COLUMN stage text NOT NULL DEFAULT 'contact'
  CHECK (stage IN ('contact','viewing','offer','negotiation','notary','closed'));

ALTER TABLE public.deals
  ADD COLUMN commission_percent numeric(5,2);

ALTER TABLE public.deals
  ADD COLUMN crm_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
CREATE INDEX deals_crm_client_idx ON public.deals(crm_client_id);

CREATE OR REPLACE FUNCTION public.sync_deal_status_from_stage()
RETURNS trigger AS $$
BEGIN
  IF NEW.stage = 'closed' THEN
    NEW.status := 'completed';
    IF NEW.closed_at IS NULL THEN NEW.closed_at := now(); END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_stage_status_sync
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.sync_deal_status_from_stage();
