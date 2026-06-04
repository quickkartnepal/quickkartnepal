import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Quick Kart Nepal" },
      { name: "description", content: "Quick Kart Nepal was founded by Suraj & Romeo to bring authentic Nepali products to every doorstep in Nepal." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl text-primary">About Quick Kart Nepal</h1>
      <p className="mt-3 text-sm uppercase tracking-widest text-accent">Founded by Suraj &amp; Romeo</p>
      <div className="prose prose-stone mt-6 max-w-none text-foreground/85">
        <p>
          Quick Kart Nepal is a homegrown online shopping destination dedicated to making authentic Nepali
          products available across the country with the trust and ease of Cash on Delivery.
        </p>
        <p>
          Founded by <strong>Suraj</strong> and <strong>Romeo</strong>, our mission is simple — connect
          Nepali artisans, brands and everyday essentials with shoppers nationwide. From handwoven shawls
          and singing bowls to modern lifestyle goods, every product on Quick Kart is chosen with care.
        </p>
        <h2 className="mt-8 font-display text-2xl text-primary">Why shop with us?</h2>
        <ul className="list-disc pl-5">
          <li>Cash on Delivery available all over Nepal</li>
          <li>Nationwide delivery, fast and reliable</li>
          <li>Hand-picked authentic products</li>
          <li>Friendly customer support via WhatsApp</li>
        </ul>
      </div>
    </div>
  );
}
