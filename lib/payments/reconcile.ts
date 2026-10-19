import "server-only";
import { after } from "next/server";
import { flushNotifications } from "@/lib/notifications/flush";
import { createSecretClient } from "@/lib/supabase/admin";
import { checkLinkPaid, type RazorpayLink } from "./razorpay-check";

// Payment confirmation by ASKING RAZORPAY, instead of trusting anything we were sent.
// We fetch the order's payment link from Razorpay's API (authenticated with our own keys) and mark the order paid
// only if every check in checkLinkPaid() passes. Because the answer comes from Razorpay itself, it works even if the
// webhook secret is mismatched or a webhook was missed. The database function is idempotent, so running it twice is safe.

export type ReconcileResult = "paid" | "already-paid" | "not-paid" | "not-applicable" | "error";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function reconcileOrderPayment(orderId: string): Promise<ReconcileResult> {
  if (!UUID.test(orderId)) return "not-applicable";
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret || keyId.startsWith("your-") || keySecret.startsWith("your-") || keyId.startsWith("paste-")) return "not-applicable";

  const db = createSecretClient();
  const { data: order } = await db
    .from("orders")
    .select("id, order_number, status, total_minor, currency, payment_link_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || !order.payment_link_id) return "not-applicable";
  if (order.status !== "pending_payment") return order.status === "cancelled" ? "not-applicable" : "already-paid";

  let link: RazorpayLink | null = null;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(order.payment_link_id)}`, {
      headers: { authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return "error";
    link = (await res.json()) as RazorpayLink;
  } catch {
    return "error";
  }

  const check = checkLinkPaid(link, {
    id: order.id, orderNumber: order.order_number, totalMinor: order.total_minor, currency: order.currency,
  });
  if (!check.ok) return "not-paid";

  const { data, error } = await db.rpc("mark_order_paid", {
    p_order_id: order.id,
    p_source: "payment:razorpay-verified",
    p_event_id: `verify:${check.linkId}`,
    p_provider: "razorpay",
    p_reference: check.paymentId,
    p_amount_minor: check.amountMinor,
    p_currency: order.currency,
  });
  if (error) {
    console.error("reconcile: mark_order_paid failed", error.message);
    return "error";
  }
  if (data === "paid") {
    after(() => flushNotifications()); // payment receipt and admin alert go out now
    return "paid";
  }
  return "already-paid"; // "duplicate" or "not_pending"
}

/** Checks every order still waiting for payment that has a payment link (used by the daily job). */
export async function reconcileAllPending(limit = 25): Promise<{ checked: number; paid: number }> {
  const db = createSecretClient();
  const { data } = await db
    .from("orders")
    .select("id")
    .eq("status", "pending_payment")
    .not("payment_link_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  let paid = 0;
  for (const o of data ?? []) if ((await reconcileOrderPayment(o.id)) === "paid") paid++;
  return { checked: data?.length ?? 0, paid };
}
