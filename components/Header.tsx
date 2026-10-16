"use client";

import Link from "next/link";
import { STORE } from "@/lib/config";
import { useCart } from "@/lib/cart";

export default function Header() {
  const count = useCart().reduce((n, l) => n + l.quantity, 0);
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-blue-700">
          {STORE.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/products" className="hover:text-blue-700">Shop</Link>
          <Link href="/cart" className="relative rounded-full bg-blue-700 px-4 py-1.5 text-white">
            Cart
            {count > 0 && (
              <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-blue-700">{count}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
