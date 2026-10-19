// Pure check: does what Razorpay's API says about a payment link prove this order is paid?
// No imports, so it is easy to test. The data comes from Razorpay's own API (authenticated with our keys),
// never from a request someone sent us, so it cannot be faked.

export type RazorpayLink = {
  id?: string;
  status?: string;
  reference_id?: string;
  currency?: string;
  notes?: { order_id?: string } | null;
  payments?: { payment_id?: string; status?: string; amount?: number }[] | null;
};

export type OrderFacts = { id: string; orderNumber: string; totalMinor: number; currency: string };

export type PaidCheck =
  | { ok: true; paymentId: string; amountMinor: number; linkId: string }
  | { ok: false; reason: string };

export function checkLinkPaid(link: RazorpayLink | null | undefined, order: OrderFacts): PaidCheck {
  if (!link?.id) return { ok: false, reason: "no payment link" };
  if (link.status !== "paid") return { ok: false, reason: `link status is ${link.status ?? "unknown"}` };
  if (link.reference_id !== order.orderNumber) return { ok: false, reason: "link belongs to a different order number" };
  if (link.notes?.order_id !== order.id) return { ok: false, reason: "link notes do not carry this order id" };
  if (link.currency !== order.currency) return { ok: false, reason: "currency differs" };
  const pay = (link.payments ?? []).find((p) => p.status === "captured");
  if (!pay?.payment_id) return { ok: false, reason: "no captured payment" };
  if (pay.amount !== order.totalMinor) return { ok: false, reason: "paid amount differs from the order total" };
  return { ok: true, paymentId: pay.payment_id, amountMinor: pay.amount, linkId: link.id };
}
