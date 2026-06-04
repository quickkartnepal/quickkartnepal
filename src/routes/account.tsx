import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getMyOrders, getMyProfile, updateMyProfile } from "@/lib/user.functions";
import { toast } from "sonner";
import { LogOut, Package, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Quick Kart Nepal" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const profileFn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const ordersFn = useServerFn(getMyOrders);
  const [tab, setTab] = useState<"profile" | "orders">("profile");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => profileFn(),
    enabled: !!user,
  });
  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => ordersFn(),
    enabled: !!user && tab === "orders",
  });

  const [form, setForm] = useState({ full_name: "", phone: "", address: "" });
  useEffect(() => {
    if (profile?.profile) {
      setForm({
        full_name: profile.profile.full_name || "",
        phone: profile.profile.phone || "",
        address: profile.profile.address || "",
      });
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateFn({ data: form });
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
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

  if (loading || !user) return <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary">My Account</h1>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <button onClick={async () => { await signOut(); nav({ to: "/" }); }}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="mt-6 inline-flex rounded-full bg-secondary p-1">
        <button onClick={() => setTab("profile")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${tab === "profile" ? "bg-card shadow" : "text-muted-foreground"}`}>
          <UserIcon className="h-4 w-4" /> Profile
        </button>
        <button onClick={() => setTab("orders")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${tab === "orders" ? "bg-card shadow" : "text-muted-foreground"}`}>
          <Package className="h-4 w-4" /> My Orders
        </button>
      </div>

      <div className="mt-6">
        {tab === "profile" ? (
          <div className="grid gap-6 md:grid-cols-2">
            <form onSubmit={save} className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">Profile details</h2>
              <input required maxLength={120} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Full name" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input required maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea maxLength={500} rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Saved delivery address" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button className="btn-gold w-full rounded-full py-2.5 text-sm font-semibold">Save profile</button>
            </form>
            <form onSubmit={changePw} className="space-y-3 rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">Change password</h2>
              <input required type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)}
                placeholder="New password" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button className="w-full rounded-full border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
                Update password
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            {(orders?.orders ?? []).length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                You have no orders yet. <Link to="/" className="text-primary">Start shopping</Link>.
              </div>
            ) : (
              (orders?.orders ?? []).map((o: any) => (
                <div key={o.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-sm font-semibold text-primary">{o.order_number}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize">{o.status}</span>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Rs. {Number(o.subtotal).toLocaleString()}</span>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm">
                    {o.items.map((it: any) => (
                      <li key={it.id} className="flex justify-between">
                        <span>{it.product_name} × {it.quantity}</span>
                        <span>Rs. {(Number(it.unit_price) * it.quantity).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
