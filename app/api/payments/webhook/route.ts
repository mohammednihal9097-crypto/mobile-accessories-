import { after, NextResponse } from "next/server";
import { flushNotifications } from "@/lib/notifications/flush";
import { WebhookVerificationError } from "@/lib/payments/adapter";
import { getPaymentProvider } from "@/lib/payments";
import { createSecretClient } from "@/lib/supabase/admin";

/**
 * Diagnostics: remember what happened to each webhook call (never any secret or customer data), so a failed
 * delivery can be explained without server logs. Capped, and safe to delete once payments work end to end.
 */
async function diag(outcome: string) {
  console.warn("payment webhook:", outcome);
  try {
    const db = createSecretClient();
    const { count } = await db.from("webhook_events").select("event_id", { count: "exact", head: true }).eq("source", "diag:razorpay");
    if ((count ?? 0) < 200) await db.from("webhook_events").insert({ source: "diag:razorpay", event_id: `${new Date().toISOString()} | ${outcome}`.slice(0, 250) });
  } catch {
    /* diagnostics must never break the webhook */
  }
}

// The ONLY way an order becomes "paid". The provider calls this URL; we verify its signature first.
// Order of operations: verify signature -> ask the database to record it (idempotent) -> answer 200.
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  const rawBody = await request.text(); // signatures are computed over the exact raw bytes

  let result;
  try {
    result = await provider.verifyWebhook(rawBody, request.headers);
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      await diag(`rejected: ${e.message}`);
      return NextResponse.json({ ok: false }, { status: 400 }); // unverified: change nothing
    }
    console.error("payment webhook error", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (result.kind === "ignored") {
    await diag(`ignored: ${result.reason}`);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { event } = result;
  const { data, error } = await createSecretClient().rpc("mark_order_paid", {
    p_order_id: event.orderId,
    p_source: `payment:${provider.name}`,
    p_event_id: event.eventId,
    p_provider: provider.name,
    p_reference: event.reference,
    p_amount_minor: event.amountMinor,
    p_currency: event.currency,
  });

  if (error) {
    if (error.message.includes("payment_amount_mismatch")) {
      // Verified event, but the amount doesn't match the order. Do NOT mark paid; a person must look.
      console.error("PAYMENT AMOUNT MISMATCH", event.orderId, event.reference);
      return NextResponse.json({ ok: false, reason: "amount_mismatch" }, { status: 200 });
    }
    console.error("mark_order_paid failed", error.message);
    return NextResponse.json({ ok: false }, { status: 500 }); // 500 makes the provider retry later
  }
  if (data === "not_pending") {
    // Verified money arrived for an order that is no longer waiting for payment (e.g. cancelled).
    // The payment is on record; the admin dashboard flags it so you can refund the customer.
    console.error("PAYMENT FOR NON-PENDING ORDER, REFUND MAY BE NEEDED", event.orderId, event.reference);
    return NextResponse.json({ ok: true, needsReview: true });
  }
  await diag(`result: ${String(data)}`);
  if (data === "paid") after(() => flushNotifications()); // payment receipt and admin alert go out now
  return NextResponse.json({ ok: true, changed: data === "paid" }); // "duplicate" = repeat event, safely ignored
}
