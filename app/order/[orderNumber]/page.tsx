import { Suspense } from "react";
import { notFound } from "next/navigation";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import PaymentNotice from "@/components/PaymentNotice";
import { formatMoney } from "@/lib/config";
import { tokenMatches } from "@/lib/order-token";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { getPaymentProvider } from "@/lib/payments";
const getPaymentProviderName = () => getPaymentProvider().name;
import { siteUrl } from "@/lib/bot/data";
import { createSecretClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Your order", robots: { index: false, follow: false } };

export default function OrderPage({ params, searchParams }: PageProps<"/order/[orderNumber]">) {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading your order…</p>}>
      <OrderContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const CUSTOMER_TEXT: Record<string, string> = {
  pending_payment: "We have your order and are holding your items. It will move on once payment is confirmed.",
  paid: "Payment confirmed. We will start packing your order.",
  processing: "We are packing your order.",
  shipped: "Your order is on its way.",
  delivered: "Your order was delivered.",
  cancelled: "This order was cancelled.",
};

async function OrderContent({ params, searchParams }: { params: PageProps<"/order/[orderNumber]">["params"]; searchParams: PageProps<"/order/[orderNumber]">["searchParams"] }) {
  const { orderNumber } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  if (!isSupabaseConfigured() || !/^ORD-\d{1,12}$/.test(orderNumber) || !token) notFound();

  // Customers have no database access. The server looks the order up and checks the secret token.
  const db = createSecretClient();
  const { data: order } = await db
    .from("orders")
    .select("id, order_number, status, customer_name, whatsapp_number, currency, subtotal_minor, shipping_minor, total_minor, lookup_token_hash, created_at, courier_name, tracking_number, tracking_url, shipping_address")
    .eq("order_number", orderNumber)
    .maybeSingle();
  // Same "not found" for a wrong order number and a wrong token, so numbers can't be guessed.
  if (!order || !tokenMatches(token, order.lookup_token_hash)) notFound();

  const [{ data: items }, { data: events }] = await Promise.all([
    db.from("order_items").select("id, product_name, unit_price_minor, quantity").eq("order_id", order.id),
    db.from("order_events").select("id, to_status, created_at").eq("order_id", order.id).order("created_at"),
  ]);

  const pay =
    order.status === "pending_payment"
      ? await getPaymentProvider().start({
          id: order.id, orderNumber: order.order_number, totalMinor: order.total_minor,
          currency: order.currency, customerName: order.customer_name, whatsapp: order.whatsapp_number,
          returnUrl: `${siteUrl()}/order/${order.order_number}?t=${token}`,
        })
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {sp.placed && <ClearCartOnMount />}
      {sp.placed && (
        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
          Thank you, {order.customer_name}! Your order is placed. <strong>Save this page&apos;s link</strong>: it is how you check your order.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Order {order.order_number}</h1>
        <span className={`rounded px-2 py-0.5 text-sm font-medium ${ORDER_STATUS_COLOR[order.status]}`}>{ORDER_STATUS_LABEL[order.status]}</span>
      </div>
      <p className="text-slate-700">{CUSTOMER_TEXT[order.status]}</p>

      <section className="space-y-1 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        {(items ?? []).map((i) => (
          <p key={i.id} className="flex justify-between"><span>{i.product_name} × {i.quantity}</span><span>{formatMoney(i.unit_price_minor * i.quantity)}</span></p>
        ))}
        <hr className="my-2" />
        <p className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotal_minor)}</span></p>
        <p className="flex justify-between"><span>Delivery</span><span>{order.shipping_minor === 0 ? "Free" : formatMoney(order.shipping_minor)}</span></p>
        <p className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatMoney(order.total_minor)}</span></p>
      </section>

      {(order.status === "shipped" || order.status === "delivered") && (order.courier_name || order.tracking_number) && (
        <section className="space-y-1 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="font-semibold">Delivery details</h2>
          {order.courier_name && <p>Courier: {order.courier_name}</p>}
          {order.tracking_number && <p>Tracking number: {order.tracking_number}</p>}
          {order.tracking_url && (
            <p><a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">Track your parcel</a></p>
          )}
        </section>
      )}
      {pay?.kind === "redirect" && (
        <a href={pay.url} className="block rounded-xl bg-brand-600 py-3 text-center font-semibold text-white">Pay now</a>
      )}
      {(order.status === "shipped" || order.status === "delivered") && (order.courier_name || order.tracking_number) && (
        <section className="space-y-1 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="font-semibold">Delivery details</h2>
          {order.courier_name && <p>Courier: {order.courier_name}</p>}
          {order.tracking_number && <p>Tracking number: {order.tracking_number}</p>}
          {order.tracking_url && (
            <p><a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">Track your parcel</a></p>
          )}
        </section>
      )}
      {pay?.kind === "redirect" && (
        <p className="text-center text-xs text-slate-500">
          After paying you come back here. Your order changes to &quot;Paid&quot; once the payment is confirmed, which can take a minute. Refresh this page to see it.
        </p>
      )}
      {pay?.kind === "unavailable" && (getPaymentProviderName() === "placeholder" ? <PaymentNotice /> : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{pay.reason}</p>)}

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="mb-1 font-semibold">Progress</h2>
        <ul className="space-y-1 text-slate-600">
          {(events ?? []).map((e) => (
            <li key={e.id}>{new Date(e.created_at).toLocaleString()}: {ORDER_STATUS_LABEL[e.to_status]}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
