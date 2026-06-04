import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle, Music2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Quick Kart Nepal" },
      { name: "description", content: "Get in touch with Quick Kart Nepal via WhatsApp, email, Instagram, or TikTok." },
    ],
  }),
  component: Contact,
});

const items = [
  { icon: MessageCircle, label: "WhatsApp", value: "9807470285", href: "https://wa.me/9779807470285" },
  { icon: MessageCircle, label: "WhatsApp", value: "9802649094", href: "https://wa.me/9779802649094" },
  { icon: Mail, label: "Email", value: "infoquickkartnepal@gmail.com", href: "mailto:infoquickkartnepal@gmail.com" },
  { icon: Instagram, label: "Instagram", value: "@quickkart_nepal", href: "https://instagram.com/quickkart_nepal" },
  { icon: Music2, label: "TikTok", value: "@quickkart_nepal", href: "https://www.tiktok.com/@quickkart_nepal" },
];

function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl text-primary">Contact Us</h1>
      <p className="mt-2 text-sm text-muted-foreground">We're here to help — reach out anytime.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {items.map((it, i) => (
          <a key={i} href={it.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{it.label}</div>
              <div className="text-sm font-semibold">{it.value}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
