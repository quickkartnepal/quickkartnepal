import { Link } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.jpeg";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/return-policy", label: "Returns" },
];

export function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <img src={logo} alt="Quick Kart Nepal" className="h-10 w-10 rounded-full ring-2 ring-primary/20 sm:h-12 sm:w-12" />
          <div className="leading-tight">
            <div className="font-display text-base text-primary sm:text-xl">Quick Kart Nepal</div>
            <div className="hidden text-[11px] uppercase tracking-widest text-muted-foreground sm:block">Founded by Suraj &amp; Romeo</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm font-medium text-foreground/80 transition hover:text-primary" activeProps={{ className: "text-primary font-semibold" }} activeOptions={{ exact: true }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={user ? "/account" : "/auth"}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium transition hover:border-primary hover:text-primary sm:text-sm"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user ? "Account" : "Login"}</span>
          </Link>
          <Link to="/cart" className="relative inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium transition hover:border-primary hover:text-primary sm:text-sm">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-border md:hidden" aria-label="Toggle menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
