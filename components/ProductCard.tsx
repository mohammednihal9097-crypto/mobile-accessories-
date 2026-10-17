"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/config";
import type { Product } from "@/lib/types";
import { useCatalog } from "./CatalogProvider";
import CompatBadge from "./CompatBadge";
import ProductImage from "./ProductImage";
import StockBadge from "./StockBadge";

export default function ProductCard({ product }: { product: Product }) {
  const { categories } = useCatalog();
  const category = categories.find((c) => c.slug === product.categorySlug);
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
    >
      <div className="overflow-hidden">
        <div className="transition duration-300 group-hover:scale-[1.03]">
          <ProductImage product={product} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {category && <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{category.name}</p>}
        <h3 className="text-sm font-semibold leading-snug text-slate-900 group-hover:text-brand-700 sm:text-base">{product.name}</h3>
        <p className="text-base font-semibold text-slate-900 sm:text-lg">{formatMoney(product.price)}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <StockBadge stock={product.stock} />
          <CompatBadge product={product} />
        </div>
      </div>
    </Link>
  );
}
