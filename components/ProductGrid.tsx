"use client";

import { useState } from "react";
import { checkCompat } from "@/lib/compat";
import { useMyPhone } from "@/lib/phone";
import type { Product } from "@/lib/types";
import PhoneSelector from "./PhoneSelector";
import ProductCard from "./ProductCard";

/** Product grid with a "my phone" selector and an optional "only what fits" filter. */
export default function ProductGrid({ products }: { products: Product[] }) {
  const phoneId = useMyPhone();
  const [onlyFits, setOnlyFits] = useState(false);
  const filtering = onlyFits && phoneId !== null;
  const shown = filtering
    ? products.filter((p) => {
        const c = checkCompat(p, phoneId);
        return c === "fits" || c === "universal";
      })
    : products;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 sm:items-end">
        <PhoneSelector />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyFits}
            disabled={!phoneId}
            onChange={(e) => setOnlyFits(e.target.checked)}
          />
          Only show items that fit my phone
        </label>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          {filtering ? "Nothing here is listed for your phone." : "No products here yet."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {shown.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
