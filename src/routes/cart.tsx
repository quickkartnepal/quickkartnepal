import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — Quick Kart Nepal" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-primary">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Discover authentic Nepali products and add them to your cart.</p>
        <Link to="/" className="btn-gold mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold">Continue shopping</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl text-primary">Your Cart</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="flex gap-4 rounded-xl border border-border bg-card p-3">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="text-sm font-semibold">{it.name}</div>
                <div className="text-sm text-primary">Rs. {it.price.toLocaleString()}</div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-border">
                    <button onClick={() => setQty(it.id, it.quantity - 1)} className="grid h-8 w-8 place-items-center"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm">{it.quantity}</span>
                    <button onClick={() => setQty(it.id, it.quantity + 1)} className="grid h-8 w-8 place-items-center"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => remove(it.id)} className="text-xs text-destructive hover:underline inline-flex items-center gap-1"><Trash2 className="h-3 w-3" /> Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="h-fit rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">Order summary</div>
          <div className="mt-3 flex justify-between text-sm"><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
          <div className="mt-1 text-xs text-muted-foreground">Delivery charge will be determined after order completion based on location.</div>
          <Link to="/checkout" className="btn-gold mt-4 block rounded-full px-4 py-3 text-center text-sm font-semibold">
            Proceed to Checkout (COD)
          </Link>
        </aside>
      </div>
    </div>
  );
}
