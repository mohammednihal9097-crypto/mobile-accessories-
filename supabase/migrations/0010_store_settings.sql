-- Migration 0010: Store settings key-value store
create table if not exists store_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table store_settings enable row level security;

create policy "anyone can read store settings" on store_settings
  for select using (true);

create policy "admins manage store settings" on store_settings
  for all to authenticated using ((select is_admin()))
  with check ((select is_admin()));
