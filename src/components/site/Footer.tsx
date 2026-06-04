import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="font-display text-2xl text-primary">Quick Kart Nepal</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Authentic Nepali products, delivered all over Nepal with Cash on Delivery.
          </p>
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
            Founded by Suraj &amp; Romeo
          </p>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Shop</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/cart" className="hover:text-primary">Cart</Link></li>
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Help</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/return-policy" className="hover:text-primary">Return &amp; Refund</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Get in touch</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp: 9807470285</li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp: 9802649094</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> infoquickkartnepal@gmail.com</li>
            <li className="flex items-center gap-2"><Instagram className="h-4 w-4" /> @quickkart_nepal</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Quick Kart Nepal. All rights reserved.</div>
          <Link to="/admin/login" className="opacity-60 transition hover:opacity-100 hover:text-primary">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
