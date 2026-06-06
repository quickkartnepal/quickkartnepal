import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ref/$username")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const username = String(params.username || "").toLowerCase().slice(0, 40);
        const cookie = `qk_ref=${encodeURIComponent(username)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;

        // Fire and forget click tracking
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: aff } = await supabaseAdmin
            .from("affiliates")
            .select("id")
            .eq("username", username)
            .maybeSingle();
          if (aff) {
            const ip =
              request.headers.get("cf-connecting-ip") ||
              request.headers.get("x-forwarded-for") ||
              "";
            const ua = request.headers.get("user-agent") || "";
            await supabaseAdmin.from("affiliate_clicks").insert({
              affiliate_id: aff.id,
              ip_hash: ip ? Buffer.from(ip).toString("base64").slice(0, 32) : null,
              user_agent: ua.slice(0, 200),
            });
          }
        } catch {
          // ignore tracking errors
        }

        return new Response(null, {
          status: 302,
          headers: { Location: "/", "Set-Cookie": cookie },
        });
      },
    },
  },
});
