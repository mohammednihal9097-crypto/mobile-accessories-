-- Include each item's unit and line price in all WhatsApp order messages.
-- Run after 0001 to 0005. Template variables and their order do not change.

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
