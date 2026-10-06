-- deal_outcome (Predictive Insights — краен резултат на сделки)

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS outcome text NULL;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS closing_price_eur numeric(12,2) NULL;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS failure_reason_code text NULL;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS failure_reason_note text NULL;

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deal_outcome_check;
ALTER TABLE public.deals ADD CONSTRAINT deal_outcome_check
  CHECK (outcome IS NULL OR outcome IN ('won','lost','cancelled'));

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deal_failure_reason_code_check;
ALTER TABLE public.deals ADD CONSTRAINT deal_failure_reason_code_check
  CHECK (failure_reason_code IS NULL OR failure_reason_code IN (
    'price','financing','buyer_withdrew','seller_withdrew','legal_issue','other'
  ));

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deal_closing_price_non_negative;
ALTER TABLE public.deals ADD CONSTRAINT deal_closing_price_non_negative
  CHECK (closing_price_eur IS NULL OR closing_price_eur >= 0);

DROP INDEX IF EXISTS public.deals_closed_without_outcome_idx;
CREATE INDEX deals_closed_without_outcome_idx
  ON public.deals (closed_at)
  WHERE stage = 'closed' AND outcome IS NULL;

CREATE OR REPLACE FUNCTION public.sync_deal_outcome()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.stage <> 'closed' THEN
    NEW.outcome := NULL;
    NEW.closing_price_eur := NULL;
    NEW.failure_reason_code := NULL;
    NEW.failure_reason_note := NULL;
    RETURN NEW;
  END IF;

  IF NEW.outcome IS DISTINCT FROM 'won' THEN
    NEW.closing_price_eur := NULL;
  END IF;

  IF NEW.outcome IS NULL OR NEW.outcome NOT IN ('lost','cancelled') THEN
    NEW.failure_reason_code := NULL;
    NEW.failure_reason_note := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deals_sync_outcome ON public.deals;
CREATE TRIGGER deals_sync_outcome
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.sync_deal_outcome();

COMMENT ON COLUMN public.deals.outcome IS 'Краен резултат: won/lost/cancelled. NULL = още няма резултат.';
COMMENT ON COLUMN public.deals.closing_price_eur IS 'Реална крайна цена в EUR. Само при outcome=won.';
COMMENT ON COLUMN public.deals.failure_reason_code IS 'Код на причина за неуспех. Само при outcome IN (lost,cancelled).';
COMMENT ON COLUMN public.deals.failure_reason_note IS 'Допълнително обяснение за неуспеха. Само при outcome IN (lost,cancelled).';
