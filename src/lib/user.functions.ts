import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(1).max(120),
        phone: z.string().trim().min(5).max(20),
        address: z.string().trim().max(500).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...data }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (orders ?? []).map((o) => o.id);
    let items: any[] = [];
    if (ids.length) {
      const { data: it } = await supabase.from("order_items").select("*").in("order_id", ids);
      items = it ?? [];
    }
    return {
      orders: (orders ?? []).map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) })),
    };
  });
