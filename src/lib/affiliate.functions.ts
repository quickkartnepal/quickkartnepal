import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_]+$/i, "Only letters, numbers, and underscore")
  .transform((s) => s.toLowerCase());

export const signupAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ username: usernameSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: existing } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) throw new Error("You are already registered as an affiliate");

    const { data: takenU } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("username", data.username)
      .maybeSingle();
    if (takenU) throw new Error("Username already taken");

    const { data: created, error } = await supabaseAdmin
      .from("affiliates")
      .insert({ user_id: userId, username: data.username })
      .select("id,username")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id, username: created.username };
  });

export const getMyAffiliate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: aff } = await supabaseAdmin
      .from("affiliates")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!aff) return { affiliate: null };

    const [{ count: clicks }, { data: aoRows }] = await Promise.all([
      supabaseAdmin
        .from("affiliate_clicks")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", aff.id),
      supabaseAdmin
        .from("affiliate_orders")
        .select("*")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const orderIds = (aoRows ?? []).map((r) => r.order_id);
    let orders: any[] = [];
    if (orderIds.length) {
      const { data: oData } = await supabaseAdmin
        .from("orders")
        .select("id,order_number,full_name,status,subtotal,created_at")
        .in("id", orderIds);
      orders = oData ?? [];
    }

    const enriched = (aoRows ?? []).map((r) => ({
      ...r,
      order: orders.find((o) => o.id === r.order_id) ?? null,
    }));

    const totalEarnings = enriched.reduce((s, r) => s + Number(r.commission ?? 0), 0);
    const pendingEarnings = enriched
      .filter((r) => r.status === "pending")
      .reduce((s, r) => s + Number(r.commission ?? 0), 0);
    const paidEarnings = totalEarnings - pendingEarnings;

    return {
      affiliate: aff,
      stats: {
        clicks: clicks ?? 0,
        total_orders: enriched.length,
        total_earnings: totalEarnings,
        pending_earnings: pendingEarnings,
        paid_earnings: paidEarnings,
        per_product: 70,
      },
      orders: enriched,
    };
  });
