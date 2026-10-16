"use client";

import { useState } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cart";

export default function AddToCartButton({ productId, stock }: { productId: string; stock: number }) {
  const [added, setAdded] = useState(false);
  if (stock <= 0) {
    return (
      <button disabled className="w-full rounded-lg bg-slate-200 py-3 font-semibold text-slate-500">
        Out of stock
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <button
        onClick={() => {
          addToCart(productId, 1, stock);
          setAdded(true);
        }}
        className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800"
      >
        Add to cart
      </button>
      {added && (
        <p className="text-center text-sm text-green-700">
          Added. <Link href="/cart" className="underline">View cart</Link>
        </p>
      )}
    </div>
  );
}
