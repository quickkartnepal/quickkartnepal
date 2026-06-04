
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(10,2) CHECK (discount_price IS NULL OR discount_price >= 0),
  images TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
  category TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Product reviews
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (length(comment) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.product_reviews TO anon, authenticated;
GRANT ALL ON public.product_reviews TO service_role;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON public.product_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can post reviews" ON public.product_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins delete reviews" ON public.product_reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('QKN-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8))),
  full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 120),
  phone TEXT NOT NULL CHECK (length(phone) BETWEEN 5 AND 20),
  address TEXT NOT NULL CHECK (length(address) BETWEEN 3 AND 500),
  notes TEXT,
  subtotal NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'COD',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (payment_method = 'COD');
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.order_items TO anon, authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed sample products
INSERT INTO public.products (name, slug, description, price, discount_price, images, rating, category, is_featured, is_trending) VALUES
('Himalayan Wool Shawl', 'himalayan-wool-shawl', 'Soft handwoven wool shawl from the Himalayas. Warm, lightweight, and elegant — perfect for chilly evenings.', 2499, 1799, ARRAY['https://images.unsplash.com/photo-1601244005535-a48d21d951ac?w=800','https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800'], 4.7, 'Apparel', true, true),
('Brass Singing Bowl', 'brass-singing-bowl', 'Authentic Nepali singing bowl, handcrafted by artisans in Patan. Includes wooden striker.', 3499, 2799, ARRAY['https://images.unsplash.com/photo-1591291621164-2c6367723315?w=800'], 4.8, 'Home', true, false),
('Pashmina Scarf', 'pashmina-scarf', '100% pure pashmina scarf. Luxuriously soft and warm.', 1899, NULL, ARRAY['https://images.unsplash.com/photo-1601762603339-fd61e28b698a?w=800'], 4.6, 'Apparel', true, true),
('Khukuri Knife (Display)', 'khukuri-knife-display', 'Traditional Nepali khukuri for display. Hand-forged blade with wooden sheath.', 4999, 3999, ARRAY['https://images.unsplash.com/photo-1589998059171-988d887df646?w=800'], 4.9, 'Heritage', false, true),
('Hand-knit Yak Wool Socks', 'yak-wool-socks', 'Cozy yak wool socks knitted in the mountains of Nepal.', 899, 699, ARRAY['https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800'], 4.5, 'Apparel', false, true),
('Mandala Wall Hanging', 'mandala-wall-hanging', 'Beautifully embroidered mandala wall hanging. A statement piece for any room.', 1599, 1199, ARRAY['https://images.unsplash.com/photo-1582582494700-08e98c91229e?w=800'], 4.4, 'Home', true, false),
('Lokta Paper Journal', 'lokta-paper-journal', 'Eco-friendly Lokta paper journal, perfect for notes, sketches, and travel.', 599, NULL, ARRAY['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800'], 4.6, 'Stationery', false, true),
('Tibetan Prayer Flags', 'tibetan-prayer-flags', 'Five-color prayer flags. Cotton, hand-printed with traditional Buddhist mantras.', 499, 349, ARRAY['https://images.unsplash.com/photo-1604608672516-f1b9b1d1a1cf?w=800'], 4.8, 'Heritage', true, true);
