"use client";

import { useCatalog } from "./CatalogProvider";

export default function SampleBanner() {
  if (!useCatalog().isSample) return null;
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
      Demo mode: products, prices and stock are sample data, not real. Orders cannot be placed yet.
    </div>
  );
}
