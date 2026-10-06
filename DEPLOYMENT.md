# Deploying Nextokart to Vercel or Netlify

The project already includes `vercel.json` and `netlify.toml`, so both platforms auto-detect the settings. You only need to connect the GitHub repo and add the environment variables.

## Step 1 — Push the code to GitHub

In Lovable: top-right **GitHub** button → Connect → Create repository → the code is pushed automatically.

## Step 2 — Import into Vercel (or Netlify)

**Vercel:**
1. Go to vercel.com → Add New → Project → Import your GitHub repo.
2. Vercel reads `vercel.json` automatically — do not change build settings.
3. Add the environment variables below.
4. Click Deploy.

**Netlify:**
1. Go to netlify.com → Add new site → Import an existing project → pick your GitHub repo.
2. Netlify reads `netlify.toml` automatically.
3. Add the environment variables below.
4. Click Deploy.

## Step 3 — Nothing!

The public connection settings are baked into the build (see `vite.config.ts`), so you do NOT need to add any environment variables. Just click Deploy. Admin login, checkout, orders and the affiliate system all work as-is.

## Notes

- Every push to GitHub triggers a new deploy automatically on both platforms.
- The Lovable published URL (nextokart.lovable.app) keeps working independently.
