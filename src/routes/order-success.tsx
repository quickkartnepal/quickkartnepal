import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/order-success")({
  validateSearch: z.object({ o: z.string().optional() }),
  head: () => ({ meta: [{ title: "Order Confirmed — Quick Kart Nepal" }] }),
  component: Success,
});

function Success() {
  const { o } = Route.useSearch();
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-accent" />
      <h1 className="mt-4 font-display text-3xl text-primary">Order placed successfully!</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Thank you for shopping with Quick Kart Nepal. Our team will contact you shortly to confirm your order.
      </p>
      {o && (
        <div className="mt-4 inline-block rounded-full border border-border bg-card px-4 py-2 text-sm">
          Order number: <span className="font-semibold text-primary">{o}</span>
        </div>
      )}
      <div className="mt-8">
        <Link to="/" className="btn-gold inline-block rounded-full px-6 py-3 text-sm font-semibold">Continue shopping</Link>
      </div>
    </div>
  );
}
