// Store-wide settings. Change them here; nothing else in the app hard-codes these.
// Decided: selling in India, INR, delivery across India. Still to confirm: delivery fees, GST.
export const STORE = {
  name: "Trio Store",
  tagline: "Charge forward",
  currency: "INR",
  locale: "en-IN",
  // Delivery rules. The fee numbers are PLACEHOLDERS until you confirm them. Amounts are in the smallest
  // currency unit (paise for INR) to avoid rounding mistakes.
  shipping: {
    flatFee: 4900,
    freeOver: 49900,
    areaNote: "We deliver across India.",
  },
  // Details shown on the policy and contact pages. Anything still in [square brackets] is a blank
  // for YOU to fill in. The policy pages show a "draft" notice until `reviewed` is true. Set it to true
  // only after a lawyer or accountant has checked the policy wording for your business.
  legal: {
    reviewed: false,
    lastUpdated: "17 October 2026",
    businessName: "Trio Store",
    address: "[Your registered business address]",
    email: "[Your support email]",
    phone: "[Your support phone number]",
    // WhatsApp number for customers to message, digits only with country code (example: 919876543210). Empty = hidden.
    whatsappDigits: "",
    grievanceOfficer: "[Name of the person who handles complaints]",
    jurisdictionCity: "[Your city]",
    // Placeholder policy numbers. Change them to what you really offer.
    returnWindowDays: 7,
    refundDays: 7,
    dispatchTime: "1 to 2 business days",
    deliveryTime: "3 to 7 business days",
  },
} as const;

/** True while a legal detail is still an unfilled [placeholder]. */
export function isBlank(value: string): boolean {
  return value.trim() === "" || value.includes("[");
}

/** Format an amount stored in the smallest currency unit, e.g. 49900 -> ₹499.00 */
export function formatMoney(minorUnits: number): string {
  return new Intl.NumberFormat(STORE.locale, {
    style: "currency",
    currency: STORE.currency,
    minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
  }).format(minorUnits / 100);
}

export function shippingFor(subtotal: number): number {
  if (subtotal === 0) return 0;
  return subtotal >= STORE.shipping.freeOver ? 0 : STORE.shipping.flatFee;
}
