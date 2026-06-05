ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS municipality TEXT,
  ADD COLUMN IF NOT EXISTS ward TEXT,
  ADD COLUMN IF NOT EXISTS tole TEXT,
  ADD COLUMN IF NOT EXISTS maps_link TEXT;

DELETE FROM public.order_items WHERE product_id IN (SELECT id FROM public.products WHERE slug IN ('himalayan-wool-shawl','brass-singing-bowl','pashmina-scarf','khukuri-knife-display','yak-wool-socks','mandala-wall-hanging','lokta-paper-journal','tibetan-prayer-flags'));
DELETE FROM public.product_reviews WHERE product_id IN (SELECT id FROM public.products WHERE slug IN ('himalayan-wool-shawl','brass-singing-bowl','pashmina-scarf','khukuri-knife-display','yak-wool-socks','mandala-wall-hanging','lokta-paper-journal','tibetan-prayer-flags'));
DELETE FROM public.products WHERE slug IN ('himalayan-wool-shawl','brass-singing-bowl','pashmina-scarf','khukuri-knife-display','yak-wool-socks','mandala-wall-hanging','lokta-paper-journal','tibetan-prayer-flags');