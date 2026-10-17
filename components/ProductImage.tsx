"use client";

import { ImageOff } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
import type { Product } from "@/lib/types";
import { useCatalog } from "./CatalogProvider";

/** Shows the first real photo, or a calm branded placeholder with the category's line icon. */
export default function ProductImage({ product, large = false }: { product: Product; large?: boolean }) {
  const { categories } = useCatalog();
  const photo = product.photos[0];
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo.url} alt={photo.alt} className="aspect-square w-full bg-white object-cover" />;
  }
  const category = categories.find((c) => c.slug === product.categorySlug);
  const iconClass = large ? "h-12 w-12" : "h-7 w-7";
  return (
    <div
      className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100"
      role="img"
      aria-label="Photo coming soon"
    >
      <span className={`flex items-center justify-center rounded-2xl bg-white text-brand-500 shadow-sm ring-1 ring-brand-100 ${large ? "h-28 w-28" : "h-16 w-16"}`}>
        {category
          ? <CategoryIcon category={category} className={iconClass} strokeWidth={1.5} />
          : <ImageOff className={iconClass} strokeWidth={1.5} aria-hidden="true" />}
      </span>
    </div>
  );
}
