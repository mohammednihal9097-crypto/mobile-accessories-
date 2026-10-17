"use client";

import Link from "next/link";
import Logo from "./Logo";
import { useCart } from "@/lib/cart";

export default function Header() {
  const count = useCart().reduce((n, l) => n + l.quantity, 0);
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Trio Store home"><Logo /></Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/products" className="text-slate-700 hover:text-brand-600">Shop</Link>
          <Link href="/cart" className="relative rounded-xl bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
            Cart
            {count > 0 && (
              <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-brand-600">{count}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
