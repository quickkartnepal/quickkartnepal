import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle, Music2 } from "lucide-react";

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
            <li><Link to="/account" className="hover:text-primary">My Account</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Help</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/return-policy" className="hover:text-primary">Return &amp; Refund</Link></li>
            <li><Link to="/affiliate" className="hover:text-primary">Affiliate Partner</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Get in touch</div>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="https://wa.me/9779802649094" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary">
                <MessageCircle className="h-4 w-4" /> <span>WhatsApp: 9802649094</span>
              </a>
            </li>
            <li>
              <a href="mailto:infoquickkartnepal@gmail.com" className="inline-flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4" /> <span>infoquickkartnepal@gmail.com</span>
              </a>
            </li>
            <li>
              <a href="https://instagram.com/quickkart_nepal" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary">
                <Instagram className="h-4 w-4" /> <span>@quickkart_nepal</span>
              </a>
            </li>
            <li>
              <a href="https://www.tiktok.com/@quickkart_nepal" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary">
                <Music2 className="h-4 w-4" /> <span>@quickkart_nepal</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Quick Kart Nepal. All rights reserved. Website developed by Suraj Bishwokarma.</div>
          <Link to="/admin/login" className="opacity-60 transition hover:opacity-100 hover:text-primary">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
