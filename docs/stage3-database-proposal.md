# Stage 3 proposal: database tables and access rules

**Status: PROPOSAL ONLY. Nothing has been applied to any Supabase project.**
Once you approve, this becomes a migration file you run in your own Supabase project.

## Current Supabase approach (checked against official docs, Oct 2026)

- New key names: **publishable** key (`sb_publishable_...`, safe in the browser) and **secret** key (`sb_secret_...`, server only, bypasses all rules). The older `anon` / `service_role` keys are being retired by end of 2026, so we use the new names.
- Packages: `@supabase/supabase-js` and `@supabase/ssr`.
- Next.js 16 uses a file called `proxy.ts` (formerly `middleware.ts`) to keep login sessions fresh.
- On the server, protect pages with `getClaims()`, never `getSession()`.
- Row Level Security (RLS) must be switched on for every table. Enabling it is not enough: we also revoke the default permissions and grant back only what is needed.
- Never use `user_metadata` for permissions, because users can edit it.

## Tables

| Table | Purpose | Who can read | Who can write |
|---|---|---|---|
| `categories` | Category name, slug | Everyone | Admins |
| `phone_models` | Brand and model | Everyone | Admins |
| `products` | Name, description, price, stock, active flag | Everyone (active only) | Admins |
| `product_photos` | Image path in Storage, alt text, order | Everyone | Admins |
| `product_compatibility` | Which products fit which phone models | Everyone | Admins |
| `orders` | Customer name, WhatsApp number, address, totals, status, idempotency key | Admins only | Server only |
| `order_items` | Product, quantity, price **copied at order time** | Admins only | Server only |
| `order_events` | History of status changes: who, when, why | Admins only | Server only |
| `payments` | Provider, provider reference, amount, verified status | Admins only | Server only (from verified webhook) |
| `webhook_events` | Every payment or WhatsApp event ID already processed, so repeats are ignored | Nobody directly | Server only |
| `stock_movements` | Every stock change with a reason (order, cancel, admin edit) | Admins only | Server only |
| `admin_users` | List of user IDs allowed into /admin | Admins only | You, manually |

Rules built into the data:
- Money is stored as whole numbers in the smallest unit (paise or cents), with the currency saved on each order.
- `products.stock_quantity` has a database rule `>= 0`, so negative stock is impossible even if code has a bug.
- Order statuses: `pending_payment`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`. Only allowed moves work (for example, `shipped` cannot go back to `pending_payment`).
- Orders keep a copy of the product name and price, so later price edits never change old orders.
- Customers look up an order with an order number plus a long random token. Order numbers alone are not enough.

## Access rules in plain language

1. **Visitors (not logged in)** can read only active products, categories, phone models, photos and compatibility. They cannot read or write orders, payments or customers directly.
2. **Order creation** happens only on our server, through one database function that locks the stock rows, checks the stock and subtracts it in a single step. Two people buying the last item cannot both succeed. A repeated submit with the same idempotency key returns the original order instead of making a second one.
3. **Marking an order paid** is done only by a server function called from the verified payment webhook. It records the event ID first, so a repeated webhook changes nothing. Customer messages and browser redirects never do this.
4. **Cancelling** an unpaid order returns the stock, once.
5. **Admins** are users whose ID is in `admin_users`. They can read and manage everything through the admin pages. Everyone else who logs in gets nothing extra.
6. **Product photos** live in a Storage bucket. Anyone can view them, but only admins can upload or delete.
7. **The secret key** is used only in server code and never reaches the browser. n8n and WhatsApp will call our own server endpoints, not the database.

## Draft SQL (for review)

```sql
-- Enums
create type order_status as enum
  ('pending_payment','paid','processing','shipped','delivered','cancelled');

-- Catalogue
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
create table product_photos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  alt text not null default '',
  sort_order integer not null default 0
);
create table product_compatibility (
  product_id uuid references products(id) on delete cascade,
  phone_model_id uuid references phone_models(id) on delete cascade,
  primary key (product_id, phone_model_id)
);
-- A product with no rows here is treated as "universal".

