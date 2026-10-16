"use client";

import { checkCompat } from "@/lib/compat";
import { useCatalog } from "./CatalogProvider";
import { useMyPhone } from "@/lib/phone";
import type { Product } from "@/lib/types";
import PhoneSelector from "./PhoneSelector";

export default function CompatibilityPanel({ product }: { product: Product }) {
  const { phoneModels } = useCatalog();
  const getPhoneModel = (id: string) => phoneModels.find((m) => m.id === id);
  const phoneId = useMyPhone();
  const result = checkCompat(product, phoneId);
  const phoneName = phoneId ? getPhoneModel(phoneId)?.name : "";
  const models = product.compatibleModelIds.flatMap((id) => {
    const m = getPhoneModel(id);
    return m ? [m] : [];
  });
  const brands = [...new Set(models.map((m) => m.brand))];

  const tone =
    result === "fits" ? "border-green-300 bg-green-50"
    : result === "not-listed" ? "border-red-300 bg-red-50"
    : "border-slate-200 bg-white";

  return (
    <div className={`space-y-3 rounded-xl border p-4 text-sm ${tone}`}>
      <p className="font-semibold">Will it fit my phone?</p>

      {result === "universal" ? (
        <p className="text-slate-700">This product is not tied to a phone model, so it works with all phones.</p>
      ) : (
        <>
          <PhoneSelector />
          {result === "fits" && <p className="font-medium text-green-800">✓ Listed as compatible with {phoneName}.</p>}
          {result === "not-listed" && (
            <p className="font-medium text-red-800">
              ✗ {phoneName} is not on this product&apos;s compatibility list. Please don&apos;t order it for that phone.
            </p>
          )}
          {result === "no-phone-selected" && <p className="text-slate-600">Pick your phone to see whether this fits.</p>}

          <div>
            <p className="font-medium">Compatible models</p>
            {brands.map((b) => (
              <p key={b} className="text-slate-600">
                <span className="font-medium text-slate-800">{b}:</span>{" "}
                {models.filter((m) => m.brand === b).map((m) => m.name).join(", ")}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
