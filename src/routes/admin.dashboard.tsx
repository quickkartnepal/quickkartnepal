import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  changeAdminPassword,
  createSignedUpload,
  deleteBanner,
  deletePromo,
  deleteProduct,
  getSignedDownload,
  listOrdersAdmin,
  updateOrderStatus,
  upsertBanner,
  upsertProduct,
  upsertPromo,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import { LogOut, Package, ShoppingBag, Plus, Pencil, Trash2, Image as ImageIcon, Tag, KeyRound, Upload, X } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Quick Kart Nepal" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Tab = "products" | "orders" | "banners" | "promos" | "settings";

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

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "banners", label: "Banners", icon: ImageIcon },
    { id: "promos", label: "Promo Codes", icon: Tag },
    { id: "settings", label: "Settings", icon: KeyRound },
  ];

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-primary sm:text-3xl">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-primary">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 rounded-2xl bg-secondary p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium sm:text-sm ${tab === t.id ? "bg-card shadow" : "text-muted-foreground"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <StatsOverview />}
        {tab === "products" && <ProductsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "banners" && <BannersTab />}
        {tab === "promos" && <PromosTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

// ---------------- Upload helper ----------------
function useUploader() {
  const sign = useServerFn(createSignedUpload);
  const download = useServerFn(getSignedDownload);
  return async (file: File, bucket: "product-images" | "product-videos" | "banners"): Promise<string> => {
    const { path, token } = await sign({ data: { bucket, filename: file.name } });
    const { error: upErr } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
      contentType: file.type || undefined,
    });
    if (upErr) throw new Error(upErr.message);
    const { url } = await download({ data: { bucket, path } });
    return url;
  };
}

// ---------------- Products ----------------
type ProductRow = {
  id: string; name: string; slug: string; description: string; price: number;
  discount_price: number | null; images: string[]; video_url: string | null;
  rating: number; category: string | null; is_featured: boolean; is_trending: boolean; is_active: boolean;
};

function emptyProduct(): Partial<ProductRow> {
  return { name: "", description: "", price: 0, discount_price: null, images: [], video_url: "", category: "", is_featured: false, is_trending: false, is_active: true };
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
        description: p.description ?? "",
        price: Number(p.price ?? 0),
        discount_price: p.discount_price == null || (p.discount_price as any) === "" ? null : Number(p.discount_price),
        images: (p.images ?? []).filter(Boolean),
        video_url: p.video_url ? String(p.video_url).trim() : null,
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
                        <div className="text-xs text-muted-foreground">★ {Number(p.rating).toFixed(1)}</div>
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
  const upload = useUploader();
  const [p, setP] = useState<any>({
    ...product,
    images: Array.isArray(product.images) ? product.images : [],
    discount_price: product.discount_price ?? "",
    video_url: product.video_url ?? "",
    category: product.category ?? "",
  });
  const [uploading, setUploading] = useState(false);

  const onImageUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, 10 - p.images.length)) {
        const url = await upload(f, "product-images");
        urls.push(url);
      }
      setP({ ...p, images: [...p.images, ...urls] });
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally { setUploading(false); }
  };

  const onVideoUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await upload(file, "product-videos");
      setP({ ...p, video_url: url });
      toast.success("Video uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(p); }} className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-display text-xl text-primary">{product.id ? "Edit product" : "Add product"}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Name"><input required maxLength={200} className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
        <Field label="Category"><input maxLength={80} className="input" value={p.category} onChange={(e) => setP({ ...p, category: e.target.value })} /></Field>
        <Field label="Price (Rs.)"><input required type="number" min={0} step="0.01" className="input" value={p.price} onChange={(e) => setP({ ...p, price: e.target.value })} /></Field>
        <Field label="Discount Price (Rs.)"><input type="number" min={0} step="0.01" className="input" value={p.discount_price} onChange={(e) => setP({ ...p, discount_price: e.target.value })} /></Field>

        <Field label="Product Images (upload from device, max 10)" full>
          <div className="rounded-lg border-2 border-dashed border-border p-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3 text-sm">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Choose images"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onImageUpload(e.target.files)} />
            </label>
            {p.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {p.images.map((src: string, i: number) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setP({ ...p, images: p.images.filter((_: any, k: number) => k !== i) })}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Field>

        <Field label="Product Video (optional)" full>
          <div className="rounded-lg border-2 border-dashed border-border p-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3 text-sm">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Choose video"}
              <input type="file" accept="video/*" className="hidden" onChange={(e) => onVideoUpload(e.target.files?.[0] ?? null)} />
            </label>
            {p.video_url && (
              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <video src={p.video_url} controls className="max-h-40 rounded-md" />
                <button type="button" onClick={() => setP({ ...p, video_url: "" })} className="rounded-full border border-destructive/40 px-3 py-1 text-destructive">Remove</button>
              </div>
            )}
          </div>
        </Field>

        <Field label="Description" full><textarea rows={5} maxLength={5000} className="input" value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} /></Field>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Rating is automatically calculated from customer reviews.</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!p.is_featured} onChange={(e) => setP({ ...p, is_featured: e.target.checked })} /> Featured</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!p.is_trending} onChange={(e) => setP({ ...p, is_trending: e.target.checked })} /> Trending</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={p.is_active !== false} onChange={(e) => setP({ ...p, is_active: e.target.checked })} /> Active</label>
      </div>
      <div className="mt-6 flex gap-3">
        <button disabled={saving || uploading} className="btn-gold rounded-full px-6 py-2 text-sm font-semibold">{saving ? "Saving…" : "Save"}</button>
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

