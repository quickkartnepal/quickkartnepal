CREATE TABLE public.checkout_requests (
  request_id uuid PRIMARY KEY,
  request_kind text NOT NULL,
  payload jsonb NOT NULL
);
GRANT INSERT ON public.checkout_requests TO anon, authenticated;
GRANT ALL ON public.checkout_requests TO service_role;
ALTER TABLE public.checkout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Checkout requests can be submitted"
ON public.checkout_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  request_kind IN ('order', 'promo')
  AND jsonb_typeof(payload) = 'object'
  AND octet_length(payload::text) <= 50000
);

CREATE OR REPLACE FUNCTION public.process_checkout_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  product_row public.products%ROWTYPE;
  new_order public.orders%ROWTYPE;
  promo_row public.promo_codes%ROWTYPE;
  affiliate_row public.affiliates%ROWTYPE;
  raw_subtotal numeric := 0;
  calculated_discount numeric := 0;
  normalized_promo text := NULL;
  product_count integer := 0;
  p jsonb := NEW.payload;
BEGIN
  IF NEW.request_kind = 'promo' THEN
    normalized_promo := upper(trim(p->>'code'));
    raw_subtotal := (p->>'subtotal')::numeric;
    IF normalized_promo = '' OR raw_subtotal < 0 THEN RAISE EXCEPTION 'Invalid promo code'; END IF;
    SELECT * INTO promo_row FROM public.promo_codes WHERE code = normalized_promo AND is_active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Invalid promo code'; END IF;
    IF promo_row.expires_at IS NOT NULL AND promo_row.expires_at < now() THEN RAISE EXCEPTION 'Promo code expired'; END IF;
    IF promo_row.usage_limit IS NOT NULL AND promo_row.used_count >= promo_row.usage_limit THEN RAISE EXCEPTION 'Promo code usage limit reached'; END IF;
    IF raw_subtotal < promo_row.min_subtotal THEN RAISE EXCEPTION 'Minimum order Rs. % required', promo_row.min_subtotal; END IF;
    calculated_discount := CASE WHEN promo_row.discount_type = 'percent'
      THEN round(raw_subtotal * promo_row.discount_value / 100)
      ELSE least(promo_row.discount_value, raw_subtotal) END;
    PERFORM set_config('app.checkout_result', jsonb_build_object(
      'code', normalized_promo, 'discount', calculated_discount,
      'type', promo_row.discount_type, 'value', promo_row.discount_value
    )::text, true);
    RETURN NULL;
  END IF;

  IF length(trim(p->>'full_name')) < 1 OR length(p->>'full_name') > 120 THEN RAISE EXCEPTION 'Invalid full name'; END IF;
  IF length(trim(p->>'phone')) < 5 OR length(p->>'phone') > 20 THEN RAISE EXCEPTION 'Invalid phone number'; END IF;
  IF length(trim(p->>'address')) < 3 OR length(p->>'address') > 500 THEN RAISE EXCEPTION 'Invalid address'; END IF;
  IF jsonb_typeof(p->'items') <> 'array' OR jsonb_array_length(p->'items') < 1 OR jsonb_array_length(p->'items') > 50 THEN RAISE EXCEPTION 'Invalid order items'; END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p->'items') LOOP
    IF COALESCE((item->>'quantity')::integer, 0) < 1 OR (item->>'quantity')::integer > 50 THEN RAISE EXCEPTION 'Invalid product quantity'; END IF;
    SELECT * INTO product_row FROM public.products WHERE id = (item->>'product_id')::uuid AND is_active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Some products are unavailable'; END IF;
    raw_subtotal := raw_subtotal + COALESCE(product_row.discount_price, product_row.price) * (item->>'quantity')::integer;
    product_count := product_count + (item->>'quantity')::integer;
  END LOOP;

  IF nullif(trim(p->>'promo_code'), '') IS NOT NULL THEN
    normalized_promo := upper(trim(p->>'promo_code'));
    SELECT * INTO promo_row FROM public.promo_codes WHERE code = normalized_promo AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Invalid promo code'; END IF;
    IF promo_row.expires_at IS NOT NULL AND promo_row.expires_at < now() THEN RAISE EXCEPTION 'Promo code expired'; END IF;
    IF promo_row.usage_limit IS NOT NULL AND promo_row.used_count >= promo_row.usage_limit THEN RAISE EXCEPTION 'Promo code usage limit reached'; END IF;
    IF raw_subtotal < promo_row.min_subtotal THEN RAISE EXCEPTION 'Minimum order Rs. % required', promo_row.min_subtotal; END IF;
    calculated_discount := CASE WHEN promo_row.discount_type = 'percent'
      THEN round(raw_subtotal * promo_row.discount_value / 100)
      ELSE least(promo_row.discount_value, raw_subtotal) END;
  END IF;

  IF nullif(trim(p->>'affiliate_code'), '') IS NOT NULL THEN
    SELECT * INTO affiliate_row FROM public.affiliates WHERE username = lower(trim(p->>'affiliate_code'));
  END IF;

  INSERT INTO public.orders (full_name, phone, address, province, district, municipality, ward, tole,
    maps_link, notes, subtotal, discount, delivery_charge, delivery_discount, promo_code,
    payment_method, status, user_id, affiliate_code)
  VALUES (trim(p->>'full_name'), trim(p->>'phone'), trim(p->>'address'), nullif(trim(p->>'province'), ''),
    nullif(trim(p->>'district'), ''), nullif(trim(p->>'municipality'), ''), nullif(trim(p->>'ward'), ''),
    nullif(trim(p->>'tole'), ''), nullif(trim(p->>'maps_link'), ''), nullif(trim(p->>'notes'), ''),
    raw_subtotal - calculated_discount, calculated_discount, 150, 0, normalized_promo,
    'COD', 'pending', auth.uid(), affiliate_row.username)
  RETURNING * INTO new_order;

  FOR item IN SELECT value FROM jsonb_array_elements(p->'items') LOOP
    SELECT * INTO product_row FROM public.products WHERE id = (item->>'product_id')::uuid AND is_active = true;
    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity)
    VALUES (new_order.id, product_row.id, product_row.name, product_row.images[1],
      COALESCE(product_row.discount_price, product_row.price), (item->>'quantity')::integer);
  END LOOP;

  IF normalized_promo IS NOT NULL THEN UPDATE public.promo_codes SET used_count = used_count + 1 WHERE id = promo_row.id; END IF;
  IF affiliate_row.id IS NOT NULL THEN
    INSERT INTO public.affiliate_orders (affiliate_id, order_id, product_count, commission, status)
    VALUES (affiliate_row.id, new_order.id, product_count, product_count * 70, 'pending');
  END IF;

  PERFORM set_config('app.checkout_result', jsonb_build_object(
    'id', new_order.id, 'order_number', new_order.order_number,
    'subtotal', new_order.subtotal, 'delivery_charge', new_order.delivery_charge
  )::text, true);
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.process_checkout_request() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_checkout_request() TO service_role;

