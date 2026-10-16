import { NextResponse } from "next/server";
import { WebhookVerificationError } from "@/lib/payments/adapter";
import { getPaymentProvider } from "@/lib/payments";
import { createSecretClient } from "@/lib/supabase/admin";

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
      return NextResponse.json({ ok: false }, { status: 400 }); // unverified: change nothing
    }
    console.error("payment webhook error", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (result.kind === "ignored") return NextResponse.json({ ok: true, ignored: true });

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
  return NextResponse.json({ ok: true, changed: data === "paid" }); // "duplicate" = repeat event, safely ignored
}
