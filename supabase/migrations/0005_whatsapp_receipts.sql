-- WhatsApp receipts and admin alerts. Run AFTER 0001 to 0004.
--  * Orders get courier / tracking fields (sent to the customer when shipped).
--  * Admin WhatsApp numbers: every number listed here gets an alert for new, paid and cancelled orders.
--  * Notifications carry order items, total, address and payment reference, for the customer's receipt.

alter table orders
  add column courier_name text,
  add column tracking_number text,
  add column tracking_url text;

------------------------------------------------------------------------------
-- Who gets admin alerts
------------------------------------------------------------------------------
create table admin_whatsapp_numbers (
  id uuid primary key default gen_random_uuid(),
  number text not null unique check (number ~ '^\+[1-9][0-9]{7,14}$'),   -- international format, e.g. +919876543210
  label text,
  created_at timestamptz not null default now()
);
alter table admin_whatsapp_numbers enable row level security;
revoke all on admin_whatsapp_numbers from anon, authenticated;
grant select, insert, delete on admin_whatsapp_numbers to authenticated;
create policy "admin read admin numbers" on admin_whatsapp_numbers
  for select to authenticated using ((select is_admin()));
create policy "admin add admin numbers" on admin_whatsapp_numbers
  for insert to authenticated with check ((select is_admin()));
create policy "admin delete admin numbers" on admin_whatsapp_numbers
  for delete to authenticated using ((select is_admin()));

------------------------------------------------------------------------------
-- Notifications: customer AND admin rows, one per status change per recipient
------------------------------------------------------------------------------
alter table notifications
  add column audience text not null default 'customer' check (audience in ('customer', 'admin'));
alter table notifications drop constraint notifications_order_event_id_key;
alter table notifications add constraint notifications_one_per_recipient unique (order_event_id, audience, whatsapp_number);

create or replace function enqueue_order_notification() returns trigger
  language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_customer_template text;
  v_admin_template text;
  v_items text;
  v_address text;
  v_pay_ref text;
  v_params jsonb;
  v_number text;
begin
  select * into v_order from public.orders where id = new.order_id;

  select string_agg(product_name || ' x' || quantity, ', ' order by product_name)
    into v_items from public.order_items where order_id = new.order_id;
  v_address := concat_ws(', ', v_order.shipping_address->>'address', v_order.shipping_address->>'city',
                         v_order.shipping_address->>'postal_code');
  select provider_reference into v_pay_ref from public.payments
    where order_id = new.order_id and verified order by created_at desc limit 1;

  v_params := jsonb_build_object(
    'customer_name', v_order.customer_name,
    'customer_whatsapp', v_order.whatsapp_number,
    'order_number', v_order.order_number,
    'items', coalesce(v_items, ''),
    'total_minor', v_order.total_minor,
    'currency', v_order.currency,
    'address', v_address,
    'payment_ref', v_pay_ref,
    'courier', v_order.courier_name,
    'tracking_number', v_order.tracking_number,
    'tracking_url', v_order.tracking_url
  );

  v_customer_template := case new.to_status
    when 'pending_payment' then 'order_received'
    when 'paid'            then 'payment_received'
    when 'processing'      then 'order_processing'
    when 'shipped'         then 'order_shipped'
    when 'delivered'       then 'order_delivered'
    when 'cancelled'       then 'order_cancelled'
  end;
  insert into public.notifications (order_id, order_event_id, whatsapp_number, template, params, audience)
  values (new.order_id, new.id, v_order.whatsapp_number, v_customer_template, v_params, 'customer');

  v_admin_template := case new.to_status
    when 'pending_payment' then 'admin_new_order'
    when 'paid'            then 'admin_order_paid'
    when 'cancelled'       then 'admin_order_cancelled'
  end;
  if v_admin_template is not null then
    for v_number in select number from public.admin_whatsapp_numbers loop
      insert into public.notifications (order_id, order_event_id, whatsapp_number, template, params, audience)
      values (new.order_id, new.id, v_number, v_admin_template, v_params, 'admin');
    end loop;
  end if;
  return new;
end $$;

------------------------------------------------------------------------------
-- Shipping details travel with the "shipped" status change
------------------------------------------------------------------------------
drop function set_order_status(uuid, order_status, text, text);

create function set_order_status(
  p_order_id uuid, p_new order_status, p_actor text, p_note text default null,
  p_courier text default null, p_tracking text default null, p_tracking_url text default null
) returns boolean
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

  if p_new = 'shipped' then
    if coalesce(btrim(p_courier), '') = '' and coalesce(btrim(p_tracking), '') = '' then
      raise exception 'shipping_details_required';
    end if;
    if coalesce(btrim(p_tracking_url), '') <> '' and p_tracking_url !~ '^https://' then
      raise exception 'bad_tracking_url';
    end if;
    update public.orders
       set status = p_new,
           courier_name = nullif(btrim(p_courier), ''),
           tracking_number = nullif(btrim(p_tracking), ''),
           tracking_url = nullif(btrim(p_tracking_url), '')
     where id = p_order_id;
  else
    update public.orders set status = p_new where id = p_order_id;
  end if;

  insert into public.order_events (order_id, from_status, to_status, actor, note)
    values (p_order_id, v_order.status, p_new, p_actor, p_note);
  return true;
end $$;

revoke execute on function set_order_status(uuid, order_status, text, text, text, text, text) from public, anon, authenticated;
grant execute on function set_order_status(uuid, order_status, text, text, text, text, text) to service_role;
