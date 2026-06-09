-- Explicit deny for client-side writes on affiliate_payment_requests.
-- All inserts/updates happen server-side via service role (bypasses RLS).
CREATE POLICY "Block client inserts on payment requests"
  ON public.affiliate_payment_requests
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Block client updates on payment requests"
  ON public.affiliate_payment_requests
  FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Block client deletes on payment requests"
  ON public.affiliate_payment_requests
  FOR DELETE TO authenticated, anon
  USING (false);

-- Storage policies for affiliate-qr bucket.
-- Affiliate uploads use server-signed upload URLs (bypass RLS); admins can also manage directly.
CREATE POLICY "Admins can read affiliate QR files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'affiliate-qr' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert affiliate QR files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'affiliate-qr' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update affiliate QR files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'affiliate-qr' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'affiliate-qr' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete affiliate QR files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'affiliate-qr' AND public.has_role(auth.uid(), 'admin'));
