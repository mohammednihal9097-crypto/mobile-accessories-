// Payment adapter: the ONLY place provider-specific code is allowed to live.
// When you choose a provider (Stage 5, after your country decision) you add one file that
// implements this interface and register it in index.ts. Nothing else in the app changes.
//
// Hard rules for every provider implementation:
//  1. verifyWebhook must check the provider's cryptographic signature on the RAW request body.
//     If it cannot prove the event came from the provider, it must throw WebhookVerificationError.
//  2. Never treat a browser redirect or a customer's message as proof of payment.
//  3. Amount and currency come from the verified event and are compared with the order inside the
//     database function mark_order_paid().

export type PaymentOrder = {
  id: string;
  orderNumber: string;
  totalMinor: number;
  currency: string;
  customerName: string;
  whatsapp: string;
};

export type PayStart =
  | { kind: "unavailable"; reason: string } // no provider connected
  | { kind: "redirect"; url: string }; // send the customer to the provider's hosted payment page

export type VerifiedPaymentEvent = {
  eventId: string; // provider's unique event id (used to ignore repeats)
  orderId: string; // our order id, which we passed to the provider when starting the payment
  reference: string; // provider's payment id
  amountMinor: number;
  currency: string;
};

export type WebhookResult =
  | { kind: "paid"; event: VerifiedPaymentEvent }
  | { kind: "ignored"; reason: string }; // valid event we don't act on (e.g. "payment started")

export class WebhookVerificationError extends Error {}

export interface PaymentProvider {
  name: string;
  start(order: PaymentOrder): Promise<PayStart>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookResult>;
}
