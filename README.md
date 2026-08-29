# [Bakery Name] Website

Pre-order website for a local bakery: public menu + pickup/delivery
pre-order form + a basic admin dashboard for the owner. See the full
project spec and engineering system prompt in the project docs for
the complete requirements.

**Stack:** Next.js (App Router) + Supabase (Postgres + Auth + Storage) +
Tailwind CSS, deployed on Vercel. Chosen to stay on free tiers — see
"Recommended Approach" in the engineering system prompt.

## Phase 0 status: foundation

This repo currently contains:
- Project scaffold (Next.js + Tailwind wired up)
- Full database schema (`supabase/schema.sql`) — menu, orders,
  delivery zones, settings, with Row Level Security policies
- A placeholder homepage that confirms the Supabase connection works

Nothing customer-facing is built yet — that starts in Phase 1 (admin
menu management) and Phase 2 (public menu/order page).

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
