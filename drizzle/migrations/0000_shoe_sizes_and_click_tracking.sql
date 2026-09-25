ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size text;

CREATE OR REPLACE FUNCTION public.record_affiliate_click(_username text, _user_agent text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE aid uuid;
BEGIN
  SELECT id INTO aid FROM public.affiliates WHERE username = lower(trim(_username));
  IF aid IS NULL THEN RETURN false; END IF;
  INSERT INTO public.affiliate_clicks(affiliate_id, user_agent) VALUES (aid, left(_user_agent, 200));
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.record_affiliate_click(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.process_checkout_request()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
  item_size text;
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
    item_size := nullif(trim(item->>'size'), '');
    IF cardinality(product_row.sizes) > 0 THEN
      IF item_size IS NULL THEN RAISE EXCEPTION 'Please choose a size for %', product_row.name; END IF;
      IF NOT (item_size = ANY(product_row.sizes)) THEN RAISE EXCEPTION 'Size % is out of stock for %', item_size, product_row.name; END IF;
    END IF;
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
    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity, size)
    VALUES (new_order.id, product_row.id, product_row.name, product_row.images[1],
      COALESCE(product_row.discount_price, product_row.price), (item->>'quantity')::integer,
      nullif(trim(item->>'size'), ''));
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
$function$;