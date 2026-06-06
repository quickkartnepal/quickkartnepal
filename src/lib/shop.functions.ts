import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const validatePromo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().min(0) }).parse(input),
  )
  .handler(async ({ data }) => {
    const code = data.code.toUpperCase();
    const { data: promo, error } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!promo) throw new Error("Invalid promo code");
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) throw new Error("Promo code expired");
    if (promo.usage_limit != null && promo.used_count >= promo.usage_limit) throw new Error("Promo code usage limit reached");
    if (Number(data.subtotal) < Number(promo.min_subtotal)) {
      throw new Error(`Minimum order Rs. ${Number(promo.min_subtotal).toLocaleString()} required`);
    }
    const discount =
      promo.discount_type === "percent"
        ? Math.round((Number(data.subtotal) * Number(promo.discount_value)) / 100)
        : Math.min(Number(promo.discount_value), Number(data.subtotal));
    return { code, discount, type: promo.discount_type, value: Number(promo.discount_value) };
  });

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(1).max(120),
        phone: z.string().trim().min(5).max(20),
        address: z.string().trim().min(3).max(500),
        province: z.string().trim().max(80).optional().nullable(),
        district: z.string().trim().max(80).optional().nullable(),
        municipality: z.string().trim().max(120).optional().nullable(),
        ward: z.string().trim().max(10).optional().nullable(),
        tole: z.string().trim().max(120).optional().nullable(),
        maps_link: z.string().trim().max(500).optional().nullable(),
        notes: z.string().trim().max(500).optional().nullable(),
        promo_code: z.string().trim().max(40).optional().nullable(),
        user_id: z.string().uuid().optional().nullable(),
        items: z
          .array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(50) }))
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

    let discount = 0;
    let promoCode: string | null = null;
    if (data.promo_code) {
      const code = data.promo_code.toUpperCase();
      const { data: promo } = await supabaseAdmin
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (promo) {
        const expired = promo.expires_at && new Date(promo.expires_at) < new Date();
        const used = promo.usage_limit != null && promo.used_count >= promo.usage_limit;
        if (!expired && !used && subtotal >= Number(promo.min_subtotal)) {
          discount =
            promo.discount_type === "percent"
              ? Math.round((subtotal * Number(promo.discount_value)) / 100)
              : Math.min(Number(promo.discount_value), subtotal);
          promoCode = code;
          await supabaseAdmin
            .from("promo_codes")
            .update({ used_count: (promo.used_count ?? 0) + 1 })
            .eq("id", promo.id);
        }
      }
    }

    // Affiliate attribution via qk_ref cookie
    let affiliateId: string | null = null;
    let affiliateCode: string | null = null;
    try {
      const req = getRequest();
      const cookieHeader = req?.headers.get("cookie") ?? "";
      const match = cookieHeader.match(/(?:^|;\s*)qk_ref=([^;]+)/);
      if (match) {
        const ref = decodeURIComponent(match[1]).toLowerCase().slice(0, 40);
        const { data: aff } = await supabaseAdmin
          .from("affiliates")
          .select("id,username")
          .eq("username", ref)
          .maybeSingle();
        if (aff) {
          affiliateId = aff.id;
          affiliateCode = aff.username;
        }
      }
    } catch {}

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        full_name: data.full_name,
        phone: data.phone,
        address: data.address,
        province: data.province ?? null,
        district: data.district ?? null,
        municipality: data.municipality ?? null,
        ward: data.ward ?? null,
        tole: data.tole ?? null,
        maps_link: data.maps_link ?? null,
        notes: data.notes ?? null,
        subtotal: subtotal - discount,
        discount,
        promo_code: promoCode,
        payment_method: "COD",
        status: "pending",
        user_id: data.user_id ?? null,
        affiliate_code: affiliateCode,
      })
      .select("id,order_number")
      .single();
    if (oErr) throw new Error(oErr.message);

    if (affiliateId) {
      const productCount = data.items.reduce((s, i) => s + i.quantity, 0);
      await supabaseAdmin.from("affiliate_orders").insert({
        affiliate_id: affiliateId,
        order_id: order.id,
        product_count: productCount,
        commission: productCount * 70,
        status: "pending",
      });
    }


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

    return { order_number: order.order_number, id: order.id, subtotal: subtotal - discount };
  });

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        product_id: z.string().uuid(),
        name: z.string().trim().min(1).max(80),
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().min(1).max(1000),
        user_id: z.string().uuid().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    let verified = false;
    if (data.user_id) {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("user_id", data.user_id)
        .eq("status", "delivered");
      const orderIds = (orders ?? []).map((o) => o.id);
      if (orderIds.length) {
        const { data: items } = await supabaseAdmin
          .from("order_items")
          .select("id")
          .eq("product_id", data.product_id)
          .in("order_id", orderIds)
          .limit(1);
        verified = (items ?? []).length > 0;
      }
    }
    const { error } = await supabaseAdmin.from("product_reviews").insert({
      product_id: data.product_id,
      name: data.name,
      rating: data.rating,
      comment: data.comment,
      user_id: data.user_id ?? null,
      verified,
    });
    if (error) throw new Error(error.message);
    return { ok: true, verified };
  });
