import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Login / Sign up — Quick Kart Nepal" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        if (!form.email) throw new Error("Email is required for account creation");
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: form.full_name, phone: form.phone },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome!");
        nav({ to: "/account" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Welcome back");
        nav({ to: "/account" });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="inline-flex w-full rounded-full bg-secondary p-1">
          <button onClick={() => setTab("login")} className={`flex-1 rounded-full py-2 text-sm font-semibold ${tab === "login" ? "bg-card shadow" : "text-muted-foreground"}`}>
            Login
          </button>
          <button onClick={() => setTab("signup")} className={`flex-1 rounded-full py-2 text-sm font-semibold ${tab === "signup" ? "bg-card shadow" : "text-muted-foreground"}`}>
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          {tab === "signup" && (
            <>
              <input required maxLength={120} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Full name" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input required maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </>
          )}
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <button disabled={busy} className="btn-gold w-full rounded-full py-2.5 text-sm font-semibold">
            {busy ? "Please wait…" : tab === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