-- Admins
create table admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
create function is_admin() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.admin_users where user_id = (select auth.uid())) $$;

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  lookup_token_hash text not null,           -- hash of the secret token given to the customer
  idempotency_key text unique not null,
  status order_status not null default 'pending_payment',
  customer_name text not null,
  whatsapp_number text not null,              -- international format
  email text,
  shipping_address jsonb not null,
  currency text not null,
  subtotal_minor integer not null check (subtotal_minor >= 0),
  shipping_minor integer not null check (shipping_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,
  unit_price_minor integer not null,
  quantity integer not null check (quantity > 0)
);
create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status, to_status order_status not null,
  actor text not null,                        -- 'customer','system','payment-webhook','admin:<id>'
  note text, created_at timestamptz not null default now()
);
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  provider text not null,                     -- 'placeholder' until you choose
  provider_reference text,
  amount_minor integer not null, currency text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (provider, provider_reference)
);
create table webhook_events (
  source text not null, event_id text not null,
  received_at timestamptz not null default now(),
  primary key (source, event_id)
);
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  delta integer not null, reason text not null,
  order_id uuid references orders(id), created_at timestamptz not null default now()
);

-- Row Level Security: on everywhere, default grants removed, then re-granted narrowly
alter table categories, phone_models, products, product_photos, product_compatibility,
  admin_users, orders, order_items, order_events, payments, webhook_events, stock_movements
  enable row level security;
revoke all on all tables in schema public from anon, authenticated;

grant select on categories, phone_models, product_photos, product_compatibility to anon, authenticated;
grant select on products to anon, authenticated;

create policy "public read categories" on categories for select to anon, authenticated using (true);
create policy "public read phone models" on phone_models for select to anon, authenticated using (true);
create policy "public read active products" on products for select to anon, authenticated using (is_active);
create policy "public read photos" on product_photos for select to anon, authenticated using (true);
create policy "public read compatibility" on product_compatibility for select to anon, authenticated using (true);

-- Admin: write catalogue, read everything operational (one policy per operation in the real migration)
grant insert, update, delete on categories, phone_models, products, product_photos, product_compatibility to authenticated;
grant select on orders, order_items, order_events, payments, stock_movements, admin_users to authenticated;
-- policies: "admin ... using ((select is_admin()))" for each operation and table

-- Server-only functions (executable by the secret key only, not by anon/authenticated):
--   create_order(items, customer, idempotency_key)  -> locks rows, checks stock, subtracts, inserts order
--   mark_order_paid(order_id, provider, reference, event_id) -> records event, idempotent, verified only
--   cancel_order(order_id, actor) -> restocks once
--   set_order_status(order_id, new_status, actor) -> enforces allowed transitions, writes order_events
```

The real migration will add the per-operation admin policies, the four functions, a Storage bucket `product-images` with its policies, and an `updated_at` trigger.

## What I need from you before I apply anything

1. **Approve or change the tables and rules above.** Questions to consider: do you want separate staff roles (for example, a packer who can only update delivery status), or is "all admins can do everything" fine to start?
2. **Create a Supabase project yourself** (free tier is fine to begin). I can't create accounts. Choose a region close to your customers.
3. **Tell me which email will be the first admin.** You create the account in Supabase Auth, and I'll show you the one line to add it to `admin_users`. I will not handle your password.
4. **Put your keys in `.env.local` yourself**, using the names in `.env.example`. Do not paste them into this chat.

## What happens after approval

1. I write the migration file and give it to you to run in the Supabase SQL editor. I won't run it on any project myself.
2. I add the Supabase client code, `proxy.ts` and login, the admin pages (products, stock, orders, payment status, delivery status), and switch the storefront from sample data to the database. The sample-data banner disappears only when real data exists.
