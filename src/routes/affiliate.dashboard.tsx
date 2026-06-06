import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getMyAffiliate, signupAffiliate } from "@/lib/affiliate.functions";
import { toast } from "sonner";
import { Copy, LogOut, MousePointerClick, Package, Wallet, Clock } from "lucide-react";

export const Route = createFileRoute("/affiliate/dashboard")({
  head: () => ({ meta: [{ title: "Affiliate Dashboard — Quick Kart Nepal" }, { name: "robots", content: "noindex" }] }),
  component: AffiliateDashboard,
});

function AffiliateDashboard() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getMyAffiliate);
  const signupFn = useServerFn(signupAffiliate);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/affiliate" });
  }, [loading, user, nav]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-affiliate"],
    queryFn: () => fetchFn(),
    enabled: !!user,
  });

  const [username, setUsername] = useState("");
  const claim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signupFn({ data: { username } });
      toast.success("Affiliate link created!");
      qc.invalidateQueries({ queryKey: ["my-affiliate"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const [pw, setPw] = useState("");
  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Password updated");
      setPw("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  if (loading || !user || isLoading) return <div className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Loading…</div>;

  // Not yet enrolled — claim a username
  if (!data?.affiliate) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-2xl text-primary">Activate your affiliate account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pick a unique username to get your affiliate link.</p>
        <form onSubmit={claim} className="mt-5 space-y-3 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
            <span className="mr-1 text-muted-foreground">quickkartnepal.com/ref/</span>
            <input required maxLength={30} value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())}
              placeholder="yourname" className="flex-1 bg-transparent outline-none" />
          </div>
          <button className="btn-gold w-full rounded-full py-2.5 text-sm font-semibold">Create affiliate link</button>
        </form>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://quickkartnepal.com";
  const link = `${origin}/ref/${data.affiliate.username}`;
  const stats = data.stats!;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary">Affiliate Dashboard</h1>
          <p className="text-xs text-muted-foreground">{user.email} · @{data.affiliate.username}</p>
        </div>
        <button onClick={async () => { await signOut(); nav({ to: "/affiliate" }); }}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {/* Affiliate link */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your affiliate link</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="flex-1 break-all rounded-md bg-secondary px-3 py-2 text-sm">{link}</code>
          <button onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copied"); }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Copy className="h-4 w-4" /> Copy
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Earn <strong>Rs. {stats.per_product}</strong> for every product sold through this link.</p>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MousePointerClick} label="Total Clicks" value={stats.clicks.toLocaleString()} />
        <StatCard icon={Package} label="Total Orders" value={stats.total_orders.toLocaleString()} />
        <StatCard icon={Wallet} label="Total Earnings" value={`Rs. ${stats.total_earnings.toLocaleString()}`} />
        <StatCard icon={Clock} label="Pending Earnings" value={`Rs. ${stats.pending_earnings.toLocaleString()}`} />
      </div>

      {/* Orders */}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold">Referred orders</h2>
        {data.orders.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No orders yet. Share your link to start earning!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3">Order</th><th className="p-3">Date</th><th className="p-3">Products</th><th className="p-3">Commission</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {data.orders.map((r: any) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs text-primary">{r.order?.order_number ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3">{r.product_count}</td>
                    <td className="p-3 font-semibold">Rs. {Number(r.commission).toLocaleString()}</td>
                    <td className="p-3 text-xs capitalize">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password change */}
      <div className="mt-8 max-w-md">
        <h2 className="mb-3 font-semibold">Account settings</h2>
        <form onSubmit={changePw} className="space-y-3 rounded-xl border border-border bg-card p-5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Change password</label>
          <input required type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)}
            placeholder="New password" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <button className="w-full rounded-full border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
            Update password
          </button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Need help? <Link to="/contact" className="text-primary">Contact support</Link>
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
