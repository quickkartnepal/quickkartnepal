import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Star, Truck, BadgeCheck, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { submitReview } from "@/lib/shop.functions";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Quick Kart Nepal` },
      { name: "description", content: "Buy authentic Nepali products with Cash on Delivery all over Nepal." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();
  const submit = useServerFn(submitReview);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews, refetch } = useQuery({
    queryKey: ["reviews", product?.id],
    enabled: !!product?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", product!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [imgIdx, setImgIdx] = useState(0);
  const [rName, setRName] = useState("");
  const [rComment, setRComment] = useState("");
  const [rRating, setRRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-16 text-muted-foreground">Loading…</div>;
  if (!product) return <div className="mx-auto max-w-7xl px-4 py-16">Product not found.</div>;

  const final = Number(product.discount_price ?? product.price);
  const showDiscount = product.discount_price != null && Number(product.discount_price) < Number(product.price);
  const off = showDiscount ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100) : 0;
  const images: string[] = product.images ?? [];

  const handleAdd = () => {
    add({ id: product.id, name: product.name, price: final, image: images[0] ?? "" });
    toast.success("Added to cart");
  };
  const handleBuy = () => {
    add({ id: product.id, name: product.name, price: final, image: images[0] ?? "" });
    nav({ to: "/checkout" });
  };

  const onReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submit({ data: { product_id: product.id, name: rName, rating: rRating, comment: rComment, user_id: user?.id ?? null } });
      toast.success("Thanks for your review!");
      setRName(""); setRComment(""); setRRating(5);
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to submit");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-border bg-card">
            {images[imgIdx] && (
              <img src={images[imgIdx]} alt={product.name} className="h-full w-full object-cover" />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i === imgIdx ? "border-primary" : "border-border"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {product.video_url && (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <video src={product.video_url} controls className="w-full" />
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl text-primary">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span className="font-semibold">{Number(product.rating).toFixed(1)}</span>
            <span className="text-muted-foreground">· {reviews?.length ?? 0} reviews</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">Rs. {final.toLocaleString()}</span>
            {showDiscount && (
              <>
                <span className="text-base text-muted-foreground line-through">Rs. {Number(product.price).toLocaleString()}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">-{off}%</span>
              </>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm leading-relaxed text-foreground/85">
            {String(product.description ?? "")
              .split(/\r?\n+/)
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, i) => (
                <p key={i} className="whitespace-pre-line break-words">{line}</p>
              ))}
          </div>


          <div className="mt-5 space-y-2 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
            <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-accent" /> Cash on Delivery available all over Nepal</div>
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-accent" /> Flat delivery charge Rs. 150 anywhere in Nepal</div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={handleAdd} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </button>
            <button onClick={handleBuy} className="btn-gold inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
              <Zap className="h-4 w-4" /> Buy Now
            </button>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-primary">Customer Reviews</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            {(reviews ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
            )}
            {(reviews ?? []).map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-sm text-foreground/80">{r.comment}</p>
              </div>
            ))}
          </div>
          <form onSubmit={onReview} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-semibold">Leave a review</div>
            <input
              required maxLength={80}
              value={rName} onChange={(e) => setRName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button type="button" key={i} onClick={() => setRRating(i + 1)}>
                  <Star className={`h-5 w-5 ${i < rRating ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
            <textarea
              required maxLength={1000}
              value={rComment} onChange={(e) => setRComment(e.target.value)}
              placeholder="Share your thoughts…"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button disabled={submitting} className="btn-gold w-full rounded-full px-4 py-2 text-sm font-semibold">
              {submitting ? "Submitting…" : "Submit review"}
            </button>
          </form>
        </div>
      </section>

      <div className="mt-10">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to shop</Link>
      </div>
    </div>
  );
}
