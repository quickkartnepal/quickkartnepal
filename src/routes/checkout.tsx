import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/user.functions";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getDeliveryCharge, STANDARD_DELIVERY } from "@/lib/delivery";
import { toast } from "sonner";
import { BadgeCheck, Tag } from "lucide-react";
import { PROVINCES, districtsOf, municipalitiesOf, wardsOf } from "@/lib/nepal-address";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Quick Kart Nepal" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const nav = useNavigate();
  const profileFn = useServerFn(getMyProfile);
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    province: "",
    district: "",
    municipality: "",
    ward: "",
    tole: "",
    address: "",
    maps_link: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user) {
      profileFn().then((res) => {
        if (res?.profile) {
          setForm((f) => ({
            ...f,
            full_name: f.full_name || res.profile!.full_name || "",
            phone: f.phone || res.profile!.phone || "",
            address: f.address || res.profile!.address || "",
          }));
        }
      }).catch(() => {});
    }
  }, [user, profileFn]);

  const districts = useMemo(() => districtsOf(form.province), [form.province]);
  const municipalities = useMemo(() => municipalitiesOf(form.province, form.district), [form.province, form.district]);
  const wards = useMemo(() => wardsOf(form.province, form.district, form.municipality), [form.province, form.district, form.municipality]);

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
      const { data, error } = await supabase.rpc("validate_checkout_promo", {
        _code: promoCode.trim(),
        _subtotal: subtotal,
      });
      if (error) throw error;
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid promo code");
      const res = data as { code: string; discount: number };
      setPromoApplied({ code: res.code, discount: res.discount });
      toast.success(`Applied ${res.code} — Rs. ${res.discount.toLocaleString()} off`);
    } catch (e: any) {
      setPromoApplied(null);
      toast.error(e?.message ?? "Invalid code");
    } finally { setApplying(false); }
  };

  const total = Math.max(0, subtotal - (promoApplied?.discount ?? 0));
  const { charge: deliveryCharge } = getDeliveryCharge(subtotal);
  const grandTotal = total + deliveryCharge;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.province || !form.district || !form.municipality || !form.ward) {
      toast.error("Please complete province, district, municipality and ward");
      return;
    }
    setBusy(true);
    const fullAddress = [form.tole, form.municipality, `Ward ${form.ward}`, form.district, form.province]
      .filter(Boolean).join(", ") + (form.address ? ` — ${form.address}` : "");
    try {
      const referral = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith("qk_ref="))
        ?.split("=")[1];
      const { data, error } = await supabase.rpc("place_cod_order", {
        _full_name: form.full_name,
        _phone: form.phone,
        _address: fullAddress,
        _province: form.province,
        _district: form.district,
        _municipality: form.municipality,
        _ward: form.ward,
        _tole: form.tole,
        _maps_link: form.maps_link,
        _notes: form.notes,
        _promo_code: promoApplied?.code ?? "",
        _items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        _affiliate_code: referral ? decodeURIComponent(referral) : "",
      });
      if (error) throw error;
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Failed to place order");
      const res = data as { order_number: string };
      clear();
      nav({ to: "/order-success", search: { o: res.order_number } });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to place order");
    } finally { setBusy(false); }
  };

  const fieldClass = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <input required maxLength={120} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <input required maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} placeholder="98XXXXXXXX" />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 text-sm font-semibold text-primary">Delivery Address (Nepal)</div>
            <p className="mb-3 text-xs text-muted-foreground">Choose your Province first, then District, Municipality and finally your Area / Ward.</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Province</label>
                <select required value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value, district: "", municipality: "", ward: "" })}
                  className={fieldClass}>
                  <option value="">Select Province</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">District</label>
                <select required disabled={!form.province} value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value, municipality: "", ward: "" })}
                  className={fieldClass}>
                  <option value="">Select District</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Municipality / VDC</label>
                <select required disabled={!form.district} value={form.municipality}
                  onChange={(e) => setForm({ ...form, municipality: e.target.value, ward: "" })}

                  className={fieldClass}>
                  <option value="">Select Municipality</option>
                  {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Area / Ward No.</label>
                <select required disabled={!form.municipality} value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  className={fieldClass}>
                  <option value="">Select Ward</option>
                  {wards.map((w) => (
                    <option key={w} value={String(w)}>{form.municipality} - Ward {w}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Tole / Local Area</label>
                <input maxLength={120} value={form.tole} onChange={(e) => setForm({ ...form, tole: e.target.value })}
                  className={fieldClass} placeholder="e.g. New Baneshwor, near temple" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Landmark / Extra details (optional)</label>
                <textarea maxLength={500} rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={fieldClass} placeholder="Nearest landmark, house no., etc." />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Google Maps Link (optional)</label>
                <input type="url" maxLength={500} value={form.maps_link} onChange={(e) => setForm({ ...form, maps_link: e.target.value })}
                  className={fieldClass} placeholder="https://maps.app.goo.gl/..." />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea maxLength={500} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={fieldClass} />
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
          <div className="flex justify-between text-sm">
            <span>Delivery</span>
            <span>Rs. {deliveryCharge.toLocaleString()}</span>
          </div>
          <div className="mt-1 flex justify-between font-semibold">
            <span>Grand Total</span><span>Rs. {grandTotal.toLocaleString()}</span>
          </div>
          <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-2 text-xs text-muted-foreground">
            <strong>Delivery info:</strong> Flat delivery charge of Rs. {STANDARD_DELIVERY} for all locations in Nepal.
          </div>
        </aside>
      </div>
    </div>
  );
}
