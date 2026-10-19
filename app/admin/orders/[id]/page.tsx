import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/admin/Flash";
import { formatMoney } from "@/lib/config";
import { CAN_CANCEL, NEXT_STATUS, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { requireAdmin } from "@/lib/supabase/auth";
import { checkPayment, setOrderStatus } from "../../actions";

const NEXT_BUTTON: Record<string, string> = {
  paid: "Mark as paid (payment received outside the website)",
  processing: "Start processing",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
};

export default async function OrderDetail({ params, searchParams }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: order }, { data: items }, { data: events }, { data: payments }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("id, product_name, unit_price_minor, quantity").eq("order_id", id),
    supabase.from("order_events").select("id, from_status, to_status, actor, note, created_at").eq("order_id", id).order("created_at"),
    supabase.from("payments").select("id, provider, provider_reference, amount_minor, verified, created_at").eq("order_id", id),
  ]);
  if (!order) notFound();

  const next = NEXT_STATUS[order.status];
  const address = order.shipping_address as Record<string, string>;

  return (
    <div className="space-y-5">
      <p className="text-sm"><Link href="/admin/orders" className="text-slate-500 hover:underline">← Orders</Link></p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{order.order_number}</h1>
        <span className={`rounded px-2 py-0.5 text-sm font-medium ${ORDER_STATUS_COLOR[order.status]}`}>{ORDER_STATUS_LABEL[order.status]}</span>
      </div>
      <Flash searchParams={searchParams} />

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-1 font-semibold">Customer</h2>
          <p>{order.customer_name}</p>
          <p>WhatsApp: {order.whatsapp_number}</p>
          {order.email && <p>{order.email}</p>}
          <h2 className="mb-1 mt-3 font-semibold">Deliver to</h2>
          {Object.values(address ?? {}).map((line, i) => <p key={i}>{String(line)}</p>)}
          {(order.courier_name || order.tracking_number) && (
            <>
              <h2 className="mb-1 mt-3 font-semibold">Shipping</h2>
              {order.courier_name && <p>Courier: {order.courier_name}</p>}
              {order.tracking_number && <p>Tracking: {order.tracking_number}</p>}
              {order.tracking_url && <p><a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">Tracking link</a></p>}
            </>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-1 font-semibold">Items</h2>
          {(items ?? []).map((i) => (
            <p key={i.id} className="flex justify-between"><span>{i.product_name} × {i.quantity}</span><span>{formatMoney(i.unit_price_minor * i.quantity)}</span></p>
          ))}
          <hr className="my-2" />
          <p className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotal_minor)}</span></p>
          <p className="flex justify-between"><span>Delivery</span><span>{formatMoney(order.shipping_minor)}</span></p>
          <p className="flex justify-between font-semibold"><span>Total</span><span>{formatMoney(order.total_minor)}</span></p>
        </section>
      </div>

      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold">Payment</h2>
        {(payments ?? []).length === 0 ? (
          <p className="text-slate-600">No verified payment recorded. Verified online payments arrive in Stage 5.</p>
        ) : (
          payments!.map((p) => (
            <p key={p.id}>{p.provider} {p.provider_reference} — {formatMoney(p.amount_minor)} — {p.verified ? "verified by provider" : "unverified"}</p>
          ))
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="font-semibold">Update status</h2>
        {!next && !CAN_CANCEL.includes(order.status) && <p className="text-slate-600">This order is finished. No further changes.</p>}
        <div className="flex flex-wrap gap-2">
          {next && next !== "shipped" && (
            <form action={setOrderStatus}>
              <input type="hidden" name="order_id" value={order.id} />
              <input type="hidden" name="status" value={next} />
              <button className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">{NEXT_BUTTON[next]}</button>
            </form>
          )}
          {next === "shipped" && (
            <form action={setOrderStatus} className="w-full space-y-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
              <input type="hidden" name="order_id" value={order.id} />
              <input type="hidden" name="status" value="shipped" />
              <p className="font-semibold">Shipping details <span className="font-normal text-slate-600">(sent to the customer on WhatsApp)</span></p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">Courier
                  <input name="courier" list="couriers" placeholder="e.g. Delhivery" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
                  <datalist id="couriers">
                    <option value="India Post" /><option value="Delhivery" /><option value="Blue Dart" /><option value="DTDC" />
                    <option value="Ecom Express" /><option value="Xpressbees" /><option value="Shadowfax" />
                  </datalist>
                </label>
                <label className="block">Tracking number
                  <input name="tracking_number" placeholder="e.g. 1234567890" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
                </label>
              </div>
              <label className="block">Tracking link (optional)
                <input name="tracking_url" type="url" placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
              </label>
              <button className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">{NEXT_BUTTON.shipped}</button>
            </form>
          )}
          {CAN_CANCEL.includes(order.status) && (
            <form action={setOrderStatus}>
              <input type="hidden" name="order_id" value={order.id} />
              <input type="hidden" name="status" value="cancelled" />
              <button className="rounded-xl border border-red-300 px-4 py-2 font-semibold text-red-700">Cancel order and return stock</button>
            </form>
          )}
        </div>
        {order.status === "pending_payment" && (
          <form action={checkPayment} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <input type="hidden" name="order_id" value={order.id} />
            <button className="rounded-xl border border-brand-300 bg-white px-4 py-2 font-semibold text-brand-700 hover:bg-brand-50">Check payment with Razorpay</button>
            <span className="text-xs text-slate-600">Asks Razorpay directly. If the customer really paid, the order is marked Paid for you.</span>
          </form>
        )}
        {order.status === "pending_payment" && (
          <p className="text-xs text-amber-800">Only mark as paid after you have confirmed the money arrived in your payment account or bank. Do not rely on a customer&apos;s message or screenshot.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <h2 className="mb-1 font-semibold">History</h2>
        <ul className="space-y-1 text-slate-600">
          {(events ?? []).map((e) => (
            <li key={e.id}>
              {new Date(e.created_at).toLocaleString()} — {e.from_status ? `${ORDER_STATUS_LABEL[e.from_status]} → ` : ""}
              <strong>{ORDER_STATUS_LABEL[e.to_status]}</strong> by {e.actor}{e.note ? ` (${e.note})` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
