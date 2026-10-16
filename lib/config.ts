// Store-wide settings. Change them here; nothing else in the app hard-codes these.
// TODO(decision): confirm the selling country, currency and delivery area.
export const STORE = {
  name: "Your Store Name", // placeholder until you pick a brand name
  tagline: "Phone accessories that fit your phone",
  currency: "INR", // placeholder — pending your selling-country decision
  locale: "en-IN",
  // Placeholder delivery rules (pending your decision). Amounts are in the smallest
  // currency unit (paise for INR) to avoid rounding mistakes.
  shipping: {
    flatFee: 4900,
    freeOver: 49900,
    areaNote: "Delivery area not decided yet — placeholder.",
  },
} as const;

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
