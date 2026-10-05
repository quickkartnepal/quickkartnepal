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

## Step 3 — Environment variables (required)

Add these in Vercel/Netlify → Project Settings → Environment Variables:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | your Lovable Cloud URL (from the project's `.env`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the publishable key (from `.env`) |
| `VITE_SUPABASE_PROJECT_ID` | the project id (from `.env`) |
| `SUPABASE_URL` | same URL as above |
| `SUPABASE_PUBLISHABLE_KEY` | same key as above |
| `SUPABASE_SERVICE_ROLE_KEY` | the secret service-role key — needed for admin panel, OTP, orders and affiliate features |

Without `SUPABASE_SERVICE_ROLE_KEY`, the storefront loads but admin login, checkout and affiliate features fail with a "missing Supabase environment variable" error.

## Notes

- The admin OTP email is sent by Lovable Cloud auth — it works on any host as long as the env vars above are set.
- Every push to GitHub triggers a new deploy automatically on both platforms.
- The Lovable published URL (nextokart.lovable.app) keeps working independently.
