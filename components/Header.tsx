"use client";

import Link from "next/link";
import { PackageSearch, ShoppingBag, Store } from "lucide-react";
import Logo from "./Logo";
import { useCatalog } from "./CatalogProvider";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { products } = useCatalog();
  // Count only items that still exist in the shop (old or removed products don't inflate the badge).
  const count = useCart()
    .filter((l) => products.some((p) => p.id === l.productId))
    .reduce((n, l) => n + l.quantity, 0);
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Trio Store home" className="rounded-xl focus-visible:outline-2 focus-visible:outline-brand-600">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link
            href="/products"
            aria-label="Shop all products"
            className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-slate-700 transition hover:bg-slate-100 hover:text-brand-700"
          >
            <Store className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Shop</span>
          </Link>
          <Link
            href="/track"
            aria-label="Track your order"
            className="hidden h-10 items-center gap-2 rounded-xl px-3 text-slate-700 transition hover:bg-slate-100 hover:text-brand-700 md:inline-flex"
          >
            <PackageSearch className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            Track order
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-3 text-white shadow-sm shadow-brand-900/20 transition hover:bg-brand-700 sm:px-4"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-brand-700 ring-2 ring-brand-600">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
