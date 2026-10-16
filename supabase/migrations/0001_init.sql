-- Stage 3 migration. Matches docs/stage3-database-proposal.md.
-- NOT applied automatically. Paste into the Supabase SQL editor (or run with the Supabase CLI) on YOUR project.
-- Safe to read first; it only creates objects in the "public" schema and one Storage bucket.

------------------------------------------------------------------------------
-- Types, helpers
------------------------------------------------------------------------------
create type order_status as enum
  ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');

create function set_updated_at() returns trigger
  language plpgsql set search_path = ''
  as $$ begin new.updated_at = now(); return new; end $$;

------------------------------------------------------------------------------
-- Catalogue
------------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  icon text
);

create table phone_models (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  name text not null,
  unique (brand, name)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  category_id uuid not null references categories(id),
  price_minor integer not null check (price_minor >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated_at before update on products
  for each row execute function set_updated_at();
create index products_category_idx on products (category_id);

create table product_photos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  alt text not null default '',
  sort_order integer not null default 0
);
create index product_photos_product_idx on product_photos (product_id);

-- A product with NO rows here is treated as "universal" (fits all phones).
create table product_compatibility (
  product_id uuid not null references products(id) on delete cascade,
  phone_model_id uuid not null references phone_models(id) on delete cascade,
  primary key (product_id, phone_model_id)
);
create index product_compat_phone_idx on product_compatibility (phone_model_id);

------------------------------------------------------------------------------
-- Admins
------------------------------------------------------------------------------
create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create function is_admin() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.admin_users where user_id = (select auth.uid())) $$;

------------------------------------------------------------------------------
-- Orders
------------------------------------------------------------------------------
create sequence order_number_seq start 1001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  lookup_token_hash text not null,          -- hash of the secret token given to the customer
  idempotency_key text unique not null,
  status order_status not null default 'pending_payment',
  customer_name text not null,
  whatsapp_number text not null,            -- international format, e.g. +91...
  email text,
  shipping_address jsonb not null,
  currency text not null,
  subtotal_minor integer not null default 0 check (subtotal_minor >= 0),
  shipping_minor integer not null default 0 check (shipping_minor >= 0),
  total_minor integer not null default 0 check (total_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();
create index orders_status_idx on orders (status, created_at desc);
create index orders_whatsapp_idx on orders (whatsapp_number);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,               -- copied at order time
  unit_price_minor integer not null,        -- copied at order time
  quantity integer not null check (quantity > 0)
);
create index order_items_order_idx on order_items (order_id);

create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  actor text not null,                      -- 'customer', 'system', 'payment-webhook', 'admin:<user id>'
  note text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on order_events (order_id, created_at);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  provider text not null,                   -- 'placeholder' until a provider is chosen
  provider_reference text,
  amount_minor integer not null,
  currency text not null,
  verified boolean not null default false,  -- true only when set from a verified provider event
  created_at timestamptz not null default now(),
  unique (provider, provider_reference)
);
create index payments_order_idx on payments (order_id);

-- One row per external event already handled, so repeats change nothing.
create table webhook_events (
  source text not null,
  event_id text not null,
  received_at timestamptz not null default now(),
  primary key (source, event_id)
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  delta integer not null,
  reason text not null,
  order_id uuid references orders(id),
  created_at timestamptz not null default now()
);
create index stock_movements_product_idx on stock_movements (product_id, created_at desc);

------------------------------------------------------------------------------
-- Row Level Security: on everywhere, default grants removed, then granted narrowly
------------------------------------------------------------------------------
alter table categories            enable row level security;
alter table phone_models          enable row level security;
alter table products              enable row level security;
alter table product_photos        enable row level security;
alter table product_compatibility enable row level security;
alter table admin_users           enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table order_events          enable row level security;
alter table payments              enable row level security;
alter table webhook_events        enable row level security;
alter table stock_movements       enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Public storefront: read-only catalogue
grant select on categories, phone_models, products, product_photos, product_compatibility
  to anon, authenticated;

create policy "public read categories" on categories
  for select to anon, authenticated using (true);
create policy "public read phone models" on phone_models
  for select to anon, authenticated using (true);
create policy "public read active products" on products
  for select to anon, authenticated using (is_active);
-- Separate policy: anon may not call is_admin(), so admins get their own "see hidden products" rule.
create policy "admin read all products" on products
  for select to authenticated using ((select is_admin()));
create policy "public read photos" on product_photos
  for select to anon, authenticated using (true);
create policy "public read compatibility" on product_compatibility
  for select to anon, authenticated using (true);

