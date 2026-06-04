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
      { name: "description", content: "Shop curated Nepali products with Cash on Delivery all over Nepal. Featured and trending picks updated daily." },
    ],
  }),
  component: Home,
});

const fallbackSlides = [
  { title: "Authentic Nepali Heritage", subtitle: "Curated picks delivered all over Nepal", image_url: banner, link_url: null as string | null },
  { title: "Cash on Delivery", subtitle: "Pay only after you receive your order", image_url: banner, link_url: null },
  { title: "Trending in Nepal", subtitle: "Hand-picked products everyone loves", image_url: banner, link_url: null },
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

function useBanners() {
  return useQuery({
    queryKey: ["home-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id,image_url,link_url,title")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function HeroSlider() {
  const { data: banners } = useBanners();
  const slides = banners && banners.length > 0
    ? banners.map((b: any) => ({ title: b.title || "Quick Kart Nepal", subtitle: "Tap to explore", image_url: b.image_url, link_url: b.link_url }))
    : fallbackSlides;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);
  const s = slides[i] ?? slides[0];

  const inner = (
    <div className="relative h-[300px] w-full sm:h-[420px] md:h-[520px]">
      <img src={s.image_url} alt={s.title} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4">
        <div className="max-w-xl">
          <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">Quick Kart Nepal</span>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-primary sm:text-4xl md:text-6xl">{s.title}</h1>
          <p className="mt-3 text-sm text-foreground/80 sm:text-base md:text-lg">{s.subtitle}</p>
          <a href="#products" className="btn-gold mt-5 inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold sm:px-6 sm:py-3">Shop now</a>
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button aria-label="prev" onClick={(e) => { e.preventDefault(); setI((v) => (v - 1 + slides.length) % slides.length); }}
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-card/80 backdrop-blur sm:left-3 sm:h-10 sm:w-10">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button aria-label="next" onClick={(e) => { e.preventDefault(); setI((v) => (v + 1) % slides.length); }}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-card/80 backdrop-blur sm:right-3 sm:h-10 sm:w-10">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
            {slides.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-primary" : "w-3 bg-primary/30"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <section className="relative overflow-hidden">
      {s.link_url ? <a href={s.link_url} target="_blank" rel="noopener noreferrer">{inner}</a> : inner}
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
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:gap-4 sm:py-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 rounded-xl bg-card p-3 ring-1 ring-border sm:p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary sm:h-11 sm:w-11">
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
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-accent">{kicker}</div>
          <h2 className="font-display text-2xl text-primary md:text-3xl">{title}</h2>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {products.map((p) => (<ProductCard key={p.id} p={p} />))}
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
        <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:py-12">
          <h2 className="font-display text-2xl text-primary sm:text-3xl">Discover the spirit of Nepal</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            From the foothills of the Himalayas to your doorstep — Quick Kart Nepal brings you the warmth of Nepali craftsmanship with the convenience of Cash on Delivery.
          </p>
          <Link to="/about" className="mt-5 inline-block rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
            Our Story
          </Link>
        </div>
      </section>
    </>
  );
}
