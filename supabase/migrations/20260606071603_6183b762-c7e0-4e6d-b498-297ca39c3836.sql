
-- Affiliate system
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliate read own" ON public.affiliates FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT ALL ON public.affiliate_clicks TO service_role;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliate clicks read own" ON public.affiliate_clicks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS affiliate_clicks_affiliate_id_idx ON public.affiliate_clicks(affiliate_id);

CREATE TABLE IF NOT EXISTS public.affiliate_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  product_count integer NOT NULL DEFAULT 0,
  commission numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliate_orders TO authenticated;
GRANT ALL ON public.affiliate_orders TO service_role;
ALTER TABLE public.affiliate_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliate orders read own" ON public.affiliate_orders FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS affiliate_orders_affiliate_id_idx ON public.affiliate_orders(affiliate_id);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_code text;

CREATE TRIGGER affiliates_set_updated_at BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER affiliate_orders_set_updated_at BEFORE UPDATE ON public.affiliate_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
