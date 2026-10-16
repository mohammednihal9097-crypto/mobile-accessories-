-- Stage 6: WhatsApp support tables. Run AFTER 0001 (and 0002 if you ran the uncorrected 0001).
-- Adds: an outbox of order-update messages, and a list of chats that need a human.

------------------------------------------------------------------------------
-- Outbox: one row per order status change, sent to the customer on WhatsApp by n8n
------------------------------------------------------------------------------
create type notification_status as enum ('pending', 'sending', 'sent', 'failed');

create table notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  order_event_id uuid not null unique references order_events(id) on delete cascade,
  -- UNIQUE above = at most one message per status change, so customers never get duplicates
  whatsapp_number text not null,
  template text not null,                    -- name of the approved WhatsApp template to use
  params jsonb not null default '{}',
  status notification_status not null default 'pending',
  attempts integer not null default 0,
  claimed_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index notifications_queue_idx on notifications (status, created_at);

create function enqueue_order_notification() returns trigger
  language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_template text;
begin
  v_template := case new.to_status
    when 'pending_payment' then 'order_received'
    when 'paid'            then 'payment_received'
    when 'processing'      then 'order_processing'
    when 'shipped'         then 'order_shipped'
    when 'delivered'       then 'order_delivered'
    when 'cancelled'       then 'order_cancelled'
  end;
  select * into v_order from public.orders where id = new.order_id;
  insert into public.notifications (order_id, order_event_id, whatsapp_number, template, params)
  values (new.order_id, new.id, v_order.whatsapp_number, v_template,
          jsonb_build_object('customer_name', v_order.customer_name, 'order_number', v_order.order_number));
  return new;
end $$;

create trigger order_events_notify after insert on order_events
  for each row execute function enqueue_order_notification();

-- n8n asks for a batch; rows are locked so two n8n runs can never send the same message.
create function claim_notifications(p_limit integer default 10)
returns setof notifications
language sql security definer set search_path = ''
as $$
  update public.notifications n
     set status = 'sending', claimed_at = now(), attempts = n.attempts + 1
   where n.id in (
     select id from public.notifications
      where attempts < 5
        and (status = 'pending' or (status = 'sending' and claimed_at < now() - interval '10 minutes'))
      order by created_at
      limit p_limit
      for update skip locked)
  returning n.*;
$$;

create function ack_notification(p_id uuid, p_ok boolean, p_error text default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update public.notifications
     set status = case when p_ok then 'sent'::public.notification_status
                       when attempts >= 5 then 'failed'::public.notification_status
                       else 'pending'::public.notification_status end,
         sent_at = case when p_ok then now() else sent_at end,
         last_error = case when p_ok then null else left(p_error, 500) end
   where id = p_id and status = 'sending';
  return found;                                -- false if already acknowledged: repeat calls are harmless
end $$;

------------------------------------------------------------------------------
-- Chats that need a person
------------------------------------------------------------------------------
create table handoff_requests (
  id uuid primary key default gen_random_uuid(),
  whatsapp_number text not null,
  customer_name text,
  reason text not null,
  last_message text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index handoff_one_open_per_number on handoff_requests (whatsapp_number) where status = 'open';
create trigger handoff_updated_at before update on handoff_requests
  for each row execute function set_updated_at();

------------------------------------------------------------------------------
-- Access: server only, plus admin read/resolve
------------------------------------------------------------------------------
alter table notifications     enable row level security;
alter table handoff_requests  enable row level security;
revoke all on notifications, handoff_requests from anon, authenticated;

grant select on notifications to authenticated;
create policy "admin read notifications" on notifications
  for select to authenticated using ((select is_admin()));

grant select, update on handoff_requests to authenticated;
create policy "admin read handoffs" on handoff_requests
  for select to authenticated using ((select is_admin()));
create policy "admin resolve handoffs" on handoff_requests
  for update to authenticated using ((select is_admin())) with check ((select is_admin()));

revoke execute on function claim_notifications(integer) from public, anon, authenticated;
revoke execute on function ack_notification(uuid, boolean, text) from public, anon, authenticated;
revoke execute on function enqueue_order_notification() from public, anon, authenticated;
grant execute on function claim_notifications(integer) to service_role;
grant execute on function ack_notification(uuid, boolean, text) to service_role;

------------------------------------------------------------------------------
-- Unpaid orders hold stock. Release it after a while so nobody (or no bot) can lock up your stock.
------------------------------------------------------------------------------
create function expire_unpaid_orders(p_hours integer default 24)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in
    select id from public.orders
     where status = 'pending_payment' and created_at < now() - make_interval(hours => p_hours)
     order by created_at
     limit 100
  loop
    if public.cancel_order(v_id, 'system:expired', 'unpaid after ' || p_hours || ' hours') then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end $$;
revoke execute on function expire_unpaid_orders(integer) from public, anon, authenticated;
grant execute on function expire_unpaid_orders(integer) to service_role;