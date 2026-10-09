import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const BASE = "https://nextokart.lovable.app";
const STATIC = ["/", "/about", "/contact", "/return-policy", "/affiliate"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await supabase
          .from("products")
          .select("slug")
          .eq("is_active", true)
          .range(0, 4999);
        if (error) return new Response("Sitemap unavailable", { status: 500 });
        const urls = [...STATIC, ...(data ?? []).map((p) => `/products/${encodeURIComponent(p.slug)}`)];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${BASE}${u}</loc></url>`)
          .join("\n")}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
