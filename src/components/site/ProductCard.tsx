import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  discount_price: number | null;
  images: string[];
  rating: number;
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const showDiscount = p.discount_price != null && p.discount_price < p.price;
  const final = Number(p.discount_price ?? p.price);
  const off = showDiscount ? Math.round((1 - Number(p.discount_price) / Number(p.price)) * 100) : 0;
  return (
    <Link
      to="/products/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {p.images?.[0] ? (
          <img
            src={p.images[0]}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">No image</div>
        )}
        {showDiscount && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
            -{off}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="line-clamp-2 text-sm font-medium text-foreground">{p.name}</div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-gold text-gold" /> {Number(p.rating).toFixed(1)}
        </div>
        <div className="mt-auto pt-2">
          <span className="text-base font-bold text-primary">Rs. {final.toLocaleString()}</span>
          {showDiscount && (
            <span className="ml-2 text-xs text-muted-foreground line-through">
              Rs. {Number(p.price).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
