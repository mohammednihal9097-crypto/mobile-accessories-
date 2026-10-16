import "server-only";
import type { PaymentProvider } from "./adapter";
import { placeholderProvider } from "./placeholder";

// TODO(decision): after you confirm your selling country and provider, add e.g.
//   import { razorpayProvider } from "./razorpay";
// and map it below. Until then everything resolves to the placeholder.
const providers: Record<string, PaymentProvider> = {
  placeholder: placeholderProvider,
};

export function getPaymentProvider(): PaymentProvider {
  return providers[process.env.PAYMENT_PROVIDER ?? "placeholder"] ?? placeholderProvider;
}
