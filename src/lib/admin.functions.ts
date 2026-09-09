import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// --- Admin dashboard stats ---------------------------------------
export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const [
      { count: ordersCount },
      { count: productsCount },
      { count: customersCount },
      { data: allOrders },
      { data: recentOrders },
      { data: items },
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("id,subtotal,delivery_charge,status,created_at"),
      supabaseAdmin
        .from("orders")
        .select("id,order_number,full_name,subtotal,delivery_charge,status,created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("order_items")
        .select("product_id,product_name,product_image,quantity,unit_price"),
    ]);

    const totalSales = (allOrders ?? [])
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + Number(o.subtotal ?? 0) + Number(o.delivery_charge ?? 0), 0);
    const totalRevenue = (allOrders ?? []).reduce((s, o) => s + Number(o.subtotal ?? 0) + Number(o.delivery_charge ?? 0), 0);

    // Daily last 30 days
    const days: { date: string; sales: number; orders: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key.slice(5), sales: 0, orders: 0 });
    }
    const dayIdx = new Map(days.map((d, i) => [d.date, i]));
    (allOrders ?? []).forEach((o) => {
      const k = new Date(o.created_at).toISOString().slice(5, 10);
      const i = dayIdx.get(k);
      if (i != null) {
        days[i].sales += Number(o.subtotal ?? 0) + Number(o.delivery_charge ?? 0);
        days[i].orders += 1;
      }
    });

    // Monthly last 12 months
    const months: { month: string; sales: number; orders: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      months.push({ month: key, sales: 0, orders: 0 });
    }
    const monthIdx = new Map(months.map((m, i) => [m.month, i]));
    (allOrders ?? []).forEach((o) => {
      const d = new Date(o.created_at);
      const k = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const i = monthIdx.get(k);
      if (i != null) {
        months[i].sales += Number(o.subtotal ?? 0) + Number(o.delivery_charge ?? 0);
        months[i].orders += 1;
      }
    });

    // Top products
    const agg = new Map<string, { product_id: string; product_name: string; product_image: string | null; units: number; revenue: number }>();
    (items ?? []).forEach((it) => {
      if (!it.product_id) return;
      const cur = agg.get(it.product_id) ?? {
        product_id: it.product_id,
        product_name: it.product_name,
        product_image: it.product_image,
        units: 0,
        revenue: 0,
      };
      cur.units += Number(it.quantity ?? 0);
      cur.revenue += Number(it.unit_price ?? 0) * Number(it.quantity ?? 0);
      agg.set(it.product_id, cur);
    });
    const topProducts = Array.from(agg.values()).sort((a, b) => b.units - a.units).slice(0, 8);

    return {
      totals: {
        orders: ordersCount ?? 0,
        sales: totalSales,
        revenue: totalRevenue,
        products: productsCount ?? 0,
        customers: customersCount ?? 0,
      },
      daily: days,
      monthly: months,
      recentOrders: recentOrders ?? [],
      topProducts,
    };
  });

const ADMIN_EMAIL = "infoquickkartnepal@gmail.com";
const ADMIN_PASSWORD = "Rgsbqkno$777";

// 50-year signed URL (effectively permanent for our needs)
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 50;

export const ensureAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw new Error(listErr.message);
  let user = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      const { data: list2 } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      user = list2?.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      if (!user) throw new Error(error.message);
    } else {
      user = data.user!;
    }
  }

  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
  if (roleErr) throw new Error(roleErr.message);

  return { ok: true };
});

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

// --- Storage uploads (signed-upload flow) -------------------------
const BUCKETS = ["product-images", "product-videos", "banners"] as const;
type Bucket = (typeof BUCKETS)[number];

export const createSignedUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        bucket: z.enum(BUCKETS),
        filename: z.string().min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path: signed.path, token: signed.token, bucket: data.bucket };
  });

export const getSignedDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ bucket: z.enum(BUCKETS), path: z.string().min(1).max(400) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: signed, error } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUrl(data.path, SIGNED_URL_TTL);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

// --- Products -----------------------------------------------------
const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(""),
  price: z.number().min(0),
  discount_price: z.number().min(0).nullable().optional(),
  images: z.array(z.string().url()).max(10).default([]),
  video_url: z.string().url().nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  is_featured: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("products").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    // Generate unique slug from name
    let base = toSlug(rest.name) || "product";
    let slug = base;
    let i = 1;
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      i += 1;
      slug = `${base}-${i}`;
    }
    const { data: created, error } = await supabaseAdmin
      .from("products")
      .insert({ ...rest, slug })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Orders -------------------------------------------------------
export const listOrdersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (orders ?? []).map((o) => o.id);
    let items: any[] = [];
    if (ids.length) {
      const { data: it, error: e2 } = await supabaseAdmin.from("order_items").select("*").in("order_id", ids);
      if (e2) throw new Error(e2.message);
      items = it ?? [];
    }
    return {
      orders: (orders ?? []).map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) })),
    };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Banners ------------------------------------------------------
const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  image_url: z.string().url(),
  link_url: z.string().url().nullable().optional(),
  title: z.string().max(200).default(""),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const upsertBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => bannerSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("banners").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await supabaseAdmin
      .from("banners")
      .insert(rest)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("banners").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Promo codes --------------------------------------------------
const promoSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().min(0),
  min_subtotal: z.number().min(0).default(0),
  usage_limit: z.number().int().min(0).nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const upsertPromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => promoSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    const payload = { ...rest, code: rest.code.toUpperCase() };
    if (id) {
      const { error } = await supabaseAdmin.from("promo_codes").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await supabaseAdmin
      .from("promo_codes")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deletePromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("promo_codes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Admin password change ---------------------------------------
export const changeAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ new_password: z.string().min(8).max(72) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.new_password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Admin login step 1: verify password WITHOUT creating a session ----
export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: res, error } = await client.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error || !res.user) throw new Error("Invalid email or password");
    // Immediately discard the session — the browser only gets a session after
    // the emailed verification code/link is confirmed.
    await client.auth.signOut();

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", res.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("This account is not an administrator");
    return { ok: true };
  });
