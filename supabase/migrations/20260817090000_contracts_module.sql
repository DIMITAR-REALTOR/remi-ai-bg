-- Contracts module: preliminary_sale | deposit | rent | commission
-- Phase 1: full architecture for all 4 types, real legal template text only for preliminary_sale.

CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  crm_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,

  contract_type TEXT NOT NULL DEFAULT 'preliminary_sale', -- preliminary_sale | deposit | rent | commission
  status TEXT NOT NULL DEFAULT 'draft', -- draft | finalized

  -- Snapshot data at time of generation (not live-linked — legal docs shouldn't silently change)
  party_a JSONB NOT NULL DEFAULT '{}'::jsonb, -- продавач / наемодател
  party_b JSONB NOT NULL DEFAULT '{}'::jsonb, -- купувач / наемател

  party_a_id_photo_url TEXT,
  party_b_id_photo_url TEXT,

  terms JSONB NOT NULL DEFAULT '{}'::jsonb, -- price, deposit_amount, dates, commission_percent...

  generated_content TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers manage own contracts" ON public.contracts FOR ALL TO authenticated
  USING (auth.uid() = broker_id) WITH CHECK (auth.uid() = broker_id);

CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX contracts_broker_idx ON public.contracts(broker_id);
CREATE INDEX contracts_deal_idx ON public.contracts(deal_id);
CREATE INDEX contracts_type_idx ON public.contracts(contract_type);

-- Private storage bucket for ID document photos (NOT public — contains personal data)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-documents', 'contract-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Brokers view own contract documents" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'contract-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_role(auth.uid(), 'broker')
  );

CREATE POLICY "Brokers upload own contract documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'contract-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_role(auth.uid(), 'broker')
  );

CREATE POLICY "Brokers update own contract documents" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'contract-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_role(auth.uid(), 'broker')
  );

CREATE POLICY "Brokers delete own contract documents" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'contract-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_role(auth.uid(), 'broker')
  );
