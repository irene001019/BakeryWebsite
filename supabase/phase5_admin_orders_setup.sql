-- ============================================================
-- Phase 5: Admin order access
-- ============================================================
-- Run this in the Supabase SQL Editor AFTER the earlier phase files.
-- Only adds policies — safe to run on a project with real data.
--
-- Until now, orders/order_items only had an INSERT policy (customers
-- can submit orders, but nobody — including the owner — could read
-- them back). This adds the owner's read/update access for the admin
-- dashboard, using the same "only one authenticated user = the owner"
-- pattern as the earlier phase files.
-- ============================================================

create policy "admin can read orders" on orders
  for select using (auth.role() = 'authenticated');

create policy "admin can update orders" on orders
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin can read order items" on order_items
  for select using (auth.role() = 'authenticated');
