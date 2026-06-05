
-- Remove permissive public INSERT policies; all writes go through the server (service role)
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
DROP POLICY IF EXISTS "Anyone can post reviews" ON public.product_reviews;

-- user_roles: explicitly block writes from anon/authenticated (service role bypasses RLS)
CREATE POLICY "No client inserts on user_roles"
  ON public.user_roles FOR INSERT TO anon, authenticated
  WITH CHECK (false);
CREATE POLICY "No client updates on user_roles"
  ON public.user_roles FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes on user_roles"
  ON public.user_roles FOR DELETE TO anon, authenticated
  USING (false);

-- Allow anon/authenticated to call has_role (used in product/banner SELECT policies)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

-- Storage policies for our 3 private buckets: public read, admin-only write
CREATE POLICY "Public read product/banner objects"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('product-images', 'product-videos', 'banners'));

CREATE POLICY "Admins insert product/banner objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('product-images', 'product-videos', 'banners')
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins update product/banner objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('product-images', 'product-videos', 'banners')
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    bucket_id IN ('product-images', 'product-videos', 'banners')
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Admins delete product/banner objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('product-images', 'product-videos', 'banners')
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
