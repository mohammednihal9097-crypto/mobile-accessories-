-- Order emails: admin alerts AND customer order updates / payment receipts. Run AFTER 0001 to 0006.
--  * admin_emails: every address listed here gets an email for new, paid and cancelled orders.
--  * Email alerts reuse the notifications outbox (same retries, no duplicates). Their recipient is stored
--    as 'email:<address>' in notifications.whatsapp_number so WhatsApp sending never picks them up.
--  * claim_notifications can now claim just one channel ('email' or 'whatsapp'), so a channel that is not
--    set up yet never has its messages used up on failed attempts.

create table admin_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  label text,
  created_at timestamptz not null default now()
);
alter table admin_emails enable row level security;
revoke all on admin_emails from anon, authenticated;
grant select, insert, delete on admin_emails to authenticated;
create policy "admin read admin emails" on admin_emails
  for select to authenticated using ((select is_admin()));
create policy "admin add admin emails" on admin_emails
  for insert to authenticated with check ((select is_admin()));
create policy "admin delete admin emails" on admin_emails
  for delete to authenticated using ((select is_admin()));

insert into admin_emails (email, label) values ('triostoreindia@gmail.com', 'Store owner');

------------------------------------------------------------------------------
-- Claim by channel
------------------------------------------------------------------------------
drop function claim_notifications(integer);

create function claim_notifications(p_limit integer default 10, p_channel text default null)
returns setof notifications
language sql security definer set search_path = ''
as $$
  update public.notifications n
     set status = 'sending', claimed_at = now(), attempts = n.attempts + 1
   where n.id in (
     select id from public.notifications
      where attempts < 5
        and (status = 'pending' or (status = 'sending' and claimed_at < now() - interval '10 minutes'))
        and (p_channel is null
             or (p_channel = 'email' and whatsapp_number like 'email:%')
             or (p_channel = 'whatsapp' and whatsapp_number not like 'email:%'))
      order by created_at
      limit p_limit
      for update skip locked)
  returning n.*;
$$;
revoke execute on function claim_notifications(integer, text) from public, anon, authenticated;
grant execute on function claim_notifications(integer, text) to service_role;

------------------------------------------------------------------------------
-- Trigger: also queue an email for each admin address
------------------------------------------------------------------------------
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
  v_email text;
begin
  select * into v_order from public.orders where id = new.order_id;

  select string_agg(
    product_name || ' x' || quantity ||
    ' @ ' || v_order.currency || ' ' || to_char(unit_price_minor::numeric / 100, 'FM999999999999990.00') ||
    ' each = ' || v_order.currency || ' ' || to_char((unit_price_minor::numeric * quantity) / 100, 'FM999999999999990.00'),
    ', ' order by product_name
  )
    into v_items from public.order_items where order_id = new.order_id;
  v_address := concat_ws(', ', v_order.shipping_address->>'address', v_order.shipping_address->>'city',
                         v_order.shipping_address->>'postal_code');
  select provider_reference into v_pay_ref from public.payments
    where order_id = new.order_id and verified order by created_at desc limit 1;

  v_params := jsonb_build_object(
    'customer_name', v_order.customer_name,
    'customer_whatsapp', v_order.whatsapp_number,
    'customer_email', v_order.email,
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
  if nullif(btrim(coalesce(v_order.email, '')), '') is not null then
    insert into public.notifications (order_id, order_event_id, whatsapp_number, template, params, audience)
    values (new.order_id, new.id, 'email:' || lower(btrim(v_order.email)), v_customer_template, v_params, 'customer');
  end if;

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
    for v_email in select email from public.admin_emails loop
      insert into public.notifications (order_id, order_event_id, whatsapp_number, template, params, audience)
      values (new.order_id, new.id, 'email:' || lower(v_email), v_admin_template, v_params, 'admin');
    end loop;
  end if;
  return new;
end $$;
