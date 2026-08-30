-- ============================================================
-- Phase 4: Fulfillment setup (pickup/delivery)
-- ============================================================
-- Run this in the Supabase SQL Editor AFTER schema.sql and
-- phase1_admin_setup.sql. Only adds one column and some policies —
-- safe to run on a project that already has real data.
-- ============================================================

-- The original schema had pickup_location but nothing for the time
-- window ("Pickup: weekend, owner's chosen location" — the spec calls
-- for both). Added now rather than in Phase 0 since this is the first
-- phase that actually displays it to customers.
alter table settings add column if not exists pickup_time_window text;

-- Same "only one authenticated user = the owner" pattern as
-- phase1_admin_setup.sql — see that file for the full explanation.

create policy "admin can manage delivery zones" on delivery_zones
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin can update settings" on settings
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
