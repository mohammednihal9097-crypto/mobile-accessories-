"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, ShoppingBag } from "lucide-react";
import { addToCart } from "@/lib/cart";

export default function AddToCartButton({ productId, stock }: { productId: string; stock: number }) {
  const [added, setAdded] = useState(false);
  if (stock <= 0) {
    return (
      <button disabled className="w-full rounded-xl bg-slate-200 py-3.5 font-semibold text-slate-500">
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
        className="btn-press inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white shadow-sm shadow-brand-900/20 transition hover:bg-brand-700 hover:shadow-md"
      >
        <ShoppingBag className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        Add to cart
      </button>
      {added && (
        <p role="status" className="animate-fade-in-up flex items-center justify-center gap-1.5 text-sm text-green-700">
          <CircleCheck className="h-4 w-4" aria-hidden="true" />
          Added to your cart. <Link href="/cart" className="font-semibold underline">View cart</Link>
        </p>
      )}
    </div>
  );
}
