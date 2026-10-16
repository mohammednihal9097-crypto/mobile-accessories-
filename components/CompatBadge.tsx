"use client";

import { checkCompat } from "@/lib/compat";
import { useCatalog } from "./CatalogProvider";
import { useMyPhone } from "@/lib/phone";
import type { Product } from "@/lib/types";

export default function CompatBadge({ product }: { product: Product }) {
  const { phoneModels } = useCatalog();
  const phoneId = useMyPhone();
  const result = checkCompat(product, phoneId);
  const phoneName = phoneId ? phoneModels.find((m) => m.id === phoneId)?.name : undefined;

  if (result === "universal")
    return <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Fits all phones</span>;
  if (result === "fits")
    return <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">✓ Fits {phoneName}</span>;
  if (result === "not-listed")
    return <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">✗ Not listed for {phoneName}</span>;
  return <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">Choose your phone to check fit</span>;
}
