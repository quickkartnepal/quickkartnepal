import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyAffiliate,
  createQrSignedUpload,
  requestPayment,
} from "@/lib/affiliate.functions";
import { toast } from "sonner";
import {
  Copy, LogOut, MousePointerClick, Package, Wallet, Clock, TrendingUp, Upload,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/affiliate/dashboard")({
  head: () => ({ meta: [{ title: "Affiliate Dashboard — Quick Kart Nepal" }, { name: "robots", content: "noindex" }] }),
  component: AffiliateDashboard,
});

function AffiliateDashboard() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getMyAffiliate);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/affiliate" });
  }, [loading, user, nav]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-affiliate"],
    queryFn: () => fetchFn(),
    enabled: !!user,
    retry: 1,
  });

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
  if (error || !data?.affiliate) return <div className="mx-auto max-w-4xl px-4 py-16 text-destructive">Failed to load: {(error as any)?.message ?? "unknown error"}</div>;

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
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your unique affiliate link</div>
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
        <StatCard icon={TrendingUp} label="Products Sold" value={stats.total_products.toLocaleString()} />
        <StatCard icon={Wallet} label="Total Earnings" value={`Rs. ${stats.total_earnings.toLocaleString()}`} />
        <StatCard icon={Clock} label="Pending" value={`Rs. ${stats.pending_earnings.toLocaleString()}`} />
        <StatCard icon={Wallet} label="Withdrawn" value={`Rs. ${stats.withdrawn.toLocaleString()}`} />
        <StatCard icon={Wallet} label="Available Balance" value={`Rs. ${stats.available_balance.toLocaleString()}`} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Earnings (last 30 days)">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Orders (last 30 days)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Products sold (last 30 days)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="products" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <PaymentRequestCard available={stats.available_balance} onSubmitted={() => qc.invalidateQueries({ queryKey: ["my-affiliate"] })} />
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
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Products</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Earnings</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((r: any) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="p-3 font-mono text-xs text-primary">{r.order?.order_number ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-xs">
                      {(r.items ?? []).length === 0 ? "—" : (
                        <ul className="space-y-0.5">
                          {r.items.map((it: any, i: number) => (
                            <li key={i}>{it.product_name} <span className="text-muted-foreground">×{it.quantity}</span></li>
                          ))}
                        </ul>
                      )}
                    </td>
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

      {/* Payment request history */}
      <div className="mt-8">
        <h2 className="mb-3 font-semibold">Payment requests</h2>
        {data.payment_requests.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No payment requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3">Date</th><th className="p-3">Name</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Note</th></tr>
              </thead>
              <tbody>
                {data.payment_requests.map((r: any) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3">{r.full_name}</td>
                    <td className="p-3 font-semibold">Rs. {Number(r.amount).toLocaleString()}</td>
                    <td className="p-3 text-xs capitalize">{r.status}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.admin_note ?? "—"}</td>
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}

function PaymentRequestCard({ available, onSubmitted }: { available: number; onSubmitted: () => void }) {
  const signFn = useServerFn(createQrSignedUpload);
  const reqFn = useServerFn(requestPayment);
  const [full_name, setFullName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const amt = Number(amount);
      if (!amt || amt < 1) throw new Error("Enter a valid amount");
      let qr_path: string | null = null;
      if (qrFile) {
        const { path, token } = await signFn({ data: { filename: qrFile.name } });
        const { error: upErr } = await supabase.storage
          .from("affiliate-qr")
          .uploadToSignedUrl(path, token, qrFile, { contentType: qrFile.type || undefined });
        if (upErr) throw new Error(upErr.message);
        qr_path = path;
      }
      await reqFn({ data: { full_name, amount: amt, qr_path } });
      toast.success("Payment request submitted");
      setFullName(""); setAmount(""); setQrFile(null);
      onSubmitted();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-1 text-sm font-semibold">Request Payment</div>
      <div className="mb-3 text-xs text-muted-foreground">Available balance: Rs. {available.toLocaleString()}</div>
      <form onSubmit={submit} className="space-y-2">
        <input required maxLength={120} value={full_name} onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input required type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to withdraw (Rs.)" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed border-input bg-background px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Upload className="h-4 w-4" /> {qrFile ? qrFile.name : "Upload QR (eSewa / Khalti / Bank)"}
          </span>
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => setQrFile(e.target.files?.[0] ?? null)} />
        </label>
        <button disabled={busy} className="btn-gold w-full rounded-full py-2 text-sm font-semibold">
          {busy ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
