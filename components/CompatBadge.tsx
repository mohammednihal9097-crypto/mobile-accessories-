"use client";

import { Check, Smartphone, X } from "lucide-react";
import { checkCompat } from "@/lib/compat";
import { useCatalog } from "./CatalogProvider";
import { useMyPhone } from "@/lib/phone";
import type { Product } from "@/lib/types";

const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium";

export default function CompatBadge({ product }: { product: Product }) {
  const { phoneModels } = useCatalog();
  const phoneId = useMyPhone();
  const result = checkCompat(product, phoneId);
  const phoneName = phoneId ? phoneModels.find((m) => m.id === phoneId)?.name : undefined;

  if (result === "universal")
    return <span className={`${base} bg-slate-100 text-slate-700`}><Smartphone className="h-3.5 w-3.5" aria-hidden="true" />Fits all phones</span>;
  if (result === "fits")
    return <span className={`${base} bg-green-50 text-green-700 ring-1 ring-green-100`}><Check className="h-3.5 w-3.5" aria-hidden="true" />Fits {phoneName}</span>;
  if (result === "not-listed")
    return <span className={`${base} bg-red-50 text-red-700 ring-1 ring-red-100`}><X className="h-3.5 w-3.5" aria-hidden="true" />Not listed for {phoneName}</span>;
  return <span className={`${base} bg-brand-50 text-brand-700`}><Smartphone className="h-3.5 w-3.5" aria-hidden="true" />Check fit for your phone</span>;
}
