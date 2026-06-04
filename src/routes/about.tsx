import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Quick Kart Nepal" },
      { name: "description", content: "Quick Kart Nepal was founded by Suraj & Romeo to bring authentic Nepali products to every doorstep in Nepal with Cash on Delivery." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl text-primary">About Quick Kart Nepal</h1>
      <p className="mt-3 text-sm uppercase tracking-widest text-accent">Founded by Suraj &amp; Romeo</p>

      <div className="prose prose-stone mt-6 max-w-none space-y-4 text-foreground/85">
        <p>
          Quick Kart Nepal is a homegrown online shopping destination dedicated to making authentic Nepali
          products available across the country — with the trust and convenience of Cash on Delivery.
          We believe online shopping in Nepal should be simple, honest, and built for Nepali shoppers.
        </p>

        <h2 className="mt-8 font-display text-2xl text-primary">Our Mission</h2>
        <p>
          To make online shopping easy, trusted, and accessible for every Nepali household — by offering
          quality products, transparent prices, fast nationwide delivery, and reliable customer support
          in our own language and on our own terms.
        </p>

        <h2 className="mt-6 font-display text-2xl text-primary">Our Vision</h2>
        <p>
          To become Nepal&apos;s most loved online marketplace — known for genuine products, fair pricing,
          and the kind of after-sale care that turns first-time buyers into lifelong customers.
        </p>

        <h2 className="mt-6 font-display text-2xl text-primary">Our Story</h2>
        <p>
          Quick Kart Nepal was founded by <strong>Suraj</strong> and <strong>Romeo</strong> — two young
          Nepali entrepreneurs who saw how hard it still was for shoppers outside Kathmandu to access the
          everyday products they wanted, with prices and trust they could count on. We started Quick Kart
          to fix that: a single trusted store that delivers across all 77 districts, with Cash on Delivery
          so you only pay once you have the product in your hand.
        </p>
        <p>
          Every product on our store is hand-picked. Every order is followed up by a real person. And every
          customer is treated the way we&apos;d want our own family treated when they shop online.
        </p>

        <h2 className="mt-6 font-display text-2xl text-primary">Why shop with us?</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Cash on Delivery</strong> available all over Nepal — pay only when you receive your order.</li>
          <li><strong>Nationwide delivery</strong>, fast and reliable, no matter where you live.</li>
          <li><strong>Hand-picked, authentic products</strong> — we don&apos;t list what we wouldn&apos;t buy ourselves.</li>
          <li><strong>Real human support</strong> on WhatsApp before, during, and after your order.</li>
          <li><strong>Easy returns and refunds</strong> if your product arrives damaged or wrong.</li>
        </ul>

        <h2 className="mt-6 font-display text-2xl text-primary">Built in Nepal, for Nepal</h2>
        <p>
          Quick Kart Nepal is proudly designed and operated from Nepal. Our team grew up here, shops here,
          and ships here — and we&apos;re building the kind of online store we always wished existed.
        </p>

        <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-5 text-sm">
          <div className="font-semibold">Credits</div>
          <p className="mt-1 text-muted-foreground">
            Founders: <strong>Suraj &amp; Romeo</strong> · Website developed by{" "}
            <strong>Suraj Bishwokarma</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
