import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { signupAffiliate } from "@/lib/affiliate.functions";
import { toast } from "sonner";
import { CheckCircle2, Globe, Wallet, Sparkles } from "lucide-react";

export const Route = createFileRoute("/affiliate")({
  head: () => ({
    meta: [
      { title: "Affiliate Partner Program — Quick Kart Nepal" },
      {
        name: "description",
        content:
          "Join the Quick Kart Nepal affiliate program. Share your link, refer customers, and earn Rs. 70 for every product sold — no investment, work from anywhere.",
      },
      { property: "og:title", content: "Affiliate Partner Program — Quick Kart Nepal" },
      {
        property: "og:description",
        content: "Earn Rs. 70 per product sold through your unique affiliate link.",
      },
    ],
  }),
  component: AffiliatePage,
});

function AffiliatePage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const signupFn = useServerFn(signupAffiliate);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "", username: "" });

  useEffect(() => {
    if (!loading && user) {
      // Check if already an affiliate, then jump to dashboard
      nav({ to: "/affiliate/dashboard" });
    }
  }, [loading, user, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        if (!form.email) throw new Error("Email is required");
        if (!/^[a-z0-9_]{3,30}$/i.test(form.username)) throw new Error("Username: 3–30 letters/numbers/underscore");
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: form.full_name, phone: form.phone },
          },
        });
        if (error) throw error;
        // Wait briefly for session, then claim username
        await new Promise((r) => setTimeout(r, 400));
        try {
          await signupFn({ data: { username: form.username } });
        } catch (err: any) {
          toast.error(err?.message ?? "Affiliate username could not be claimed — try again in the dashboard");
        }
        toast.success("Affiliate account created!");
        nav({ to: "/affiliate/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Welcome back");
        nav({ to: "/affiliate/dashboard" });
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Marketing copy */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Affiliate Partner Program
          </div>
          <h1 className="mt-3 font-display text-3xl text-primary sm:text-4xl">
            Earn Rs. 70 for every product you refer
          </h1>
          <p className="mt-4 text-muted-foreground">
            The Quick Kart Nepal Affiliate Program lets anyone earn real income by simply sharing products
            they love. Whether you're a student, content creator, housewife, or full-time professional —
            you can turn your network into a steady source of income, without spending a single rupee.
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">How affiliate marketing works</h2>
            <p className="text-sm text-muted-foreground">
              Affiliate marketing is the simplest way to earn online. You promote a brand's products using a
              special link, and when someone buys through your link, you get a commission. No stock to keep,
              no orders to ship, no customer support — we handle everything.
            </p>
            <ol className="mt-2 space-y-2 text-sm">
              <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Sign up — get your unique link instantly: <span className="font-mono text-xs">quickkartnepal.com/ref/your-name</span></li>
              <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Share — on TikTok, Instagram, WhatsApp, Facebook, or anywhere your audience hangs out</li>
              <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Earn — Rs. 70 added to your account for every product sold via your link</li>
            </ol>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Benefit icon={Wallet} title="Zero investment" text="No upfront cost. No inventory." />
            <Benefit icon={Globe} title="Work from anywhere" text="Just need a phone and internet." />
            <Benefit icon={CheckCircle2} title="Easy & transparent" text="Real-time clicks, orders, and earnings." />
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-secondary/40 p-5 text-sm">
            <strong className="text-primary">Real example:</strong> Share your link with 100 friends. If just 10 of
            them buy 2 products each, that's <strong>20 products × Rs. 70 = Rs. 1,400</strong> in your pocket — for
            something as simple as sharing a link.
          </div>
        </div>

        {/* Auth panel */}
        <div>
          <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="inline-flex w-full rounded-full bg-secondary p-1">
              <button onClick={() => setTab("login")} className={`flex-1 rounded-full py-2 text-sm font-semibold ${tab === "login" ? "bg-card shadow" : "text-muted-foreground"}`}>
                Affiliate Login
              </button>
              <button onClick={() => setTab("signup")} className={`flex-1 rounded-full py-2 text-sm font-semibold ${tab === "signup" ? "bg-card shadow" : "text-muted-foreground"}`}>
                Become an Affiliate
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              {tab === "signup" && (
                <>
                  <input required maxLength={120} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Full name" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <input required maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone number" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <div>
                    <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <span className="mr-1 text-muted-foreground">quickkartnepal.com/ref/</span>
                      <input required maxLength={30} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-z0-9_]/gi, "") })}
                        placeholder="yourname" className="flex-1 bg-transparent outline-none" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Your unique affiliate link.</p>
                  </div>
                </>
              )}
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button disabled={busy} className="btn-gold w-full rounded-full py-2.5 text-sm font-semibold">
                {busy ? "Please wait…" : tab === "signup" ? "Create affiliate account" : "Sign in"}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Already shopping with us? <Link to="/auth" className="text-primary">Customer login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Benefit({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{text}</div>
    </div>
  );
}
