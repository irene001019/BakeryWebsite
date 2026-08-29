-- ============================================================
-- [Bakery Name] Website — Database Schema (Phase 0)
-- ============================================================
-- Run this in the Supabase SQL Editor (or via `supabase db push`)
-- once you've created a new Supabase project.
--
-- Design notes for whoever maintains this later:
-- - All prices are stored in CENTS (integers) to avoid floating-point
--   rounding bugs with money. $5.00 = 500. Divide by 100 to display.
-- - "soft delete" pattern: menu items are hidden (is_hidden), never
--   deleted, so old orders still reference valid item names/prices.
-- - tax_amount_cents defaults to 0 and is unused in V1 (no sales tax
--   yet — see project spec, Section 6a). It exists now so tax logic
--   can be added later without an ALTER TABLE + data migration.
-- ============================================================

-- Supabase projects usually have this enabled already, but this makes
-- the script safe to run standalone on a fresh Postgres database too —
-- gen_random_uuid() below depends on it.
create extension if not exists pgcrypto;

-- ---------- MENU ----------

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,               -- e.g. "Cheesecakes", "Buns"
  sort_order int not null default 0
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references menu_categories(id) on delete set null,
  name text not null,               -- e.g. "Japanese Cheesecake"
  description text,
  photo_url text,
  message_eligible boolean not null default false, -- can this item get a handwritten cake message?
  is_hidden boolean not null default false,         -- soft-hide instead of deleting
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- A single menu item can come in multiple sizes/prices
-- e.g. Japanese Cheesecake: Mini $5, 6" $15, 7" $25, 8" $35, 10" $45
create table menu_item_variants (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  label text not null,              -- e.g. "6-inch", "Mini cake"
  price_cents int not null,
  sort_order int not null default 0
);

-- Optional add-ons/flavors with a price delta
-- e.g. Flavor (Strawberry / Chocolate / Black Tea): +$3
create table menu_item_addons (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  label text not null,              -- e.g. "Strawberry"
  price_delta_cents int not null default 0,
  sort_order int not null default 0
);

-- ---------- DELIVERY ----------

create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,               -- e.g. "Zone A (10-13km)"
  price_cents int not null,
  max_km numeric,                   -- upper bound of this zone, for reference/admin editing
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ---------- ORDERS ----------

create type fulfillment_type as enum ('pickup', 'delivery');
create type order_status as enum ('received', 'confirmed', 'ready', 'fulfilled', 'cancelled');

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,              -- human-friendly incrementing number for the admin dashboard

  -- customer info (no account system — captured fresh per order)
  customer_name text not null,
  phone text not null,
  email text not null,

  -- fulfillment
  fulfillment_type fulfillment_type not null,
  delivery_zone_id uuid references delivery_zones(id),   -- null for pickup orders
  delivery_address text,                                 -- null for pickup orders (see app-layer validation below)
  weekend_date date not null,       -- which weekend this order is for (rolls forward after Friday cutoff)

  -- money (all cents)
  subtotal_cents int not null default 0,
  delivery_fee_cents int not null default 0,
  tax_amount_cents int not null default 0,  -- unused in V1, see note above
  total_cents int not null default 0,

  -- misc
  notes text,
  cancellation_policy_ack boolean not null default false,
  status order_status not null default 'received',

  created_at timestamptz not null default now(),

  -- Enforces the spec rule at the database level, as a backstop to
  -- app-layer validation: delivery orders must have an address,
  -- pickup orders must not.
  constraint delivery_address_matches_fulfillment check (
    (fulfillment_type = 'delivery' and delivery_address is not null)
    or
    (fulfillment_type = 'pickup' and delivery_address is null)
  )
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),      -- kept nullable so historic orders survive item deletion
  variant_id uuid references menu_item_variants(id),
  addon_id uuid references menu_item_addons(id),

  -- snapshot fields: copy the name/price at time of order so the order
  -- record stays accurate even if the menu item is later edited or hidden
  item_name_snapshot text not null,
  variant_label_snapshot text,
  addon_label_snapshot text,
  unit_price_cents int not null,
  quantity int not null default 1,

  -- handwritten cake message (cakes only, free, no price impact)
  message_text text,
  message_style text
);

-- ---------- SETTINGS ----------
-- Single-row key/value-ish table for admin-editable site settings.
-- Kept simple on purpose — a small business doesn't need a config
-- service, just one row an admin form reads/writes.

create table settings (
  id boolean primary key default true,  -- always exactly one row (id = true)
  order_cutoff_day text not null default 'Friday',
  order_cutoff_time time not null default '20:00',
  weekly_order_cap_enabled boolean not null default false,
  weekly_order_cap int,
  message_lead_time_mode text not null default 'same_as_cutoff', -- or 'one_to_two_weeks'
  pickup_location text,
  constraint single_row check (id)
);

insert into settings (id) values (true);

-- ============================================================
-- Row Level Security — locked down by default.
-- Public (anon) role: read-only on menu/zones, insert-only on orders.
-- Admin actions (edit menu, view all orders, change settings) should
-- go through an authenticated Supabase role in Phase 1/6, not anon.
-- ============================================================

alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table menu_item_variants enable row level security;
alter table menu_item_addons enable row level security;
alter table delivery_zones enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table settings enable row level security;

create policy "public can read menu" on menu_categories for select using (true);
create policy "public can read menu items" on menu_items for select using (is_hidden = false);
create policy "public can read variants" on menu_item_variants for select using (true);
create policy "public can read addons" on menu_item_addons for select using (true);
create policy "public can read zones" on delivery_zones for select using (is_active = true);
create policy "public can read settings" on settings for select using (true);

create policy "public can submit orders" on orders for insert with check (true);
create policy "public can submit order items" on order_items for insert with check (true);

-- NOTE: no public SELECT policy on orders/order_items — customers can't
-- browse each other's orders. Admin dashboard (Phase 6) should query
-- using an authenticated role with a separate policy, added then.
