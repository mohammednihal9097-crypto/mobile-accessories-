"use client";

import { CircleCheck, CircleX, Smartphone } from "lucide-react";
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
    result === "fits" ? "border-green-200 bg-green-50/60"
    : result === "not-listed" ? "border-red-200 bg-red-50/60"
    : "border-slate-200 bg-white";

  return (
    <div className={`space-y-4 rounded-2xl border p-4 text-sm sm:p-5 ${tone}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Smartphone className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <p className="font-semibold text-slate-900">Will it fit my phone?</p>
      </div>

      {result === "universal" ? (
        <p className="text-slate-700">This product is not tied to a phone model, so it works with all phones.</p>
      ) : (
        <>
          <PhoneSelector />
          {result === "fits" && (
            <p className="flex items-start gap-2 font-medium text-green-800">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Listed as compatible with {phoneName}.
            </p>
          )}
          {result === "not-listed" && (
            <p className="flex items-start gap-2 font-medium text-red-800">
              <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {phoneName} is not on this product&apos;s compatibility list. Please don&apos;t order it for that phone.
            </p>
          )}
          {result === "no-phone-selected" && <p className="text-slate-600">Pick your phone to see whether this fits.</p>}

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compatible models</p>
            <div className="mt-2 space-y-1">
              {brands.map((b) => (
                <p key={b} className="text-slate-700">
                  <span className="font-medium text-slate-900">{b}:</span>{" "}
                  {models.filter((m) => m.brand === b).map((m) => m.name).join(", ")}
                </p>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
