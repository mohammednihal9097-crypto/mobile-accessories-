-- Migration 0009: Coupon and discount codes
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percent', 'flat')),
  discount_value integer not null check (discount_value > 0),
  min_order_minor integer not null default 0,
  max_discount_minor integer,
  is_active boolean not null default true,
  usage_count integer not null default 0,
  max_uses integer,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table coupons enable row level security;

create policy "anyone can view active coupons" on coupons
  for select using (is_active = true and (expires_at is null or expires_at > now()));

create policy "admins manage coupons" on coupons
  for all to authenticated using ((select is_admin()))
  with check ((select is_admin()));
