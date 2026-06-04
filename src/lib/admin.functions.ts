import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "infoquickkartnepal@gmail.com";
const ADMIN_PASSWORD = "Rgsbqkno$777";

/**
 * Idempotently ensures the configured admin user exists and has the admin role.
 * Safe to call from the public admin-login page so the owner can log in first time.
 */
export const ensureAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  // Find existing user
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);
  let user = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    user = data.user!;
  }

  // Ensure admin role
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
  if (roleErr) throw new Error(roleErr.message);

  return { ok: true };
});

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).default(""),
  price: z.number().min(0),
  discount_price: z.number().min(0).nullable().optional(),
  images: z.array(z.string().url()).max(10).default([]),
  video_url: z.string().url().nullable().optional(),
  rating: z.number().min(0).max(5).default(4.5),
  category: z.string().max(80).nullable().optional(),
  is_featured: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  is_active: z.boolean().default(true),
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
    const { data: created, error } = await supabaseAdmin
      .from("products")
      .insert(rest)
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
      const { data: it, error: e2 } = await supabaseAdmin
        .from("order_items")
        .select("*")
        .in("order_id", ids);
      if (e2) throw new Error(e2.message);
      items = it ?? [];
    }
    return {
      orders: (orders ?? []).map((o) => ({
        ...o,
        items: items.filter((i) => i.order_id === o.id),
      })),
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
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
