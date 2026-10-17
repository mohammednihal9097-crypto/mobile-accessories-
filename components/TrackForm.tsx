"use client";

import { useActionState } from "react";
import { Check, CircleX, ExternalLink, PackageCheck, PackageSearch, Search, Truck, Wallet, CircleDot } from "lucide-react";
import { trackOrder, type TrackState } from "@/app/track/actions";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";

const field = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5";
const STEPS = [
  { key: "pending_payment", label: "Order placed", Icon: CircleDot },
  { key: "paid", label: "Paid", Icon: Wallet },
  { key: "processing", label: "Packing", Icon: PackageSearch },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: PackageCheck },
];

const MESSAGE: Record<string, string> = {
  pending_payment: "We have your order and are holding your items. It moves on once payment is confirmed.",
  paid: "Payment confirmed. We will start packing your order.",
  processing: "We are packing your order.",
  shipped: "Your order is on its way.",
  delivered: "Your order was delivered.",
  cancelled: "This order was cancelled.",
};

export default function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, null);
  const order = state?.order;
  const reached = order ? STEPS.findIndex((s) => s.key === order.status) : -1;

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Order number
            <input name="order_number" required placeholder="ORD-1001" className={`${field} mt-1 font-normal`} autoComplete="off" />
          </label>
          <label className="block text-sm font-medium">WhatsApp number used at checkout
            <input name="whatsapp" required type="tel" placeholder="+91 98765 43210" className={`${field} mt-1 font-normal`} autoComplete="tel" />
          </label>
        </div>
        <button
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {pending ? "Checking…" : "Track order"}
        </button>
        {state?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      </form>

      {order && (
        <section aria-live="polite" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Order {order.orderNumber}</h2>
            <span className={`rounded-full px-3 py-0.5 text-sm font-medium ${ORDER_STATUS_COLOR[order.status]}`}>{ORDER_STATUS_LABEL[order.status]}</span>
          </div>
          <p className="text-slate-700">{MESSAGE[order.status]}</p>

          {order.status === "cancelled" ? (
            <p className="flex items-center gap-2 text-sm text-slate-600"><CircleX className="h-4 w-4" aria-hidden="true" />This order will not be delivered.</p>
          ) : (
            <ol className="grid gap-3 sm:grid-cols-5">
              {STEPS.map(({ key, label, Icon }, i) => {
                const done = i <= reached;
                return (
                  <li key={key} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${done ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {done && i < reached ? <Check className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <span className={`text-sm ${done ? "font-semibold text-slate-900" : "text-slate-500"}`}>{label}</span>
                  </li>
                );
              })}
            </ol>
          )}

          {(order.courier || order.trackingNumber) && (
            <div className="space-y-1 rounded-xl bg-brand-50/60 p-4 text-sm">
              <p className="font-semibold text-slate-900">Delivery details</p>
              {order.courier && <p>Courier: {order.courier}</p>}
              {order.trackingNumber && <p>Tracking number: {order.trackingNumber}</p>}
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 underline">
                  Track your parcel <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}

          <div className="text-sm">
            <p className="mb-1 font-semibold text-slate-900">Items</p>
            <ul className="space-y-0.5 text-slate-700">
              {order.items.map((i, idx) => <li key={idx}>{i.name} × {i.quantity}</li>)}
            </ul>
          </div>

          <div className="text-sm">
            <p className="mb-1 font-semibold text-slate-900">Progress</p>
            <ul className="space-y-0.5 text-slate-600">
              {order.history.map((h, idx) => <li key={idx}>{new Date(h.at).toLocaleString()}: {ORDER_STATUS_LABEL[h.status]}</li>)}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