// ---------------- Orders ----------------
function OrdersTab() {
  const qc = useQueryClient();
  const list = useServerFn(listOrdersAdmin);
  const updateStatus = useServerFn(updateOrderStatus);

  const { data, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => list() });

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
            <div className="flex flex-wrap items-center gap-2">
              <select value={o.status} onChange={(e) => mut.mutate({ id: o.id, status: e.target.value })}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs">
                {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              {o.promo_code && <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold">{o.promo_code} -Rs.{Number(o.discount).toLocaleString()}</span>}
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">Rs. {Number(o.subtotal).toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div><div className="text-xs uppercase text-muted-foreground">Customer</div><div className="font-medium">{o.full_name}</div></div>
            <div><div className="text-xs uppercase text-muted-foreground">Phone</div><div className="font-medium"><a href={`tel:${o.phone}`} className="text-primary">{o.phone}</a></div></div>
            <div><div className="text-xs uppercase text-muted-foreground">Payment</div><div className="font-medium">{o.payment_method}</div></div>
            <div className="sm:col-span-3"><div className="text-xs uppercase text-muted-foreground">Address</div><div>{o.address}</div></div>
            {o.notes && <div className="sm:col-span-3"><div className="text-xs uppercase text-muted-foreground">Notes</div><div>{o.notes}</div></div>}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Items</div>
            <ul className="mt-2 space-y-1 text-sm">
              {o.items.map((it: any) => (
                <li key={it.id} className="flex justify-between"><span>{it.product_name} × {it.quantity}</span><span>Rs. {(Number(it.unit_price) * it.quantity).toLocaleString()}</span></li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- Banners ----------------
function BannersTab() {
  const qc = useQueryClient();
  const upload = useUploader();
  const upsert = useServerFn(upsertBanner);
  const del = useServerFn(deleteBanner);
  const [editing, setEditing] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (b: any) => upsert({ data: b }),
    onSuccess: () => { toast.success("Saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin-banners"] }); qc.invalidateQueries({ queryKey: ["home-banners"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-banners"] }); qc.invalidateQueries({ queryKey: ["home-banners"] }); },
  });

  if (editing) {
    return (
      <form onSubmit={async (e) => {
        e.preventDefault();
        save.mutate({
          id: editing.id,
          image_url: editing.image_url,
          link_url: editing.link_url || null,
          title: editing.title || "",
          sort_order: Number(editing.sort_order ?? 0),
          is_active: editing.is_active !== false,
        });
      }} className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-xl text-primary">{editing.id ? "Edit banner" : "Add banner"}</h2>
        <Field label="Banner Image" full>
          <div className="rounded-lg border-2 border-dashed border-border p-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3 text-sm">
              <Upload className="h-4 w-4" /> Choose image
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                try { const url = await upload(f, "banners"); setEditing({ ...editing, image_url: url }); toast.success("Uploaded"); }
                catch (err: any) { toast.error(err?.message ?? "Upload failed"); }
              }} />
            </label>
            {editing.image_url && <img src={editing.image_url} alt="" className="mt-3 max-h-48 rounded-md" />}
          </div>
        </Field>
        <Field label="Title (optional)"><input className="input" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
        <Field label="Link URL (optional)"><input type="url" className="input" value={editing.link_url || ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} /></Field>
        <Field label="Sort order"><input type="number" className="input" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} /></Field>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active !== false} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label>
        <div className="flex gap-3">
          <button disabled={!editing.image_url || save.isPending} className="btn-gold rounded-full px-6 py-2 text-sm font-semibold">{save.isPending ? "Saving…" : "Save"}</button>
          <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-border px-6 py-2 text-sm">Cancel</button>
        </div>
        <style>{`.input{width:100%;border:1px solid var(--input);background:var(--background);border-radius:0.5rem;padding:.5rem .75rem;font-size:.875rem}`}</style>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={() => setEditing({ image_url: "", title: "", link_url: "", sort_order: 0, is_active: true })} className="btn-gold inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Add banner
        </button>
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(data ?? []).map((b: any) => (
            <div key={b.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <img src={b.image_url} alt="" className="aspect-[3/1] w-full object-cover" />
              <div className="flex items-center justify-between p-3 text-sm">
                <div><div className="font-medium">{b.title || "(untitled)"}</div><div className="text-xs text-muted-foreground">#{b.sort_order} · {b.is_active ? "Active" : "Hidden"}</div></div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(b)} className="rounded-full border border-border px-3 py-1 text-xs">Edit</button>
                  <button onClick={() => confirm("Delete banner?") && remove.mutate(b.id)} className="rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground sm:col-span-2">No banners yet.</div>}
        </div>
      )}
    </div>
  );
}

// ---------------- Promo Codes ----------------
function PromosTab() {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertPromo);
  const del = useServerFn(deletePromo);
  const [editing, setEditing] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (p: any) => upsert({ data: p }),
    onSuccess: () => { toast.success("Saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin-promos"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-promos"] }); },
  });

  if (editing) {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        save.mutate({
          id: editing.id,
          code: String(editing.code).trim(),
          discount_type: editing.discount_type,
          discount_value: Number(editing.discount_value),
          min_subtotal: Number(editing.min_subtotal ?? 0),
          usage_limit: editing.usage_limit ? Number(editing.usage_limit) : null,
          expires_at: editing.expires_at || null,
          is_active: editing.is_active !== false,
        });
      }} className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-xl text-primary">{editing.id ? "Edit promo" : "Add promo"}</h2>
        <Field label="Code (letters/numbers)"><input required className="input" value={editing.code || ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></Field>
        <Field label="Discount type">
          <select className="input" value={editing.discount_type || "percent"} onChange={(e) => setEditing({ ...editing, discount_type: e.target.value })}>
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed (Rs.)</option>
          </select>
        </Field>
        <Field label="Discount value"><input required type="number" min={0} className="input" value={editing.discount_value ?? ""} onChange={(e) => setEditing({ ...editing, discount_value: e.target.value })} /></Field>
        <Field label="Minimum order (Rs.)"><input type="number" min={0} className="input" value={editing.min_subtotal ?? 0} onChange={(e) => setEditing({ ...editing, min_subtotal: e.target.value })} /></Field>
        <Field label="Usage limit (optional)"><input type="number" min={0} className="input" value={editing.usage_limit ?? ""} onChange={(e) => setEditing({ ...editing, usage_limit: e.target.value })} /></Field>
        <Field label="Expires at (optional)"><input type="datetime-local" className="input" value={editing.expires_at ? editing.expires_at.slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></Field>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active !== false} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label>
        <div className="flex gap-3">
          <button disabled={save.isPending} className="btn-gold rounded-full px-6 py-2 text-sm font-semibold">{save.isPending ? "Saving…" : "Save"}</button>
          <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-border px-6 py-2 text-sm">Cancel</button>
        </div>
        <style>{`.input{width:100%;border:1px solid var(--input);background:var(--background);border-radius:0.5rem;padding:.5rem .75rem;font-size:.875rem}`}</style>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={() => setEditing({ code: "", discount_type: "percent", discount_value: 10, min_subtotal: 0, is_active: true })} className="btn-gold inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Add promo
        </button>
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min order</th><th className="p-3">Used</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>
              {(data ?? []).map((p: any) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-mono font-semibold">{p.code}</td>
                  <td className="p-3">{p.discount_type === "percent" ? `${p.discount_value}%` : `Rs. ${Number(p.discount_value).toLocaleString()}`}</td>
                  <td className="p-3">Rs. {Number(p.min_subtotal).toLocaleString()}</td>
                  <td className="p-3 text-xs">{p.used_count}{p.usage_limit ? ` / ${p.usage_limit}` : ""}</td>
                  <td className="p-3 text-xs">{p.is_active ? "Active" : "Hidden"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditing(p)} className="mr-2 rounded-full border border-border px-3 py-1 text-xs">Edit</button>
                    <button onClick={() => confirm("Delete promo?") && remove.mutate(p.id)} className="rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive">Delete</button>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No promo codes yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------- Settings (password change) ----------------
function SettingsTab() {
  const change = useServerFn(changeAdminPassword);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      try { await change({ data: { new_password: pw } }); toast.success("Password updated"); setPw(""); }
      catch (e: any) { toast.error(e?.message ?? "Failed"); }
      finally { setBusy(false); }
    }} className="max-w-md space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-xl text-primary">Change admin password</h2>
      <p className="text-xs text-muted-foreground">Minimum 8 characters. You&apos;ll stay signed in.</p>
      <input required type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)}
        placeholder="New password" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      <button disabled={busy} className="btn-gold w-full rounded-full py-2.5 text-sm font-semibold">{busy ? "Updating…" : "Update password"}</button>
    </form>
  );
}
