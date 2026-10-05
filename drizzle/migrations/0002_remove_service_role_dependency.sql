-- Admin access through RLS (no service-role key needed)
CREATE POLICY "Admins read affiliates" ON public.affiliates FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete affiliates" ON public.affiliates FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read affiliate clicks" ON public.affiliate_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete affiliate clicks" ON public.affiliate_clicks FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read affiliate orders" ON public.affiliate_orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete affiliate orders" ON public.affiliate_orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Block client updates on payment requests" ON public.affiliate_payment_requests;
DROP POLICY IF EXISTS "Block client deletes on payment requests" ON public.affiliate_payment_requests;
CREATE POLICY "Admins update payment requests" ON public.affiliate_payment_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete payment requests" ON public.affiliate_payment_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete order items" ON public.order_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Affiliates can read the orders they referred
CREATE POLICY "Affiliates read referred orders" ON public.orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.affiliate_orders ao JOIN public.affiliates a ON a.id = ao.affiliate_id WHERE ao.order_id = orders.id AND a.user_id = auth.uid()));
CREATE POLICY "Affiliates read referred order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.affiliate_orders ao JOIN public.affiliates a ON a.id = ao.affiliate_id WHERE ao.order_id = order_items.order_id AND a.user_id = auth.uid()));

-- Affiliates upload/read QR files in their own folder
CREATE POLICY "Affiliates upload own QR" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'affiliate-qr' AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.affiliates WHERE user_id = auth.uid()));
CREATE POLICY "Affiliates read own QR" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'affiliate-qr' AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.affiliates WHERE user_id = auth.uid()));

-- Create (or return) the caller's affiliate account with a unique code
CREATE OR REPLACE FUNCTION public.ensure_my_affiliate()
RETURNS public.affiliates LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.affiliates; code text; i int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  SELECT * INTO r FROM public.affiliates WHERE user_id = auth.uid();
  IF FOUND THEN RETURN r; END IF;
  LOOP
    i := i + 1;
    code := 'nk' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);
    BEGIN
      INSERT INTO public.affiliates(user_id, username) VALUES (auth.uid(), code) RETURNING * INTO r;
      RETURN r;
    EXCEPTION WHEN unique_violation THEN
      SELECT * INTO r FROM public.affiliates WHERE user_id = auth.uid();
      IF FOUND THEN RETURN r; END IF;
      IF i > 5 THEN RAISE; END IF;
    END;
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.ensure_my_affiliate() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.ensure_my_affiliate() TO authenticated;

-- Reviews from signed-in customers, verified-buyer flag computed in DB
CREATE OR REPLACE FUNCTION public.submit_product_review(_product_id uuid, _name text, _rating int, _comment text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v boolean := false;
BEGIN
  IF length(trim(_name)) < 1 OR length(_name) > 80 OR _rating < 1 OR _rating > 5 OR length(trim(_comment)) < 1 OR length(_comment) > 1000 THEN
    RAISE EXCEPTION 'Invalid review';
  END IF;
  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
      WHERE o.user_id = auth.uid() AND o.status = 'delivered' AND oi.product_id = _product_id) INTO v;
  END IF;
  INSERT INTO public.product_reviews(product_id, name, rating, comment, user_id, verified)
  VALUES (_product_id, trim(_name), _rating, trim(_comment), auth.uid(), v);
  RETURN v;
END $$;
GRANT EXECUTE ON FUNCTION public.submit_product_review(uuid, text, int, text) TO anon, authenticated;

-- Admin reset helpers
CREATE OR REPLACE FUNCTION public.admin_reset(_scope text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.affiliate_payment_requests WHERE id IS NOT NULL;
  DELETE FROM public.affiliate_orders WHERE id IS NOT NULL;
  DELETE FROM public.affiliate_clicks WHERE id IS NOT NULL;
  IF _scope = 'all' THEN
    DELETE FROM public.order_items WHERE id IS NOT NULL;
    DELETE FROM public.orders WHERE id IS NOT NULL;
  ELSIF _scope = 'affiliates' THEN
    DELETE FROM public.affiliates WHERE id IS NOT NULL;
  ELSE RAISE EXCEPTION 'Invalid scope'; END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_reset(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_reset(text) TO authenticated;