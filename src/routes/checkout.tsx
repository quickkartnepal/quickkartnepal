import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useServerFn } from "@tanstack/react-start";
import { placeOrder, validatePromo } from "@/lib/shop.functions";
import { getMyProfile } from "@/lib/user.functions";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { BadgeCheck, Truck, Tag } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Quick Kart Nepal" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const nav = useNavigate();
  const submit = useServerFn(placeOrder);
  const validate = useServerFn(validatePromo);
  const profileFn = useServerFn(getMyProfile);
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user) {
      profileFn().then((res) => {
        if (res?.profile) {
          setForm((f) => ({
            full_name: f.full_name || res.profile!.full_name || "",
            phone: f.phone || res.profile!.phone || "",
            address: f.address || res.profile!.address || "",
            notes: f.notes,
          }));
        }
      }).catch(() => {});
    }
  }, [user, profileFn]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-primary">Your cart is empty</h1>
        <Link to="/" className="btn-gold mt-4 inline-block rounded-full px-6 py-3 text-sm font-semibold">Shop now</Link>
      </div>
    );
  }

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplying(true);
    try {
      const res = await validate({ data: { code: promoCode.trim(), subtotal } });
      setPromoApplied({ code: res.code, discount: res.discount });
      toast.success(`Applied ${res.code} — Rs. ${res.discount.toLocaleString()} off`);
    } catch (e: any) {
      setPromoApplied(null);
      toast.error(e?.message ?? "Invalid code");
    } finally { setApplying(false); }
  };

  const total = Math.max(0, subtotal - (promoApplied?.discount ?? 0));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await submit({
        data: {
          ...form,
          notes: form.notes || null,
          promo_code: promoApplied?.code ?? null,
          user_id: user?.id ?? null,
          items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        },
      });
      clear();
      nav({ to: "/order-success", search: { o: res.order_number } });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to place order");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-2xl text-primary sm:text-3xl">Checkout</h1>
      {!user && (
        <p className="mt-2 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary underline">Login or create an account</Link> to track your order in My Orders.
        </p>
      )}
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_360px]">
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input required maxLength={120} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <input required maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="98XXXXXXXX" />
          </div>
          <div>
            <label className="text-sm font-medium">Delivery Address</label>
            <textarea required maxLength={500} rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Street, City, District" />
          </div>
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea maxLength={500} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
            <div className="flex items-center gap-2 font-semibold text-accent-foreground"><BadgeCheck className="h-4 w-4" /> Payment: Cash on Delivery (COD)</div>
            <p className="mt-1 text-xs text-muted-foreground">No advance payment required. Pay when you receive the product.</p>
          </div>
          <button disabled={busy} className="btn-gold w-full rounded-full px-6 py-3 text-sm font-semibold">
            {busy ? "Placing order…" : "Place Order (COD)"}
          </button>
        </form>
        <aside className="h-fit rounded-xl border border-border bg-card p-5">
          <div className="text-sm font-semibold">Your order</div>
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="truncate">{i.name} × {i.quantity}</span>
                <span className="shrink-0">Rs. {(i.price * i.quantity).toLocaleString()}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-border pt-3">
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Tag className="h-3.5 w-3.5" /> Promo code</label>
            <div className="flex gap-2">
              <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button type="button" onClick={applyPromo} disabled={applying} className="rounded-md border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
                {applying ? "…" : "Apply"}
              </button>
            </div>
            {promoApplied && <div className="mt-2 text-xs text-accent-foreground">✓ {promoApplied.code} applied (-Rs. {promoApplied.discount.toLocaleString()})</div>}
          </div>

          <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
            <span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span>
          </div>
          {promoApplied && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Discount</span><span>- Rs. {promoApplied.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between font-semibold">
            <span>Total</span><span>Rs. {total.toLocaleString()}</span>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Truck className="mt-0.5 h-3.5 w-3.5" />
            Delivery charge will be determined after order completion based on location.
          </div>
        </aside>
      </div>
    </div>
  );
}
