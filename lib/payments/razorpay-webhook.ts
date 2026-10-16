// Pure Razorpay webhook checks (no database, no network) so they can be tested.
// Checked against Razorpay's docs, Oct 2026:
//  - signature = HMAC-SHA256 of the RAW body with your webhook secret, in header X-Razorpay-Signature
//  - header x-razorpay-event-id is unique per event (used to ignore repeats)
//  - payment link paid event: "payment_link.paid"
import { createHmac, timingSafeEqual } from "node:crypto";

export function signatureIsValid(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

export type PaidEvent = {
  orderId: string; reference: string; amountMinor: number; currency: string;
};

type Payload = {
  event?: string;
  payload?: {
    payment_link?: { entity?: { notes?: { order_id?: string } | null; status?: string } };
    payment?: { entity?: { id?: string; amount?: number; currency?: string; status?: string } };
  };
};

/**
 * From an ALREADY SIGNATURE-VERIFIED body: the facts we need, or null for events we do not act on.
 * The order id is the one WE put in the payment link's notes. Amount and currency come from the
 * captured payment, and the database re-checks them against the order before marking it paid.
 */
export function parsePaymentLinkPaid(body: unknown): PaidEvent | null {
  const p = body as Payload;
  if (p?.event !== "payment_link.paid") return null;
  const orderId = p.payload?.payment_link?.entity?.notes?.order_id;
  const pay = p.payload?.payment?.entity;
  if (typeof orderId !== "string" || !pay?.id || pay.status !== "captured") return null;
  if (!Number.isInteger(pay.amount) || typeof pay.currency !== "string") return null;
  return { orderId, reference: pay.id, amountMinor: pay.amount as number, currency: pay.currency };
}
