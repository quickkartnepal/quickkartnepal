import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PER_PRODUCT = 70;

function genCode() {
  // Short unique code, e.g. "qk8h2n9k3m"
  const rand = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
  return `qk${rand}`.slice(0, 12).toLowerCase();
}

async function getOrCreateAffiliate(userId: string) {
  const { data: existing } = await supabaseAdmin
    .from("affiliates")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing;

  for (let i = 0; i < 5; i++) {
    const code = genCode();
    const { data: taken } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("username", code)
      .maybeSingle();
    if (taken) continue;
    const { data: created, error } = await supabaseAdmin
      .from("affiliates")
      .insert({ user_id: userId, username: code })
      .select("*")
      .single();
    if (!error && created) return created;
  }
  throw new Error("Could not generate affiliate link, please retry");
}

export const signupAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const aff = await getOrCreateAffiliate(context.userId);
    return { id: aff.id, username: aff.username };
  });

async function assertAdminLocal(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin access required");
}

export const getMyAffiliate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const aff = await getOrCreateAffiliate(context.userId);

    const [{ count: clicks }, { data: aoRows }, { data: payReqs }] = await Promise.all([
      supabaseAdmin
        .from("affiliate_clicks")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", aff.id),
      supabaseAdmin
        .from("affiliate_orders")
        .select("*")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("affiliate_payment_requests")
        .select("*")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const orderIds = (aoRows ?? []).map((r) => r.order_id);
    let orders: any[] = [];
    let items: any[] = [];
    if (orderIds.length) {
      const [{ data: oData }, { data: iData }] = await Promise.all([
        supabaseAdmin
          .from("orders")
          .select("id,order_number,full_name,status,subtotal,created_at")
          .in("id", orderIds),
        supabaseAdmin
          .from("order_items")
          .select("order_id,product_name,quantity,unit_price")
          .in("order_id", orderIds),
      ]);
      orders = oData ?? [];
      items = iData ?? [];
    }

    const enriched = (aoRows ?? []).map((r) => ({
      ...r,
      order: orders.find((o) => o.id === r.order_id) ?? null,
      items: items.filter((it) => it.order_id === r.order_id),
    }));

    const totalEarnings = enriched.reduce((s, r) => s + Number(r.commission ?? 0), 0);
    const pendingEarnings = enriched
      .filter((r) => r.status === "pending")
      .reduce((s, r) => s + Number(r.commission ?? 0), 0);
    const paidEarnings = totalEarnings - pendingEarnings;
    const totalProducts = enriched.reduce((s, r) => s + Number(r.product_count ?? 0), 0);

    // Daily stats last 30 days
    const days: { date: string; earnings: number; orders: number; products: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(5, 10), earnings: 0, orders: 0, products: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    enriched.forEach((r) => {
      const k = new Date(r.created_at).toISOString().slice(5, 10);
      const i = idx.get(k);
      if (i != null) {
        days[i].earnings += Number(r.commission ?? 0);
        days[i].orders += 1;
        days[i].products += Number(r.product_count ?? 0);
      }
    });

    // Total withdrawn (approved requests)
    const withdrawn = (payReqs ?? [])
      .filter((p) => p.status === "approved")
      .reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const requestedPending = (payReqs ?? [])
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const availableBalance = Math.max(0, totalEarnings - withdrawn - requestedPending);

    return {
      affiliate: aff,
      stats: {
        clicks: clicks ?? 0,
        total_orders: enriched.length,
        total_products: totalProducts,
        total_earnings: totalEarnings,
        pending_earnings: pendingEarnings,
        paid_earnings: paidEarnings,
        withdrawn,
        available_balance: availableBalance,
        per_product: PER_PRODUCT,
      },
      daily: days,
      orders: enriched,
      payment_requests: payReqs ?? [],
    };
  });

// --- QR upload (signed) ---
export const createQrSignedUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ filename: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const aff = await getOrCreateAffiliate(context.userId);
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${aff.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("affiliate-qr")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path: signed.path, token: signed.token };
  });

export const requestPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().min(2).max(120),
        amount: z.number().min(1).max(1_000_000),
        qr_path: z.string().min(1).max(400).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const aff = await getOrCreateAffiliate(context.userId);
    const { error } = await supabaseAdmin.from("affiliate_payment_requests").insert({
      affiliate_id: aff.id,
      full_name: data.full_name,
      amount: data.amount,
      qr_path: data.qr_path ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Admin: list affiliates and payment requests ---
export const listAffiliatesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminLocal(context.supabase, context.userId);

    const { data: affs } = await supabaseAdmin
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });

    const ids = (affs ?? []).map((a) => a.id);
    const [{ data: aoRows }, { data: clickRows }, { data: profs }] = await Promise.all([
      ids.length
        ? supabaseAdmin.from("affiliate_orders").select("affiliate_id,commission,product_count,status").in("affiliate_id", ids)
        : Promise.resolve({ data: [] as any[] }),
      ids.length
        ? supabaseAdmin.from("affiliate_clicks").select("affiliate_id").in("affiliate_id", ids)
        : Promise.resolve({ data: [] as any[] }),
      supabaseAdmin.from("profiles").select("id,full_name,phone").in("id", (affs ?? []).map((a) => a.user_id)),
    ]);

    const enriched = (affs ?? []).map((a) => {
      const ao = (aoRows ?? []).filter((r: any) => r.affiliate_id === a.id);
      const cl = (clickRows ?? []).filter((r: any) => r.affiliate_id === a.id);
      const prof = (profs ?? []).find((p: any) => p.id === a.user_id);
      return {
        ...a,
        full_name: prof?.full_name ?? null,
        phone: prof?.phone ?? null,
        clicks: cl.length,
        total_orders: ao.length,
        total_products: ao.reduce((s: number, r: any) => s + Number(r.product_count ?? 0), 0),
        total_earnings: ao.reduce((s: number, r: any) => s + Number(r.commission ?? 0), 0),
      };
    });
    return { affiliates: enriched };
  });

export const listPaymentRequestsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminLocal(context.supabase, context.userId);

    const { data: reqs } = await supabaseAdmin
      .from("affiliate_payment_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    const affIds = Array.from(new Set((reqs ?? []).map((r) => r.affiliate_id)));
    const { data: affs } = affIds.length
      ? await supabaseAdmin.from("affiliates").select("id,username,user_id").in("id", affIds)
      : { data: [] as any[] };

    // Sign QR urls
    const enriched = await Promise.all(
      (reqs ?? []).map(async (r) => {
        let qr_url: string | null = null;
        if (r.qr_path) {
          const { data: s } = await supabaseAdmin.storage
            .from("affiliate-qr")
            .createSignedUrl(r.qr_path, 60 * 60);
          qr_url = s?.signedUrl ?? null;
        }
        const aff = (affs ?? []).find((a: any) => a.id === r.affiliate_id);
        return { ...r, qr_url, affiliate: aff ?? null };
      }),
    );
    return { requests: enriched };
  });

export const updatePaymentRequestAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected", "pending"]),
        admin_note: z.string().max(500).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdminLocal(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("affiliate_payment_requests")
      .update({ status: data.status, admin_note: data.admin_note ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
