
-- Payment requests table
CREATE TABLE public.affiliate_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  qr_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.affiliate_payment_requests TO authenticated;
GRANT ALL ON public.affiliate_payment_requests TO service_role;

ALTER TABLE public.affiliate_payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own requests"
  ON public.affiliate_payment_requests FOR SELECT
  TO authenticated
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all requests"
  ON public.affiliate_payment_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_updated_at_affiliate_payment_requests
  BEFORE UPDATE ON public.affiliate_payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_apr_affiliate ON public.affiliate_payment_requests(affiliate_id, created_at DESC);
CREATE INDEX idx_apr_status ON public.affiliate_payment_requests(status, created_at DESC);
