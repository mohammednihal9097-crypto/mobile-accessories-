import Link from "next/link";
import { formatMoney } from "@/lib/config";
import type { Product } from "@/lib/types";
import CompatBadge from "./CompatBadge";
import ProductImage from "./ProductImage";
import StockBadge from "./StockBadge";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md"
    >
      <ProductImage product={product} />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-sm font-semibold leading-tight">{product.name}</h3>
        <p className="font-semibold text-brand-600">{formatMoney(product.price)}</p>
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          <StockBadge stock={product.stock} />
          <CompatBadge product={product} />
        </div>
      </div>
    </Link>
  );
}