CREATE TRIGGER checkout_requests_process_before_insert
BEFORE INSERT ON public.checkout_requests
FOR EACH ROW EXECUTE FUNCTION public.process_checkout_request();

CREATE OR REPLACE FUNCTION public.validate_checkout_promo(_code text, _subtotal numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  rid uuid := gen_random_uuid();
  result text;
BEGIN
  INSERT INTO public.checkout_requests(request_id, request_kind, payload)
  VALUES (rid, 'promo', jsonb_build_object('code', _code, 'subtotal', _subtotal));
  result := current_setting('app.checkout_result', true);
  IF result IS NULL OR result = '' THEN RAISE EXCEPTION 'Could not validate promo code'; END IF;
  RETURN result::jsonb;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_checkout_promo(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_checkout_promo(text, numeric) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.place_cod_order(
  _full_name text, _phone text, _address text, _province text, _district text,
  _municipality text, _ward text, _tole text, _maps_link text, _notes text,
  _promo_code text, _items jsonb, _affiliate_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  rid uuid := gen_random_uuid();
  result text;
BEGIN
  INSERT INTO public.checkout_requests(request_id, request_kind, payload)
  VALUES (rid, 'order', jsonb_build_object(
    'full_name', _full_name, 'phone', _phone, 'address', _address,
    'province', _province, 'district', _district, 'municipality', _municipality,
    'ward', _ward, 'tole', _tole, 'maps_link', _maps_link, 'notes', _notes,
    'promo_code', _promo_code, 'items', _items, 'affiliate_code', _affiliate_code
  ));
  result := current_setting('app.checkout_result', true);
  IF result IS NULL OR result = '' THEN RAISE EXCEPTION 'Could not place order'; END IF;
  RETURN result::jsonb;
END;
$$;
REVOKE ALL ON FUNCTION public.place_cod_order(text,text,text,text,text,text,text,text,text,text,text,jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_cod_order(text,text,text,text,text,text,text,text,text,text,text,jsonb,text) TO anon, authenticated, service_role;