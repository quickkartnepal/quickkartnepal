import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Quick Kart Nepal — Shop Authentic Nepali Products | COD All Over Nepal" },
      {
        name: "description",
        content:
          "Quick Kart Nepal — shop authentic Nepali apparel, heritage goods and home decor with Cash on Delivery all over Nepal. Founded by Suraj & Romeo.",
      },
      { property: "og:title", content: "Quick Kart Nepal — Shop Authentic Nepali Products | COD All Over Nepal" },
      { property: "og:description", content: "Quick Kart Nepal is a modern eCommerce website for dropshipping, featuring customer and admin interfaces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Quick Kart Nepal — Shop Authentic Nepali Products | COD All Over Nepal" },
      { name: "description", content: "Quick Kart Nepal is a modern eCommerce website for dropshipping, featuring customer and admin interfaces." },
      { name: "twitter:description", content: "Quick Kart Nepal is a modern eCommerce website for dropshipping, featuring customer and admin interfaces." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/609f399f-7217-4a44-aa6b-d209cee65d61/id-preview-4c94e6dd--27929f1c-b0af-42db-b9cf-1b8ea12dc88d.lovable.app-1780558457693.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/609f399f-7217-4a44-aa6b-d209cee65d61/id-preview-4c94e6dd--27929f1c-b0af-42db-b9cf-1b8ea12dc88d.lovable.app-1780558457693.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="flex min-h-screen flex-col bg-paper">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
          <Toaster richColors position="top-center" />
        </div>
      </CartProvider>
    </QueryClientProvider>
  );
}
