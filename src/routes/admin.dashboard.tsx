import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { deleteProduct, listOrdersAdmin, updateOrderStatus, upsertProduct } from "@/lib/admin.functions";
import { toast } from "sonner";
import { LogOut, Package, ShoppingBag, Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Quick Kart Nepal" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Tab = "products" | "orders";

function Dashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("products");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) nav({ to: "/admin/login" });
      else setUserEmail(data.user.email ?? null);
    });
  }, [nav]);

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/admin/login" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="mt-6 inline-flex rounded-full bg-secondary p-1">
        <button onClick={() => setTab("products")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${tab === "products" ? "bg-card shadow" : "text-muted-foreground"}`}>
          <Package className="h-4 w-4" /> Products
        </button>
        <button onClick={() => setTab("orders")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${tab === "orders" ? "bg-card shadow" : "text-muted-foreground"}`}>
          <ShoppingBag className="h-4 w-4" /> Orders
        </button>
      </div>

      <div className="mt-6">
        {tab === "products" ? <ProductsTab /> : <OrdersTab />}
      </div>
    </div>
  );
}

type ProductRow = {
  id: string; name: string; slug: string; description: string; price: number;
  discount_price: number | null; images: string[]; video_url: string | null;
  rating: number; category: string | null; is_featured: boolean; is_trending: boolean; is_active: boolean;
};

function emptyProduct(): Partial<ProductRow> {
  return { name: "", slug: "", description: "", price: 0, discount_price: null, images: [], video_url: "", rating: 4.5, category: "", is_featured: false, is_trending: false, is_active: true };
}

