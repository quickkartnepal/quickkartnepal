# Admin Dashboard Stats + Affiliate Partner System

Two additions to Quick Kart Nepal. No design/layout changes to existing pages — new sections only.

## 1. Admin Main Dashboard (Stats Panel)

Add a new "Overview" tab at the top of `src/routes/admin.dashboard.tsx` (default tab). Keeps existing Products/Orders/Banners/Promos tabs untouched.

**Stats cards (top row):**
- Total Orders, Total Sales (sum of delivered order subtotals), Total Revenue (all orders), Total Products, Total Customers (profiles count)

**Charts** (using `recharts`, already shadcn-compatible):
- Daily sales — last 30 days (line/area chart)
- Monthly sales — last 12 months (bar chart)
- Order trends — orders/day count (line)

**Lists:**
- Recent orders (latest 10)
- Top-selling products (aggregated from order_items)

Single server fn `getAdminStats` in `src/lib/admin.functions.ts` returns all the data in one call (admin-guarded via existing admin email check).

## 2. Affiliate Partner System

### Database (one migration)
- `affiliates` — user_id (FK auth.users), username (unique slug), created_at
- `affiliate_clicks` — affiliate_id, ip_hash, created_at
- `affiliate_orders` — affiliate_id, order_id (FK orders), product_count, commission (Rs. 70 × products), status (pending/paid)
- Add column `orders.affiliate_code text` to attribute orders
- RLS: affiliates can read their own rows; service_role manages writes; GRANTs included

### Routes
- `/affiliate` — public landing + login/signup (long professional copy about affiliate marketing, benefits, "Rs. 70 per product")
- `/affiliate/dashboard` — protected; shows unique link `quickkartnepal.com/ref=username`, total clicks, total orders, total earnings (paid+pending), per-order breakdown, password change
- `/ref/$username` — server route: records click, sets `qk_ref` cookie (30 days), redirects to `/`

### Header/Footer link
Add "Affiliate Partner" link in the Footer info section near Return Policy (and in mobile menu). No styling changes — reuse existing link classes.

### Checkout integration
`placeOrder` reads `qk_ref` cookie; if present and matches an affiliate, stores `affiliate_code` on the order and inserts `affiliate_orders` row with commission = items_count × 70.

### Server functions (`src/lib/affiliate.functions.ts`)
- `signupAffiliate({ username })` — creates affiliate row for current auth user (uses `requireSupabaseAuth`)
- `getMyAffiliate()` — profile + stats (clicks/orders/earnings) + recent referred orders
- Password change reuses existing `supabase.auth.updateUser`

## Files
**New:** migration, `src/lib/affiliate.functions.ts`, `src/routes/affiliate.tsx`, `src/routes/affiliate.dashboard.tsx`, `src/routes/ref.$username.tsx`, `src/components/admin/StatsOverview.tsx`

**Edited:** `src/lib/admin.functions.ts` (add getAdminStats), `src/lib/shop.functions.ts` (read ref cookie, record affiliate order), `src/routes/admin.dashboard.tsx` (add Overview tab), `src/components/site/Footer.tsx` (add link near Return Policy), `src/components/site/Header.tsx` (mobile menu link)

No changes to existing visual design, colors, or layouts.