import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(1).max(120),
        phone: z.string().trim().min(5).max(20),
        address: z.string().trim().min(3).max(500),
        notes: z.string().trim().max(500).optional().nullable(),
        items: z
          .array(
            z.object({
              product_id: z.string().uuid(),
              quantity: z.number().int().min(1).max(50),
            }),
          )
          .min(1)
          .max(50),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,name,price,discount_price,images,is_active")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    const active = (products ?? []).filter((p) => p.is_active);
    if (active.length !== ids.length) throw new Error("Some products are unavailable");

    const lineItems = data.items.map((it) => {
      const p = active.find((x) => x.id === it.product_id)!;
      const unit = Number(p.discount_price ?? p.price);
      return {
        product_id: p.id,
        product_name: p.name,
        product_image: p.images?.[0] ?? null,
        unit_price: unit,
        quantity: it.quantity,
        line_total: unit * it.quantity,
      };
    });
    const subtotal = lineItems.reduce((s, l) => s + l.line_total, 0);

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        full_name: data.full_name,
        phone: data.phone,
        address: data.address,
        notes: data.notes ?? null,
        subtotal,
        payment_method: "COD",
        status: "pending",
      })
      .select("id,order_number")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await supabaseAdmin.from("order_items").insert(
      lineItems.map((l) => ({
        order_id: order.id,
        product_id: l.product_id,
        product_name: l.product_name,
        product_image: l.product_image,
        unit_price: l.unit_price,
        quantity: l.quantity,
      })),
    );
    if (iErr) throw new Error(iErr.message);

    return { order_number: order.order_number, id: order.id, subtotal };
  });

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        product_id: z.string().uuid(),
        name: z.string().trim().min(1).max(80),
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().min(1).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("product_reviews").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
