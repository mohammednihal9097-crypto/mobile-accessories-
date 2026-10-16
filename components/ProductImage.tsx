"use client";

import type { Product } from "@/lib/types";
import { useCatalog } from "./CatalogProvider";

/** Shows the first real photo, or a coloured placeholder tile when none exists. */
export default function ProductImage({ product, large = false }: { product: Product; large?: boolean }) {
  const { categories } = useCatalog();
  const photo = product.photos[0];
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo.url} alt={photo.alt} className="aspect-square w-full object-cover" />;
  }
  return (
    <div
      className={`flex aspect-square items-center justify-center ${large ? "text-8xl" : "text-5xl"}`}
      style={{ backgroundColor: product.imageTint }}
      role="img"
      aria-label="Photo coming soon"
    >
      {categories.find((c) => c.slug === product.categorySlug)?.icon ?? "📦"}
    </div>
  );
}
