import type { Product } from "./types";

export type Compat =
  | "no-phone-selected" // customer has not picked a phone yet
  | "universal" // product is not tied to a phone model
  | "fits" // the selected phone is on the product's list
  | "not-listed"; // the selected phone is NOT on the list

/** Compatibility comes only from the product's recorded list; we never guess. */
export function checkCompat(product: Product, phoneId: string | null): Compat {
  if (product.compatibleModelIds.length === 0) return "universal";
  if (!phoneId) return "no-phone-selected";
  return product.compatibleModelIds.includes(phoneId) ? "fits" : "not-listed";
}
