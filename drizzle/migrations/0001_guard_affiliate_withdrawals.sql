CREATE OR REPLACE FUNCTION public.request_affiliate_payment(_full_name text, _amount numeric, _qr_path text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  aid uuid;
  available numeric;
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to request payment'; END IF;
  IF length(trim(_full_name)) < 2 OR length(_full_name) > 120 OR _amount IS NULL OR _amount < 1 OR _amount > 1000000 THEN
    RAISE EXCEPTION 'Invalid payment request';
  END IF;
  SELECT id INTO aid FROM public.affiliates WHERE user_id = auth.uid();
  IF aid IS NULL THEN RAISE EXCEPTION 'Affiliate account not found'; END IF;
  IF _qr_path IS NOT NULL AND (length(_qr_path) > 400 OR left(_qr_path, length(aid::text) + 1) <> aid::text || '/') THEN
    RAISE EXCEPTION 'Invalid QR image';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(aid::text));
  SELECT COALESCE((SELECT sum(commission) FROM public.affiliate_orders WHERE affiliate_id = aid), 0)
       - COALESCE((SELECT sum(amount) FROM public.affiliate_payment_requests WHERE affiliate_id = aid AND status IN ('pending', 'approved')), 0)
    INTO available;
  IF _amount > available THEN RAISE EXCEPTION 'Amount exceeds available earnings'; END IF;
  INSERT INTO public.affiliate_payment_requests (affiliate_id, full_name, amount, qr_path)
  VALUES (aid, trim(_full_name), _amount, _qr_path) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.request_affiliate_payment(text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_affiliate_payment(text, numeric, text) TO authenticated;