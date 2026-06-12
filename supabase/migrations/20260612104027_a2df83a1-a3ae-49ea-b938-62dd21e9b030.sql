ALTER TABLE public.orders ADD COLUMN delivery_charge integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN delivery_discount integer NOT NULL DEFAULT 0;