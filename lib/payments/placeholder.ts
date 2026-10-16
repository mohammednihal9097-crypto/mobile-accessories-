import { WebhookVerificationError, type PaymentProvider } from "./adapter";

/**
 * PLACEHOLDER. No real payment provider is connected.
 * It starts nothing and REJECTS every webhook, so no order can be marked paid by accident
 * (or by an attacker posting fake events) until a real, signature-checking provider is added.
 */
export const placeholderProvider: PaymentProvider = {
  name: "placeholder",
  async start() {
    return { kind: "unavailable", reason: "Online payment is not switched on yet." };
  },
  async verifyWebhook() {
    throw new WebhookVerificationError("No payment provider is configured");
  },
};