function ProductsTab() {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertProduct);
  const del = useServerFn(deleteProduct);
  const [editing, setEditing] = useState<Partial<ProductRow> | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<ProductRow>) => {
      const payload = {
        id: p.id,
        name: p.name!,
        slug: (p.slug || p.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        description: p.description ?? "",
        price: Number(p.price ?? 0),
        discount_price: p.discount_price === null || p.discount_price === undefined || (p.discount_price as any) === "" ? null : Number(p.discount_price),
        images: (typeof (p as any).images === "string" ? String((p as any).images).split("\n") : p.images ?? [])
          .map((s) => String(s).trim()).filter(Boolean),
        video_url: p.video_url ? String(p.video_url).trim() : null,
        rating: Number(p.rating ?? 4.5),
        category: p.category || null,
        is_featured: !!p.is_featured,
        is_trending: !!p.is_trending,
        is_active: p.is_active !== false,
      };
      return upsert({ data: payload });
    },
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-products"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  if (editing) return <ProductForm product={editing} onCancel={() => setEditing(null)} onSave={(p) => save.mutate(p)} saving={save.isPending} />;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={() => setEditing(emptyProduct())} className="btn-gold inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">Flags</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {(products ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    Rs. {Number(p.discount_price ?? p.price).toLocaleString()}
                    {p.discount_price != null && <div className="text-xs text-muted-foreground line-through">Rs. {Number(p.price).toLocaleString()}</div>}
                  </td>
                  <td className="p-3 text-xs">
                    {p.is_featured && <span className="mr-1 rounded bg-accent/20 px-1.5 py-0.5 text-accent-foreground">Featured</span>}
                    {p.is_trending && <span className="rounded bg-gold/30 px-1.5 py-0.5">Trending</span>}
                  </td>
                  <td className="p-3 text-xs">{p.is_active ? "Active" : "Hidden"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditing(p)} className="mr-2 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-primary"><Pencil className="h-3 w-3" /> Edit</button>
                    <button onClick={() => confirm(`Delete "${p.name}"?`) && remove.mutate(p.id)} className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-3 w-3" /> Delete</button>
                  </td>
                </tr>
              ))}
              {(products ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">No products yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductForm({ product, onCancel, onSave, saving }: { product: Partial<ProductRow>; onCancel: () => void; onSave: (p: Partial<ProductRow>) => void; saving: boolean }) {
  const [p, setP] = useState<any>({
    ...product,
    images: Array.isArray(product.images) ? product.images.join("\n") : (product as any).images ?? "",
    discount_price: product.discount_price ?? "",
    video_url: product.video_url ?? "",
    category: product.category ?? "",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(p); }} className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-xl text-primary">{product.id ? "Edit product" : "Add product"}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Name"><input required maxLength={200} className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
        <Field label="Slug (URL)"><input required maxLength={200} className="input" value={p.slug} onChange={(e) => setP({ ...p, slug: e.target.value })} placeholder="auto from name if empty" /></Field>
        <Field label="Price (Rs.)"><input required type="number" min={0} step="0.01" className="input" value={p.price} onChange={(e) => setP({ ...p, price: e.target.value })} /></Field>
        <Field label="Discount Price (Rs.)"><input type="number" min={0} step="0.01" className="input" value={p.discount_price} onChange={(e) => setP({ ...p, discount_price: e.target.value })} /></Field>
        <Field label="Rating (0-5)"><input type="number" min={0} max={5} step="0.1" className="input" value={p.rating} onChange={(e) => setP({ ...p, rating: e.target.value })} /></Field>
        <Field label="Category"><input maxLength={80} className="input" value={p.category} onChange={(e) => setP({ ...p, category: e.target.value })} /></Field>
        <Field label="Video URL (optional)" full><input type="url" className="input" value={p.video_url} onChange={(e) => setP({ ...p, video_url: e.target.value })} /></Field>
        <Field label="Image URLs (one per line, max 10)" full>
          <textarea rows={4} className="input" value={p.images} onChange={(e) => setP({ ...p, images: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="Description" full><textarea rows={5} maxLength={5000} className="input" value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} /></Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!p.is_featured} onChange={(e) => setP({ ...p, is_featured: e.target.checked })} /> Featured</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!p.is_trending} onChange={(e) => setP({ ...p, is_trending: e.target.checked })} /> Trending</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={p.is_active !== false} onChange={(e) => setP({ ...p, is_active: e.target.checked })} /> Active</label>
      </div>
      <div className="mt-6 flex gap-3">
        <button disabled={saving} className="btn-gold rounded-full px-6 py-2 text-sm font-semibold">{saving ? "Saving…" : "Save"}</button>
        <button type="button" onClick={onCancel} className="rounded-full border border-border px-6 py-2 text-sm">Cancel</button>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--input);background:var(--background);border-radius:0.5rem;padding:.5rem .75rem;font-size:.875rem}`}</style>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function OrdersTab() {
  const qc = useQueryClient();
  const list = useServerFn(listOrdersAdmin);
  const updateStatus = useServerFn(updateOrderStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => list(),
  });

  const mut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => updateStatus({ data: { id, status } }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const orders = data?.orders ?? [];
  if (orders.length === 0) return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No orders yet.</div>;

  return (
    <div className="space-y-4">
      {orders.map((o: any) => (
        <div key={o.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-mono text-sm font-semibold text-primary">{o.order_number}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <select value={o.status} onChange={(e) => mut.mutate({ id: o.id, status: e.target.value })}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs">
                {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">Rs. {Number(o.subtotal).toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
            <div><div className="text-xs uppercase text-muted-foreground">Customer</div><div className="font-medium">{o.full_name}</div></div>
            <div><div className="text-xs uppercase text-muted-foreground">Phone</div><div className="font-medium"><a href={`tel:${o.phone}`} className="text-primary">{o.phone}</a></div></div>
            <div><div className="text-xs uppercase text-muted-foreground">Payment</div><div className="font-medium">{o.payment_method}</div></div>
            <div className="md:col-span-3"><div className="text-xs uppercase text-muted-foreground">Address</div><div>{o.address}</div></div>
            {o.notes && <div className="md:col-span-3"><div className="text-xs uppercase text-muted-foreground">Notes</div><div>{o.notes}</div></div>}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Items</div>
            <ul className="mt-2 space-y-1 text-sm">
              {o.items.map((it: any) => (
                <li key={it.id} className="flex justify-between">
                  <span>{it.product_name} × {it.quantity}</span>
                  <span>Rs. {(Number(it.unit_price) * it.quantity).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
