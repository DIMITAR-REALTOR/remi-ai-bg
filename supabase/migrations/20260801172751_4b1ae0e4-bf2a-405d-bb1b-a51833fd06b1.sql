CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers manage own deals select" ON public.deals FOR SELECT TO authenticated
USING (broker_id = auth.uid() OR client_id = auth.uid());
CREATE POLICY "Brokers create own deals" ON public.deals FOR INSERT TO authenticated
WITH CHECK (broker_id = auth.uid() AND public.has_role(auth.uid(), 'broker'::public.app_role));
CREATE POLICY "Brokers update own deals" ON public.deals FOR UPDATE TO authenticated
USING (broker_id = auth.uid() AND public.has_role(auth.uid(), 'broker'::public.app_role))
WITH CHECK (broker_id = auth.uid() AND public.has_role(auth.uid(), 'broker'::public.app_role));

CREATE TABLE public.broker_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX broker_reviews_broker_id_idx ON public.broker_reviews(broker_id);

GRANT SELECT ON public.broker_reviews TO anon;
GRANT SELECT, INSERT ON public.broker_reviews TO authenticated;
GRANT ALL ON public.broker_reviews TO service_role;
ALTER TABLE public.broker_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public" ON public.broker_reviews FOR SELECT USING (true);
CREATE POLICY "Client can review completed own deal" ON public.broker_reviews FOR INSERT TO authenticated
WITH CHECK (
  client_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_id
      AND d.client_id = auth.uid()
      AND d.broker_id = broker_reviews.broker_id
      AND d.status = 'completed'
  )
);