import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/return-policy")({
  head: () => ({
    meta: [
      { title: "Return & Refund Policy — Quick Kart Nepal" },
      { name: "description", content: "Clear return & refund policy for Quick Kart Nepal Cash on Delivery orders." },
    ],
  }),
  component: Policy,
});

function Policy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-primary">Return &amp; Refund Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We want you to shop with confidence. If something goes wrong with your order, we&apos;ll make it right.
      </p>

      <div className="prose prose-stone mt-6 max-w-none space-y-4 text-foreground/85">
        <h2 className="font-display text-xl text-primary">Return window</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>You may request a return within <strong>3 days</strong> of delivery.</li>
          <li>For <strong>damaged, defective or wrong items</strong>, please contact us within <strong>24 hours</strong> of delivery with clear photos or a short video.</li>
        </ul>

        <h2 className="font-display text-xl text-primary">Return conditions</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Product must be <strong>unused</strong> and in its <strong>original condition</strong> with all tags, packaging and accessories intact.</li>
          <li>Damaged, wrong or defective items received from us are <strong>fully eligible</strong> for return or replacement.</li>
          <li>Items returned without original packaging may be refused.</li>
        </ul>

        <h2 className="font-display text-xl text-primary">Non-returnable items</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Innerwear, undergarments and personal care items.</li>
          <li>Opened consumables, food items and perishables.</li>
          <li>Items damaged due to misuse or mishandling after delivery.</li>
        </ul>

        <h2 className="font-display text-xl text-primary">Refunds (Cash on Delivery)</h2>
        <p>
          Because COD orders are paid in cash on delivery, refunds for verified returns are processed via
          your preferred mobile wallet (eSewa / Khalti / IME Pay) or a direct bank transfer.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Refunds are issued within <strong>5–7 business days</strong> after we receive the returned item and verify its condition.</li>
          <li>You will be notified by phone or WhatsApp once your refund has been processed.</li>
        </ul>

        <h2 className="font-display text-xl text-primary">Replacement option</h2>
        <p>
          If your product arrives damaged, defective or incorrect, you can choose a <strong>free
          replacement</strong> instead of a refund — we&apos;ll arrange pickup and dispatch the correct
          item at no extra cost.
        </p>

        <h2 className="font-display text-xl text-primary">How to request a return</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>WhatsApp us at <strong>9802649094</strong> with your order number and photos of the issue.</li>
          <li>We&apos;ll confirm eligibility and arrange pickup or return shipping.</li>
          <li>Once received and verified, your refund or replacement is processed within 5–7 business days.</li>
        </ol>

        <p className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
          Need help with an order? Contact us anytime on WhatsApp <strong>9802649094</strong> or email <a className="text-primary underline" href="mailto:infoquickkartnepal@gmail.com">infoquickkartnepal@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
