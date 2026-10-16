"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";

export default function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const photos = product.photos;

  if (photos.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl">
        <ProductImage product={product} large />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[index].url} alt={photos[index].alt} className="aspect-square w-full object-cover" />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2">
          {photos.map((p, i) => (
            <button
              key={p.url}
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === index ? "border-blue-700" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
