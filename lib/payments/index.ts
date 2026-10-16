import "server-only";
import type { PaymentProvider } from "./adapter";
import { placeholderProvider } from "./placeholder";
import { razorpayProvider } from "./razorpay";

// PAYMENT_PROVIDER=razorpay switches on Razorpay. Anything else (or unset) uses the placeholder,
// which starts no payments and rejects every webhook.
const providers: Record<string, PaymentProvider> = {
  placeholder: placeholderProvider,
  razorpay: razorpayProvider,
};

export function getPaymentProvider(): PaymentProvider {
  return providers[process.env.PAYMENT_PROVIDER ?? "placeholder"] ?? placeholderProvider;
}
