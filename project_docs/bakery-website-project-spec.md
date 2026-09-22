# Online Bakery Website — Project Spec

**Project type:** Real bakery (Instagram-based), site going live eventually
**Payment model:** Cash or e-transfer only (no online payments in V1)
**Order cycle:** Weekly batch — baking & pickup/delivery on weekends only

---

## 1. Business Model Summary

- Bakery operates **online via Instagram**, no storefront
- Baking happens **weekends only**
- **Pickup:** weekend, owner's chosen location
- **Delivery:** **Sunday after 4pm only**, fee based on distance zone
- **Order cutoff:** every **Friday at 8:00 PM**
  - Before cutoff → ordering for the upcoming weekend
  - After cutoff → that weekend locks, site automatically rolls forward to take orders for the *next* weekend (no "closed" dead state)
  - Cutoff logic calculated server-side (not customer's device clock)

---

## 2. Public-Facing Site Structure

| Page | Purpose |
|---|---|
| **Home** | Hero, cutoff status banner + "Order Now" CTA, brief "how it works" explainer, a few food photos, footer w/ Instagram & FAQ links |
| **Menu / Order** | Main functional page — full ordering flow (see Section 3) |
| **FAQ** | Policy/trust page — explains the weekly cycle, delivery zones, payment, cancellation policy, custom message limitations |
| **Contact** | Email, Instagram, general-question contact form (not for orders) |
| **Admin** | Hidden, login-only, not in nav (see Section 4) |

**Gallery page — cut.** Instagram already serves this purpose; a few item photos live directly on the Menu/Order page instead. Keeps the site focused per owner's "simple and straightforward" direction.

---

## 3. Menu / Order Page

Structured as **one continuous, clearly sectioned page** (not a hard multi-step wizard, not an undifferentiated long scroll) with a **sticky cart/order summary** visible throughout.

### Section A — Status
- Current weekend being ordered for (auto-rolls based on cutoff logic)
- Live countdown to Friday 8PM cutoff

### Section B — Menu / Catalog
- Items grouped by category (bread, pastries, cakes, etc.)
- Each item: photo, name, description, price, quantity stepper
- **Handwritten message option** (cakes only): checkbox → inline dropdown/expand (not a popup) reveals:
  - Message text field
  - Optional color/style pick
  - **No price change** — included free, just adds order detail
  - Bakery does **handwritten messages only** — no fondant, no edible image printing (stated clearly on the form to set expectations)

### Section C — Cart / Running Total (sticky)
- Live-updating subtotal as items are added
- Updates further once delivery fee is selected

### Section D — Fulfillment
- **Pickup or Delivery** toggle
  - **Pickup** → shows owner's fixed pickup location + time window
  - **Delivery** → only then reveals:
    - Self-select delivery zone map (static/illustrated, hover or tap to highlight + see price) — bakery's real location stays hidden
    - Zones example: 10–13km = $10, 13–15km = $15
    - **Max delivery range: 15km.** Beyond that → flagged for manual "contact owner" (orders $95+ threshold)
    - *(Future feature, parked: customer types address → auto-shows their zone + price)*

### Section E — Review & Submit
- Full breakdown: items subtotal, delivery fee (or "Pickup – free"), **total**
- Customer info: name, phone, email
- **Delivery address — only shown/required if Delivery was selected in Section D.** Pickup orders never prompt for an address.
- Notes field (optional)
- **Cancellation policy acknowledgment** (replaces deposit — see Section 6)
- Submit → triggers "order confirmed" email with the same breakdown

---

## 4. Admin Panel (Owner-Only)

### Login
- Simple single-user, password-protected

### Orders Dashboard *(default landing page)*
- Current week's orders list
- Filter/sort by: status (received → confirmed → ready), pickup vs delivery, delivery zone (for Sunday route planning)
- Expandable rows: items, handwritten message text, total, contact info, notes
- Manual status updates (triggers customer notifications, e.g. "ready" → pickup/delivery reminder)
- Running weekly order count + revenue total

### Revenue
- **This week** — current total
- **By week** — historical table
- **By month** — table **and** bar chart (aggregated from weekly data)
- **By item** *(optional, nice-to-have)* — which items are driving sales

### Settings
- Order cutoff day/time (default: Friday 8PM)
- Weekly order cap — toggle on/off + number (off by default, available if order volume grows)
- Custom message lead-time mode — toggle: "same as weekly cutoff" / "1–2 weeks ahead" (start on same-cutoff, available to switch later)
- Delivery zones — editable list of zone name + price, 15km max, $95+ manual-contact threshold
- Pickup location (shown to customers)
- **Menu management** — owner can independently:
  - Add new items (name, description, price, category, photo)
  - Edit existing items
  - Hide/unhide items (soft toggle, not hard delete — preserves past order references)
  - Reorder items
  - Mark which items are eligible for the handwritten message option

### Archive / History *(future feature)*
- Past weeks' order data — also powers the "By week / By month" revenue views

---

## 5. Notifications

**Channel: Email for V1.** SMS flagged as future feature for the most time-sensitive ones (e.g. same-day cutoff reminders). Instagram DM automation considered and **not pursued** — Meta's Business Messaging API is a heavy lift for this stage; owner can manually DM Instagram-only customers as a fallback.

### Customer
- Order confirmed (includes full price breakdown)
- Pickup/delivery reminder (ahead of Sunday)

### Owner
- New order received
- Friday post-cutoff summary (all orders for the week)

---

## 6a. Sales Tax (V1 stance)

- **No sales tax collection in V1.** The business is small right now; order totals should NOT include a GST/RST tax line for V1.
- **Revisit later:** GST/HST registration becomes mandatory in Canada once revenue crosses ~$30,000/year (the "small supplier" threshold, based on trailing four quarters) — worth a check-in with an accountant once volume grows. Manitoba RST treatment for bakeries should also be confirmed with a professional or Manitoba's Taxation Division before adding tax logic later, since bakery sales are generally NOT covered by the grocery-store RST exemption.
- Order/checkout code should be structured so a tax line can be added later without a rebuild (e.g., a `taxAmount` field defaulting to 0 in the order data model), but no tax UI or calculation ships in V1.

## 6. No-Show / Cancellation Handling

- **Deposit system — not pursued for V1.** Considered for orders $60+, but requires manual e-transfer verification (no payment automation exists), adding owner workload without automated backing.
- **V1 approach:** stricter cancellation policy, stated clearly on the order form and in the confirmation email (e.g. "orders cannot be cancelled after Friday cutoff").
- **Parked for Phase 2:** revisit deposits (esp. for custom cakes specifically) if no-shows become a recurring real problem — likely paired with proper online payments at that point.

---

## 7. Technical Notes

- Menu, orders, settings, and revenue all need to be **database-driven** (not hardcoded) since the owner manages menu items, pricing, and settings directly through admin
- Cutoff/rolling-weekend logic should be one shared function referenced by both the regular menu and the custom message lead-time setting, not duplicated logic
- Delivery zone map is a **static/illustrated graphic** with defined hover/tap regions — not a live map, no geocoding API needed for V1 (keeps bakery's address private by design)
- Recommended stack direction: lightweight backend + database (e.g. Supabase) to support orders, admin settings, and login — pairs well with serverless functions if needed later (e.g. for the future auto-address delivery lookup)

---

## 8. Phase 2 / Parked Features (Not in V1)

- Cost tracking — ingredient costs, per-item cost calculation, monthly cost totals (requires its own recipe/ingredient data model — revisit once ordering system is live)
- Deposit requirement for orders $60+ and/or custom cakes specifically
- Address-based auto delivery zone lookup (replacing self-select)
- SMS notifications for time-sensitive reminders
- Order archive/history as a dedicated browsing feature (currently only powers revenue rollups)
- Weekly order cap enforcement (built as available toggle, off by default)

---

## 9. Build Workflow / Roadmap

Ordered so each phase only depends on what's already built.

| Phase | Focus | Notes |
|---|---|---|
| **0** | Foundation & setup | Repo, tech stack, DB schema (orders, menu items, settings, zones), hosting/deployment pipeline live early |
| **1** | Menu management (admin) | Build before the public Menu page — it needs real data to display. Add/edit/hide/reorder items, photo upload, message-eligibility flag |
| **2** | Public Menu/Order page (core) | Catalog from real DB data, cart/running total, handwritten message inline option. Biggest chunk — test thoroughly |
| **3** | Cutoff & rolling-weekend logic | Shared function for "which weekend is orderable," wired into status banner + submission validation. Test edge cases around Friday 8pm specifically |
| **4** | Fulfillment (pickup/delivery + zone map) | Pickup location display, illustrated zone map, fee calculation |
| **5** | Order submission + review | Final breakdown, contact info, cancellation policy acknowledgment, writes to DB |
| **6** | Admin Orders Dashboard | Orders list, status updates, zone sorting — needs real order data from Phase 5 |
| **7** | Notifications | Email: order confirmed, pickup/delivery reminder, new-order alert, Friday summary |
| **8** | Admin Settings + Revenue | Cutoff time, order cap, lead-time mode, delivery zones, pickup location, menu eligibility; revenue tables + monthly chart |
| **9** | Remaining pages | Home, FAQ, Contact — built once functional core exists so copy reflects what's actually built |
| **10** | Polish & test | Mobile responsiveness, end-to-end order test, owner soft-launch test before public launch |

**Suggested approach:** build Phases 0–2 as a rough end-to-end slice first (even ugly), deploy it, and get the owner clicking through it early. Real feedback from the person who'll use this weekly beats polishing in isolation.

### Recommended Tools / Stack

| Need | Recommendation | Why |
|---|---|---|
| Frontend framework | **Next.js** (React) | Multi-page site + forms + server-side logic (cutoff calc, etc.) in one framework |
| Database + backend | **Supabase** | Postgres DB, built-in auth (admin login), generous free tier, pairs with serverless functions |
| Hosting | **Vercel** | Near-zero config deploys for Next.js, free tier covers this scale |
| Email | **Resend** | Simple email API, free tier covers low-volume transactional email, integrates easily with Next.js |
| Styling | **Tailwind CSS** | Fast to build with, pairs well with Next.js |
| Image upload/storage | **Supabase Storage** | Already part of the Supabase setup — handles menu item photos with no separate service |

This stack can run free or near-free at this project's scale.

### Helpful Resources

- **Next.js docs / Learn course** — https://nextjs.org/learn
- **Supabase docs** — https://supabase.com/docs (Auth + Database quickstarts, Next.js integration guide)
- **Resend docs** — https://resend.com/docs (has a Next.js-specific guide)
- **Vercel deployment docs** — https://vercel.com/docs (deploy directly from a GitHub repo)
