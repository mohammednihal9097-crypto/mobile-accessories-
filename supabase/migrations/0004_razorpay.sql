-- Stage 5 (Razorpay). Run AFTER 0001, 0002 and 0003.
-- 1) Orders remember their Razorpay payment link, so a customer who reloads never gets a second link.
-- 2) mark_order_paid now reports what happened, and still RECORDS real money received for an order
--    that was cancelled in the meantime, so you can refund it (the admin dashboard flags these).

alter table orders
  add column payment_link_id text,
  add column payment_link_url text;

-- Replace mark_order_paid (the return type changes from boolean to text, so drop it first).
drop function mark_order_paid(uuid, text, text, text, text, integer, text);

create function mark_order_paid(
  p_order_id uuid, p_source text, p_event_id text,
  p_provider text, p_reference text, p_amount_minor integer, p_currency text
) returns text                      -- 'paid' | 'duplicate' | 'not_pending'
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_inserted integer;
begin
  insert into public.webhook_events (source, event_id) values (p_source, p_event_id)
    on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return 'duplicate'; end if;            -- same event again: change nothing

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.total_minor <> p_amount_minor or v_order.currency <> p_currency then
    raise exception 'payment_amount_mismatch';
  end if;

  insert into public.payments (order_id, provider, provider_reference, amount_minor, currency, verified)
    values (p_order_id, p_provider, p_reference, p_amount_minor, p_currency, true)
    on conflict (provider, provider_reference) do nothing;

  if v_order.status <> 'pending_payment' then
    return 'not_pending';           -- e.g. cancelled while the customer was paying: money is on record, refund needed
  end if;

  update public.orders set status = 'paid' where id = p_order_id;
  insert into public.order_events (order_id, from_status, to_status, actor, note)
    values (p_order_id, 'pending_payment', 'paid', 'payment-webhook', p_provider || ' ' || coalesce(p_reference, ''));
  return 'paid';
end $$;

revoke execute on function mark_order_paid(uuid, text, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function mark_order_paid(uuid, text, text, text, text, integer, text) to service_role;
