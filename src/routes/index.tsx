import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import banner from "@/assets/banner.png";
import { Truck, BadgeCheck, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quick Kart Nepal — Authentic Nepali Shopping with COD" },
      {
        name: "description",
        content:
          "Shop curated Nepali products with Cash on Delivery all over Nepal. Featured and trending picks updated daily.",
      },
    ],
  }),
  component: Home,
});

const slides = [
  {
    title: "Authentic Nepali Heritage",
    subtitle: "Curated picks delivered all over Nepal",
    cta: "Shop now",
    bg: banner,
  },
  {
    title: "Cash on Delivery",
    subtitle: "Pay only after you receive your order",
    cta: "Browse products",
    bg: banner,
  },
  {
    title: "Trending in Nepal",
    subtitle: "Hand-picked products everyone loves",
    cta: "See trending",
    bg: banner,
  },
];

function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,name,price,discount_price,images,rating,is_featured,is_trending")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<ProductCardData & { is_featured: boolean; is_trending: boolean }>;
    },
  });
}

function HeroSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);
  const s = slides[i];
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[420px] w-full md:h-[520px]">
        <img src={s.bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4">
          <div className="max-w-xl">
            <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
              Quick Kart Nepal
            </span>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-primary md:text-6xl">
              {s.title}
            </h1>
            <p className="mt-3 text-base text-foreground/80 md:text-lg">{s.subtitle}</p>
            <a
              href="#products"
              className="btn-gold mt-6 inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold"
            >
              {s.cta}
            </a>
          </div>
        </div>
        <button
          aria-label="prev"
          onClick={() => setI((v) => (v - 1 + slides.length) % slides.length)}
          className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/80 backdrop-blur"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          aria-label="next"
          onClick={() => setI((v) => (v + 1) % slides.length)}
          className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/80 backdrop-blur"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1">
          {slides.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-primary" : "w-3 bg-primary/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HighlightBar() {
  const items = [
    { icon: Truck, title: "Delivery All Over Nepal", desc: "Fast & reliable shipping nationwide" },
    { icon: BadgeCheck, title: "Cash on Delivery", desc: "Pay only after you receive" },
    { icon: ShieldCheck, title: "Trusted Quality", desc: "Hand-picked authentic products" },
  ];
  return (
    <section className="border-y border-border bg-secondary/50">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 rounded-xl bg-card p-4 ring-1 ring-border">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Section({ title, kicker, products, loading }: { title: string; kicker: string; products: ProductCardData[]; loading: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-accent">{kicker}</div>
          <h2 className="font-display text-2xl text-primary md:text-3xl">{title}</h2>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function Home() {
  const { data, isLoading } = useProducts();
  const featured = (data ?? []).filter((p) => p.is_featured);
  const trending = (data ?? []).filter((p) => p.is_trending);
  return (
    <>
      <HeroSlider />
      <HighlightBar />
      <div id="products" />
      <Section title="Featured Products" kicker="Hand-picked" products={featured} loading={isLoading} />
      <Section title="Trending Now" kicker="What's hot" products={trending} loading={isLoading} />
      <Section title="All Products" kicker="Browse" products={data ?? []} loading={isLoading} />
      <section className="bg-heritage">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <h2 className="font-display text-3xl text-primary">Discover the spirit of Nepal</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            From the foothills of the Himalayas to your doorstep — Quick Kart Nepal brings you the
            warmth of Nepali craftsmanship with the convenience of Cash on Delivery.
          </p>
          <Link to="/about" className="mt-5 inline-block rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
            Our Story
          </Link>
        </div>
      </section>
    </>
  );
}
