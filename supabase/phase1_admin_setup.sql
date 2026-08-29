-- ============================================================
-- Phase 1: Admin access setup
-- ============================================================
-- Run this in the Supabase SQL Editor AFTER schema.sql, once per
-- project. It only adds policies — it doesn't touch table structure,
-- so it's safe to run on a project that's already got schema.sql
-- applied and real data in it.
--
-- This project has exactly ONE admin (the bakery owner). There is no
-- public sign-up flow — two manual steps in the Supabase dashboard,
-- plus the policies below:
--
-- 1. Authentication -> Providers -> Email -> turn OFF "Allow new users
--    to sign up". This is a single-owner admin area, not a public app.
-- 2. Authentication -> Users -> Add user -> create the owner's login
--    (email + password) directly. That's the only account that will
--    ever exist for this project.
-- 3. Storage -> New bucket -> name it exactly "menu-photos" -> toggle
--    "Public bucket" ON. Menu item photos upload here from the admin
--    panel, and the public menu page (Phase 2) reads from here too.
-- ============================================================

-- There's only ever one authenticated user in this project (the
-- owner), so "authenticated" doubles as "admin" here — no separate
-- roles/permissions table needed for a single-owner business.
-- These use `for all`, which covers select/insert/update/delete in
-- one policy, so the admin can also see hidden items (the public
-- policy in schema.sql only shows is_hidden = false to visitors).

create policy "admin can manage categories" on menu_categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin can manage menu items" on menu_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin can manage variants" on menu_item_variants
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin can manage addons" on menu_item_addons
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- Storage: menu photo uploads ----------
-- Public read access for the "menu-photos" bucket comes from the
-- "Public bucket" toggle in the dashboard step above — no SQL needed
-- for that. These policies only cover uploading/replacing/removing
-- photos, which the "Public" toggle does NOT grant on its own.

create policy "admin can upload menu photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-photos');

create policy "admin can update menu photos" on storage.objects
  for update to authenticated using (bucket_id = 'menu-photos');

create policy "admin can delete menu photos" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-photos');
