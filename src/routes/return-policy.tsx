import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/return-policy")({
  head: () => ({
    meta: [
      { title: "Return & Refund Policy — Quick Kart Nepal" },
      { name: "description", content: "Quick Kart Nepal return and refund policy for Cash on Delivery orders." },
    ],
  }),
  component: Policy,
});

function Policy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-primary">Return &amp; Refund Policy</h1>
      <div className="prose prose-stone mt-6 max-w-none text-foreground/85">
        <h2 className="font-display text-xl text-primary">Returns</h2>
        <p>If you receive a damaged, defective or wrong product, please contact us within 24 hours of delivery with photos/video of the issue.</p>
        <h2 className="font-display text-xl text-primary">Refunds</h2>
        <p>Refunds for verified eligible returns are processed within 5–7 business days via the original payment method or mobile wallet of your choice.</p>
        <h2 className="font-display text-xl text-primary">Non-returnable items</h2>
        <p>Innerwear, personal care, opened consumables and items returned without packaging are not eligible for return.</p>
        <h2 className="font-display text-xl text-primary">Need help?</h2>
        <p>Contact us on WhatsApp: 9807470285 / 9802649094 or email infoquickkartnepal@gmail.com.</p>
      </div>
    </div>
  );
}
