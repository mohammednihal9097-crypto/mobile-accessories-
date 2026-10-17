"use client";

import Link from "next/link";
import { formatMoney, shippingFor } from "@/lib/config";
import { setQuantity, useCart } from "@/lib/cart";
import { useCatalog } from "./CatalogProvider";

export function useCartDetails() {
  const { products } = useCatalog();
  const lines = useCart();
  const items = lines.flatMap((l) => {
    const product = products.find((p) => p.id === l.productId);
    return product ? [{ product, quantity: Math.min(l.quantity, Math.max(product.stock, 0)) }] : [];
  });
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = shippingFor(subtotal);
  return { items, subtotal, shipping, total: subtotal + shipping };
}

export function OrderSummary() {
  const { items, subtotal, shipping, total } = useCartDetails();
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      {items.map((i) => (
        <div key={i.product.id} className="flex justify-between gap-3">
          <span className="min-w-0 break-words">{i.product.name} × {i.quantity}</span>
          <span className="shrink-0">{formatMoney(i.product.price * i.quantity)}</span>
        </div>
      ))}
      <hr />
      <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
      <div className="flex justify-between">
        <span>Delivery</span>
        <span>{shipping === 0 ? "Free" : formatMoney(shipping)}</span>
      </div>
      <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatMoney(total)}</span></div>
    </div>
  );
}

export default function CartView() {
  const { items } = useCartDetails();

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-slate-600">Your cart is empty.</p>
        <Link href="/products" className="mt-3 inline-block font-semibold text-brand-600 underline">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <ul className="space-y-3">
        {items.map(({ product, quantity }) => (
          <li key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="min-w-0">
              <Link href={`/products/${product.slug}`} className="block break-words font-semibold hover:underline">{product.name}</Link>
              <p className="text-sm text-slate-600">{formatMoney(product.price)} each</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button aria-label="Decrease quantity" onClick={() => setQuantity(product.id, quantity - 1)} className="h-10 w-10 rounded-full border border-slate-300 text-lg hover:bg-slate-50">−</button>
              <span className="w-6 text-center">{quantity}</span>
              <button
                aria-label="Increase quantity"
                disabled={quantity >= product.stock}
                onClick={() => setQuantity(product.id, quantity + 1)}
                className="h-10 w-10 rounded-full border border-slate-300 text-lg hover:bg-slate-50 disabled:opacity-40"
              >+</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="space-y-4 lg:sticky lg:top-24">
        <OrderSummary />
        <Link href="/checkout" className="block rounded-xl bg-brand-600 py-3 text-center font-semibold text-white hover:bg-brand-700">
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
