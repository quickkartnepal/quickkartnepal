CREATE OR REPLACE FUNCTION public.validate_checkout_promo(_code text, _subtotal numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.promo_codes%ROWTYPE;
  normalized text := upper(trim(_code));
  calculated numeric := 0;
BEGIN
  IF normalized = '' OR _subtotal < 0 THEN
    RAISE EXCEPTION 'Invalid promo code';
  END IF;

  SELECT * INTO p
  FROM public.promo_codes
  WHERE code = normalized AND is_active = true;

  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid promo code'; END IF;
  IF p.expires_at IS NOT NULL AND p.expires_at < now() THEN RAISE EXCEPTION 'Promo code expired'; END IF;
  IF p.usage_limit IS NOT NULL AND p.used_count >= p.usage_limit THEN RAISE EXCEPTION 'Promo code usage limit reached'; END IF;
  IF _subtotal < p.min_subtotal THEN RAISE EXCEPTION 'Minimum order Rs. % required', p.min_subtotal; END IF;

  calculated := CASE
    WHEN p.discount_type = 'percent' THEN round(_subtotal * p.discount_value / 100)
    ELSE least(p.discount_value, _subtotal)
  END;

  RETURN jsonb_build_object('code', normalized, 'discount', calculated, 'type', p.discount_type, 'value', p.discount_value);
END;
$$;

REVOKE ALL ON FUNCTION public.validate_checkout_promo(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_checkout_promo(text, numeric) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.place_cod_order(
  _full_name text,
  _phone text,
  _address text,
  _province text,
  _district text,
  _municipality text,
  _ward text,
  _tole text,
  _maps_link text,
  _notes text,
  _promo_code text,
  _items jsonb,
  _affiliate_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  product_row public.products%ROWTYPE;
  new_order public.orders%ROWTYPE;
  raw_subtotal numeric := 0;
  calculated_discount numeric := 0;
  normalized_promo text := NULL;
  product_count integer := 0;
  affiliate_row public.affiliates%ROWTYPE;
BEGIN
  IF length(trim(_full_name)) < 1 OR length(_full_name) > 120 THEN RAISE EXCEPTION 'Invalid full name'; END IF;
  IF length(trim(_phone)) < 5 OR length(_phone) > 20 THEN RAISE EXCEPTION 'Invalid phone number'; END IF;
  IF length(trim(_address)) < 3 OR length(_address) > 500 THEN RAISE EXCEPTION 'Invalid address'; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) < 1 OR jsonb_array_length(_items) > 50 THEN RAISE EXCEPTION 'Invalid order items'; END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(_items)
  LOOP
    IF COALESCE((item->>'quantity')::integer, 0) < 1 OR (item->>'quantity')::integer > 50 THEN
      RAISE EXCEPTION 'Invalid product quantity';
    END IF;
    SELECT * INTO product_row FROM public.products
      WHERE id = (item->>'product_id')::uuid AND is_active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Some products are unavailable'; END IF;
    raw_subtotal := raw_subtotal + COALESCE(product_row.discount_price, product_row.price) * (item->>'quantity')::integer;
    product_count := product_count + (item->>'quantity')::integer;
  END LOOP;

  IF _promo_code IS NOT NULL AND trim(_promo_code) <> '' THEN
    normalized_promo := upper(trim(_promo_code));
    SELECT (result->>'discount')::numeric INTO calculated_discount
    FROM (SELECT public.validate_checkout_promo(normalized_promo, raw_subtotal) AS result) checked;
  END IF;

  IF _affiliate_code IS NOT NULL AND trim(_affiliate_code) <> '' THEN
    SELECT * INTO affiliate_row FROM public.affiliates WHERE username = lower(trim(_affiliate_code));
  END IF;

  INSERT INTO public.orders (
    full_name, phone, address, province, district, municipality, ward, tole,
    maps_link, notes, subtotal, discount, delivery_charge, delivery_discount,
    promo_code, payment_method, status, user_id, affiliate_code
  ) VALUES (
    trim(_full_name), trim(_phone), trim(_address), nullif(trim(_province), ''),
    nullif(trim(_district), ''), nullif(trim(_municipality), ''), nullif(trim(_ward), ''),
    nullif(trim(_tole), ''), nullif(trim(_maps_link), ''), nullif(trim(_notes), ''),
    raw_subtotal - calculated_discount, calculated_discount, 150, 0,
    normalized_promo, 'COD', 'pending', auth.uid(), affiliate_row.username
  ) RETURNING * INTO new_order;

  FOR item IN SELECT value FROM jsonb_array_elements(_items)
  LOOP
    SELECT * INTO product_row FROM public.products WHERE id = (item->>'product_id')::uuid AND is_active = true;
    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity)
    VALUES (new_order.id, product_row.id, product_row.name, product_row.images[1],
      COALESCE(product_row.discount_price, product_row.price), (item->>'quantity')::integer);
  END LOOP;

  IF normalized_promo IS NOT NULL THEN
    UPDATE public.promo_codes SET used_count = used_count + 1 WHERE code = normalized_promo;
  END IF;

  IF affiliate_row.id IS NOT NULL THEN
    INSERT INTO public.affiliate_orders (affiliate_id, order_id, product_count, commission, status)
    VALUES (affiliate_row.id, new_order.id, product_count, product_count * 70, 'pending');
  END IF;

  RETURN jsonb_build_object(
    'id', new_order.id,
    'order_number', new_order.order_number,
    'subtotal', new_order.subtotal,
    'delivery_charge', new_order.delivery_charge
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_cod_order(text,text,text,text,text,text,text,text,text,text,text,jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_cod_order(text,text,text,text,text,text,text,text,text,text,text,jsonb,text) TO anon, authenticated, service_role;