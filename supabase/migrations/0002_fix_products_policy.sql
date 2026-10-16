-- Fix for projects that already ran 0001 BEFORE it was corrected.
-- (If you ran the corrected 0001, you do not need this file.)
-- Problem: the public "read products" rule called is_admin(), which visitors are not allowed to run,
-- so the shop failed with "permission denied for function is_admin".

drop policy "public read active products" on products;

create policy "public read active products" on products
  for select to anon, authenticated using (is_active);

create policy "admin read all products" on products
  for select to authenticated using ((select is_admin()));
