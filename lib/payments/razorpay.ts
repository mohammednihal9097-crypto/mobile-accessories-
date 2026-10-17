import "server-only";
import { createSecretClient } from "../supabase/admin";
import { WebhookVerificationError, type PaymentProvider } from "./adapter";
import { parsePaymentLinkPaid, signatureIsValid, whyIgnored } from "./razorpay-webhook";

// Razorpay via hosted Payment Links (docs checked Oct 2026):
//   POST https://api.razorpay.com/v1/payment_links   (HTTP Basic: key id + key secret)
// The customer pays on Razorpay's own page, so card and UPI details never touch this site.
// An order becomes paid ONLY when Razorpay's signed "payment_link.paid" webhook arrives
// (the redirect back to the site proves nothing).
//
// Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (server only), RAZORPAY_WEBHOOK_SECRET.
// Use rzp_test_ keys first. Razorpay's test mode allows up to 30 payment links.

const API = "https://api.razorpay.com/v1/payment_links";
const LINK_LIFETIME_SECONDS = 12 * 3600; // shorter than the 24h unpaid-order expiry, so nobody pays a cancelled order

function creds(): { id: string; secret: string } | null {
  const id = process.env.RAZORPAY_KEY_ID?.trim();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return id && secret && !id.startsWith("your-") && !secret.startsWith("your-") ? { id, secret } : null;
}

export const razorpayProvider: PaymentProvider = {
  name: "razorpay",

  async start(order) {
    const c = creds();
    if (!c) return { kind: "unavailable", reason: "Online payment is not set up yet." };
    const db = createSecretClient();

    // Reuse an existing link: reloading the page must never create a second payable link.
    const { data: row } = await db.from("orders").select("payment_link_url").eq("id", order.id).maybeSingle();
    if (row?.payment_link_url) return { kind: "redirect", url: row.payment_link_url };

    // Our own site is the redirect target, with the order's private link token.
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${Buffer.from(`${c.id}:${c.secret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: order.totalMinor, // smallest unit (paise)
        currency: order.currency,
        reference_id: order.orderNumber, // unique per order, so Razorpay itself refuses a second link
        description: `Order ${order.orderNumber}`,
        customer: { name: order.customerName, contact: order.whatsapp },
        notify: { sms: false, email: false },
        reminder_enable: false,
        expire_by: Math.floor(Date.now() / 1000) + LINK_LIFETIME_SECONDS,
        notes: { order_id: order.id },
        callback_url: order.returnUrl,
        callback_method: "get",
      }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => null);

    if (!res?.ok) {
      // Possibly a parallel request created it a moment ago: look again before giving up.
      const { data: again } = await db.from("orders").select("payment_link_url").eq("id", order.id).maybeSingle();
      if (again?.payment_link_url) return { kind: "redirect", url: again.payment_link_url };
      console.error("razorpay link creation failed", res?.status, res ? (await res.text()).slice(0, 300) : "no response");
      return { kind: "unavailable", reason: "We couldn't start the payment. Please try again in a minute." };
    }

    const link = (await res.json()) as { id?: string; short_url?: string };
    if (!link.id || !link.short_url?.startsWith("https://")) {
      return { kind: "unavailable", reason: "We couldn't start the payment. Please try again in a minute." };
    }
    await db.from("orders").update({ payment_link_id: link.id, payment_link_url: link.short_url }).eq("id", order.id);
    return { kind: "redirect", url: link.short_url };
  },

  async verifyWebhook(rawBody, headers) {
    // .trim(): a pasted setting often carries an invisible trailing line break, which would make every signature check fail.
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!secret || secret.startsWith("your-") || !signatureIsValid(rawBody, headers.get("x-razorpay-signature"), secret)) {
      throw new WebhookVerificationError(secret && !secret.startsWith("your-") ? "bad signature (secret in Razorpay and in the shop differ)" : "no webhook secret set in the shop");
    }
    const eventId = headers.get("x-razorpay-event-id");
    if (!eventId) throw new WebhookVerificationError("missing event id");

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new WebhookVerificationError("bad json");
    }
    const paid = parsePaymentLinkPaid(body);
    if (!paid) return { kind: "ignored", reason: whyIgnored(body) };
    return { kind: "paid", event: { eventId, orderId: paid.orderId, reference: paid.reference, amountMinor: paid.amountMinor, currency: paid.currency } };
  },
};
