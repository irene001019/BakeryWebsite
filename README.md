# JiaPan Bakery Website

Pre-order website for a local bakery: public menu + pickup/delivery
pre-order form + a basic admin dashboard for the owner. See the full
project spec and engineering system prompt in the project docs for
the complete requirements.

**Stack:** Next.js (App Router) + Supabase (Postgres + Auth + Storage) +
Tailwind CSS, deployed on Vercel. Chosen to stay on free tiers — see
"Recommended Approach" in the engineering system prompt.

## Delivery discount (added after Phase 5)

Orders over $50 get $5 off delivery; orders over $70 get $8 off
instead (not stacked — whichever tier applies). Fee never drops below
$0 regardless of discount size, and the discount shown to the customer
is capped at the fee itself (so a $5 fee never claims "$8.00 off").
Lives in `lib/cartContext.js` (`computeDeliveryFeeCents`) — the one
place delivery pricing is calculated, so the admin dashboard, the
cart, and the actual database write can never disagree about the
price. Verified against 8 boundary cases (exact thresholds, discount
exceeding the fee, a $0 zone) before being wired in.

## Phase 5 status: order submission + admin orders dashboard

This repo currently contains everything from Phases 0–4, plus:
- **Order submission** on `/menu` — contact info, delivery address
  (only shown/required for Delivery), notes, and the cancellation
  policy acknowledgment. Submitting writes a real `orders` row plus
  one `order_items` row per cart line to the database, then shows an
  on-screen confirmation and clears the cart
- **Cutoff re-checked at submit time** — right before writing, it
  fetches a fresh server-timestamped status (not whatever was true
  when the page first loaded) and blocks submission with a clear
  message if the cutoff has since passed, per the spec's "wired into
  status banner + submission validation" requirement
- **`/admin/orders`** (now the default admin landing page, per spec) —
  list of orders, filterable by status and sortable by date,
  expandable rows showing items/message/contact/notes, and manual
  status updates (received → confirmed → ready → fulfilled/cancelled)

**A deliberate design note:** customers have no read access to the
`orders` table (by design — nobody should be able to browse other
people's orders). That meant the usual `.insert().select()` pattern to
read back the new row wouldn't work: in Postgres, RLS applies the same
SELECT-policy filtering to a `RETURNING` clause as to a real SELECT, so
it would've silently come back empty. Instead, the order's ID is
generated client-side up front and reused for the order_items insert —
no read-back needed at all.

**Not yet built:** email notifications (order confirmed, new-order
alert to the owner) — that's Phase 7. Right now confirmation is
on-screen only.

One-time setup (after the earlier phase SQL files): run
`supabase/phase5_admin_orders_setup.sql` — without it, the admin
Orders page will load but show nothing, since there's currently no
policy letting the owner read orders at all.

## Phase 4 status: fulfillment (pickup/delivery + zone selection)

This repo currently contains everything from Phases 0–3, plus:
- **Pickup/Delivery toggle** on `/menu`, right below the cart —
  choosing Pickup shows the owner's location/time window; choosing
  Delivery reveals zone selection
- **Illustrated delivery zone selector** — an abstract "distance
  ring" diagram (not a real geocoded map, per the spec — the bakery's
  actual address stays private) paired with a plain clickable list for
  reliable interaction on any device
- **Live total** — the cart now shows subtotal, delivery fee (or
  "Pickup — Free"), and a running grand total
- **`/admin/delivery`** — a minimal admin page to set the pickup
  location/time window and manage delivery zones (add, reorder,
  activate/deactivate, delete). This ships now rather than waiting for
  the full Admin Settings page (Phase 8) since Phase 4 isn't testable
  without a way to enter at least one zone

**Not yet built:** real address collection/validation (self-select
zones only, per spec — no geocoding in V1) and order submission —
that's Phase 5. The "My address might be outside these zones" note
is a static informational message, not a working lookup.

One-time setup (after `phase1_admin_setup.sql`): run
`supabase/phase4_fulfillment_setup.sql`, then add at least one
delivery zone and your pickup info from `/admin/delivery` before
testing the delivery flow on `/menu`.

## Phase 3 status: cutoff & rolling-weekend logic

This repo currently contains everything from Phases 0–2, plus:
- **Real logo on the menu page** (`public/logo.jpg`, extracted from
  `bakeryicon.pdf`), replacing the earlier text-recreated wordmark
- **`lib/cutoff.js`** — the one shared function that answers "which
  weekend can a customer order for right now, and when does that
  close." This does real timezone-aware math (anchored to
  `America/Winnipeg`), not naive `Date` arithmetic — a server usually
  runs in UTC, so treating "8:00 PM" as the server's own local time
  would be off by 5-6 hours. Verified against 6 test cases (including
  the exact cutoff boundary and a winter DST check) before being wired
  into the app — see the commit for the full test transcript
