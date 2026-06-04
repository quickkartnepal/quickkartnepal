This is a large scope. I'll split it into phases so you can approve and so each piece is tested before stacking the next. Confirm the phases (or reorder) and I'll start with Phase 1.

## Phase 1 — Customer accounts & order history
- Enable email/password signup + login (phone & name captured at signup, stored in `profiles` table).
- New routes: `/auth` (login + signup tabs), `/account` (profile, saved address), `/account/orders` (order history + status tracking).
- Link `orders.user_id` (nullable) so guest COD still works but logged-in users see their history.
- Header: show "Login" or account menu (My Orders, Logout).
- Checkout auto-fills name/phone/address from profile when logged in.

## Phase 2 — Admin product upgrades
- Remove slug field from admin form; auto-generate from name.
- Remove manual rating input (rating becomes derived avg of approved reviews; products.rating becomes computed/updated via trigger).
- Replace URL inputs with direct file uploads:
  - Create Storage buckets `product-images` (public) and `product-videos` (public).
  - Admin form: drag-and-drop / file picker, uploads via signed admin client, stores public URLs in `products.images[]` / `products.video_url`.
- Admin password change UI (calls `supabase.auth.updateUser({ password })`).

## Phase 3 — Banners & Promo codes
- New `banners` table (image_url, link, sort_order, is_active). Admin CRUD + upload. Homepage slider reads from DB.
- New `promo_codes` table (code, type: percent|fixed, value, min_subtotal, expires_at, is_active, usage_limit, used_count).
- Checkout: "Apply promo code" field → server-validates and applies discount to subtotal. Store `promo_code` + `discount` on orders.

## Phase 4 — Reviews & ratings
- Reviews require the reviewer to have a delivered order containing that product (when logged in). Guests can still leave reviews but flagged as unverified.
- Trigger to recompute `products.rating` on review insert/delete.

## Phase 5 — Content & contact
- Rewrite About page (mission, vision, founders Suraj & Romeo, developer credit Suraj Bishwokarma, story).
- Rewrite Return & Refund policy (clear days, conditions, COD refund process, replacement).
- Contact page: verify all links use `https://wa.me/...`, `https://instagram.com/...`, `https://www.tiktok.com/@...`, `mailto:` with `target="_blank" rel="noopener"`. (Already mostly correct — audit + fix.)
- Checkout: keep COD compulsory, ensure delivery-charge notice is prominent.

## Phase 6 — Mobile polish & fixes
- Audit Header (mobile menu), ProductCard grid, Checkout, Admin tables (horizontal scroll on small screens), tap target sizes.
- Fix the current hydration warning in Footer (email line has stray whitespace mismatch between SSR and client).

## Technical notes
- Storage uploads use `supabaseAdmin` inside a `createServerFn` that accepts base64 or uses a signed upload URL flow (signed URL preferred to keep payload small).
- Auth uses Supabase email/password; `auto_confirm_email: true` so users can log in immediately without email setup. Google OAuth not added unless you ask.
- New tables get RLS + GRANTs per the project rules.
- Rating trigger uses SECURITY DEFINER to update `products.rating`.

## Questions before I start
1. OK to skip email confirmation (users can log in immediately after signup)? Recommended for COD store.
2. For promo codes: per-user usage limit, or just global usage limit? I'll default to **global** unless you say otherwise.
3. Banner link target: internal product page or arbitrary URL? I'll allow both.

Reply "go" to start Phase 1, or tell me to reorder / drop phases.