-- Admins: manage catalogue
grant insert, update, delete on categories, phone_models, products, product_photos, product_compatibility
  to authenticated;

do $$
declare t text;
begin
  foreach t in array array['categories','phone_models','products','product_photos','product_compatibility']
  loop
    execute format('create policy "admin insert %1$s" on %1$I for insert to authenticated with check ((select is_admin()))', t);
    execute format('create policy "admin update %1$s" on %1$I for update to authenticated using ((select is_admin())) with check ((select is_admin()))', t);
    execute format('create policy "admin delete %1$s" on %1$I for delete to authenticated using ((select is_admin()))', t);
  end loop;
end $$;

-- Admins: read operational data. All WRITES to these go through the server-only functions below.
grant select on orders, order_items, order_events, payments, stock_movements to authenticated;
do $$
declare t text;
begin
  foreach t in array array['orders','order_items','order_events','payments','stock_movements']
  loop
    execute format('create policy "admin read %1$s" on %1$I for select to authenticated using ((select is_admin()))', t);
  end loop;
end $$;

-- A logged-in user may see only their own admin_users row (this is how the app checks admin access).
grant select on admin_users to authenticated;
create policy "read own admin row" on admin_users
  for select to authenticated using (user_id = (select auth.uid()));

-- webhook_events: no policies at all => nobody but the secret key can touch it.

grant execute on function is_admin() to authenticated;
revoke execute on function is_admin() from anon, public;

------------------------------------------------------------------------------
-- Server-only functions (callable only with the SECRET key, never from the browser)
------------------------------------------------------------------------------