- **`/api/cutoff-status`** — a server route that computes the current
  status using the *server's* clock (per the project spec — never
  trust a customer's device clock), reading the cutoff day/time from
  the `settings` table so it stays correct if the owner changes it
  later in Admin Settings (Phase 8)
- **Status banner on `/menu`** — shows which weekend is currently
  orderable and a live countdown to the cutoff, corrected for any
  drift between the visitor's device clock and the server's clock

This same `getOrderableWeekend()` function will also drive order
submission validation (Phase 5) and the custom-message lead-time
setting (Phase 8) — it only ever lives in this one file.

## Phase 2 status: public menu/order page (core)

This repo currently contains everything from Phase 0 and 1, plus:
- **Public menu page** (`/menu`) — reads live from the database (only
  non-hidden items), grouped by category, with size and flavor
  selection, quantity steppers, and the handwritten-message inline
  option for eligible items (free, no price change)
- **Live cart** — a sticky order summary with running subtotal,
  editable quantities, and remove buttons (cart state lives in the
  browser tab only for now; it gets written to the database for real
  in Phase 5)
- **Real brand design** — colors and type were pulled directly from
  the actual JiaPan Bakery logo (`public/logo-reference.jpg`), not
  placeholder values: warm ivory background, deep espresso ink, soft
  latte-tan accent, a refined serif for headings, and a flowing script
  used sparingly for the site's own wordmark, echoing the logo's
  hand-lettering

**Not yet built:** pickup/delivery selection, the Friday-cutoff status
banner, and checkout/submission — those are Phases 3–5. The `/menu`
page currently ends at "here's your subtotal," by design.

To see it: add a category and a couple of items from `/admin/menu`
(Phase 1), then visit `/menu`.

## Phase 1 status: admin menu management

This repo currently contains:
- Project scaffold (Next.js + Tailwind wired up)
- Full database schema (`supabase/schema.sql`) — menu, orders,
  delivery zones, settings, with Row Level Security policies
- A placeholder homepage that confirms the Supabase connection works
- **Admin login** (`/admin/login`) — single-owner, no public sign-up
- **Admin menu management** (`/admin/menu`, `/admin/categories`) —
  add/edit/delete categories; add/edit/hide/delete menu items with
  multiple sizes, optional add-ons (e.g. flavors), photo upload, and
  the handwritten-message-eligible flag; reorder everything with the
  ▲▼ buttons

Nothing customer-facing is built yet — that's Phase 2 (public
menu/order page), which will read from the same tables this admin
section writes to.

### One-time admin setup (after running schema.sql)

1. In the Supabase SQL Editor, run `supabase/phase1_admin_setup.sql`
2. In **Authentication → Providers → Email**, turn OFF "Allow new
   users to sign up"
3. In **Authentication → Users**, click **Add user** and create the
   owner's login (email + password) — this is the only account that
   will ever exist
4. In **Storage**, create a new bucket named exactly `menu-photos` and
   toggle **Public bucket** ON

Then visit `/admin/login`, sign in with the account from step 3, and
you can start building the real menu.

## Getting set up locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a free project
   - In the SQL Editor, paste and run the entire contents of
     `supabase/schema.sql` — this creates every table, constraint, and
     security policy in one go
   - Go to Settings → API and copy your Project URL and anon public key

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   from the previous step.

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). You should see a
   placeholder page confirming it can reach your Supabase database and
   read the default cutoff settings (Friday 8:00 PM).

## Deploying

- Push this repo to GitHub
- Import it into [Vercel](https://vercel.com) (free tier)
- Add the same environment variables from `.env.local` in the Vercel
  project settings
- Deploy — Vercel rebuilds automatically on every push to `main`

## Project structure

```
app/                  Pages (App Router) — public site + admin will live here
lib/supabaseClient.js Shared Supabase client
supabase/schema.sql   Full database schema — run this once per environment
```

## A note for whoever maintains this later

Prices are stored as integer cents everywhere (`price_cents`,
`total_cents`, etc.) to avoid floating-point rounding bugs with money.
Divide by 100 when displaying, multiply by 100 when saving user input.

Menu items are never hard-deleted — they're soft-hidden
(`is_hidden = true`) so past orders still show correct item names even
after an item is discontinued. Order line items also store a
snapshot of the name/price at order time, for the same reason.

There is no sales tax logic in V1 by design (see project spec, Section
6a). `tax_amount_cents` exists in the schema and defaults to 0 so tax
can be added later without a schema migration — don't build tax UI
until that's explicitly requested.
