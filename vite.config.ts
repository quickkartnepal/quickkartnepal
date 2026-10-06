// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      // Public (publishable) connection values baked in at build time so the
      // site deploys on Vercel/Netlify with zero environment-variable setup.
      // These are the same public values the browser bundle already receives.
      "process.env.SUPABASE_URL": JSON.stringify("https://kgnnxqsdftcnzuciqwbd.supabase.co"),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnbm54cXNkZnRjbnp1Y2lxd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDQwMjgsImV4cCI6MjA5NjEyMDAyOH0.dPseb7AILDNdh_7ATbDPoROFZeB1_edNHTX6DcYe3KU"),
    },
  },
});