-- Creates an order atomically: locks product rows, checks stock, subtracts it.
-- p_items: [{"product_id": "...", "quantity": 2}, ...]
-- p_customer: {"name","whatsapp","email","address":{...}}
create function create_order(
  p_items jsonb,
  p_customer jsonb,
  p_idempotency_key text,
  p_token_hash text,
  p_currency text,
  p_shipping_minor integer
) returns table (o_id uuid, o_number text, o_existed boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  v_existing public.orders%rowtype;
  v_order_id uuid;
  v_number text;
  v_item record;
  v_product public.products%rowtype;
  v_subtotal integer := 0;
begin
  select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return query select v_existing.id, v_existing.order_number, true;
    return;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_order';
  end if;

  v_number := 'ORD-' || nextval('public.order_number_seq');

  insert into public.orders (order_number, lookup_token_hash, idempotency_key, customer_name,
                             whatsapp_number, email, shipping_address, currency, shipping_minor)
  values (v_number, p_token_hash, p_idempotency_key, p_customer->>'name',
          p_customer->>'whatsapp', nullif(p_customer->>'email', ''), p_customer->'address',
          p_currency, p_shipping_minor)
  returning id into v_order_id;

  -- Lock in a fixed order (by product id) so two orders can never deadlock each other.
  for v_item in
    select (i->>'product_id')::uuid as product_id, sum((i->>'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) i
    group by 1 order by 1
  loop
    if v_item.quantity <= 0 then raise exception 'bad_quantity'; end if;

    select * into v_product from public.products where id = v_item.product_id for update;
    if not found or not v_product.is_active then
      raise exception 'product_unavailable:%', v_item.product_id;
    end if;
    if v_product.stock_quantity < v_item.quantity then
      raise exception 'insufficient_stock:%', v_item.product_id;
    end if;

    update public.products set stock_quantity = stock_quantity - v_item.quantity
      where id = v_product.id;
    insert into public.stock_movements (product_id, delta, reason, order_id)
      values (v_product.id, -v_item.quantity, 'order_placed', v_order_id);
    insert into public.order_items (order_id, product_id, product_name, unit_price_minor, quantity)
      values (v_order_id, v_product.id, v_product.name, v_product.price_minor, v_item.quantity);
    v_subtotal := v_subtotal + v_product.price_minor * v_item.quantity;
  end loop;

  update public.orders
    set subtotal_minor = v_subtotal, total_minor = v_subtotal + p_shipping_minor
    where id = v_order_id;
  insert into public.order_events (order_id, from_status, to_status, actor)
    values (v_order_id, null, 'pending_payment', 'customer');

  return query select v_order_id, v_number, false;
end $$;

-- Cancels an order and returns its stock, exactly once (status check under a row lock).
create function cancel_order(p_order_id uuid, p_actor text, p_note text default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status = 'cancelled' then return false; end if;           -- already done: no change
  if v_order.status in ('shipped', 'delivered') then raise exception 'cannot_cancel_after_shipping'; end if;

  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id order by product_id loop
    update public.products set stock_quantity = stock_quantity + v_item.quantity where id = v_item.product_id;
    insert into public.stock_movements (product_id, delta, reason, order_id)
      values (v_item.product_id, v_item.quantity, 'order_cancelled', p_order_id);
  end loop;

  update public.orders set status = 'cancelled' where id = p_order_id;
  insert into public.order_events (order_id, from_status, to_status, actor, note)
    values (p_order_id, v_order.status, 'cancelled', p_actor, p_note);
  return true;
end $$;

-- Moves an order forward through the allowed steps. Repeating the same change does nothing.
create function set_order_status(p_order_id uuid, p_new order_status, p_actor text, p_note text default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_new = 'cancelled' then return public.cancel_order(p_order_id, p_actor, p_note); end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status = p_new then return false; end if;                  -- duplicate update: ignore

  if not (
       (v_order.status = 'pending_payment' and p_new = 'paid')
    or (v_order.status = 'paid'            and p_new = 'processing')
    or (v_order.status = 'processing'      and p_new = 'shipped')
    or (v_order.status = 'shipped'         and p_new = 'delivered')
  ) then
    raise exception 'invalid_transition:% -> %', v_order.status, p_new;
  end if;

  update public.orders set status = p_new where id = p_order_id;
  insert into public.order_events (order_id, from_status, to_status, actor, note)
    values (p_order_id, v_order.status, p_new, p_actor, p_note);
  return true;
end $$;

-- Called ONLY from the server after a payment provider's event has been verified (Stage 5).
-- The event id is recorded first, so a repeated webhook changes nothing.
create function mark_order_paid(
  p_order_id uuid, p_source text, p_event_id text,
  p_provider text, p_reference text, p_amount_minor integer, p_currency text
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_inserted integer;
begin
  insert into public.webhook_events (source, event_id) values (p_source, p_event_id)
    on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return false; end if;                          -- already processed

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status <> 'pending_payment' then return false; end if;
  if v_order.total_minor <> p_amount_minor or v_order.currency <> p_currency then
    raise exception 'payment_amount_mismatch';
  end if;

  insert into public.payments (order_id, provider, provider_reference, amount_minor, currency, verified)
    values (p_order_id, p_provider, p_reference, p_amount_minor, p_currency, true);
  update public.orders set status = 'paid' where id = p_order_id;
  insert into public.order_events (order_id, from_status, to_status, actor, note)
    values (p_order_id, 'pending_payment', 'paid', 'payment-webhook', p_provider || ' ' || coalesce(p_reference, ''));
  return true;
end $$;

-- Changes stock by a signed amount atomically (never below zero) and records why.
create function adjust_stock(p_product_id uuid, p_delta integer, p_reason text)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_new integer;
begin
  update public.products set stock_quantity = stock_quantity + p_delta
    where id = p_product_id returning stock_quantity into v_new;   -- the >= 0 rule rejects negatives
  if not found then raise exception 'product_not_found'; end if;
  insert into public.stock_movements (product_id, delta, reason) values (p_product_id, p_delta, p_reason);
  return v_new;
end $$;
revoke execute on function adjust_stock(uuid, integer, text) from public, anon, authenticated;
grant execute on function adjust_stock(uuid, integer, text) to service_role;
-- Lock these down: executable by the secret key (service_role) only.
revoke execute on function create_order(jsonb, jsonb, text, text, text, integer) from public, anon, authenticated;
revoke execute on function cancel_order(uuid, text, text) from public, anon, authenticated;
revoke execute on function set_order_status(uuid, order_status, text, text) from public, anon, authenticated;
revoke execute on function mark_order_paid(uuid, text, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function create_order(jsonb, jsonb, text, text, text, integer) to service_role;
grant execute on function cancel_order(uuid, text, text) to service_role;
grant execute on function set_order_status(uuid, order_status, text, text) to service_role;
grant execute on function mark_order_paid(uuid, text, text, text, text, integer, text) to service_role;

------------------------------------------------------------------------------
-- Storage: public product photos, admin-only uploads
------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "admin upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admin update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admin delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
-- No SELECT policy on purpose: files are served by public URL, but the bucket cannot be listed.

------------------------------------------------------------------------------
-- After you create your admin login in Supabase (Authentication > Users), run ONCE,
-- replacing the email:
--   insert into admin_users (user_id) select id from auth.users where email = 'you@example.com';
------------------------------------------------------------------------------

