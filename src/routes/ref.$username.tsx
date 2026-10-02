import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Runs in the browser so referral links work on any host (no private keys needed).
export const Route = createFileRoute("/ref/$username")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Redirecting — Nextokart" },
    { name: "description", content: "Taking you to Nextokart." },
    { property: "og:title", content: "Nextokart" },
    { property: "og:description", content: "Shop shoes and electronics with Cash on Delivery all over Nepal." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: RefRedirect,
});

function RefRedirect() {
  const { username } = Route.useParams();
  const nav = useNavigate();
  useEffect(() => {
    const u = String(username || "").toLowerCase().trim().slice(0, 40);
    if (u) {
      document.cookie = `qk_ref=${encodeURIComponent(u)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      supabase.rpc("record_affiliate_click", { _username: u, _user_agent: navigator.userAgent }).then(() => {}, () => {});
    }
    nav({ to: "/", replace: true });
  }, [username, nav]);
  return <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">Loading…</div>;
}
