import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { ensureAdminUser } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — Quick Kart Nepal" }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const ensure = useServerFn(ensureAdminUser);
  const nav = useNavigate();
  const [email, setEmail] = useState("infoquickkartnepal@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Ensure the admin user record exists on first visit (idempotent)
  useEffect(() => {
    ensure().catch(() => {});
  }, [ensure]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back");
      nav({ to: "/admin/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-display text-2xl text-primary">Admin Login</h1>
        <p className="mt-1 text-xs text-muted-foreground">Restricted access. Authorized personnel only.</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Email" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Password" />
          <button disabled={busy} className="btn-gold w-full rounded-full py-2.5 text-sm font-semibold">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
