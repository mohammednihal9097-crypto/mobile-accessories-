"use client";

import { useSyncExternalStore } from "react";
import type { CartLine } from "./types";

// Tiny browser-side cart saved in localStorage. In Stage 4 the server re-checks
// prices and stock at order time, so nothing here is trusted for money.
const KEY = "cart-v1";
const EMPTY: CartLine[] = [];
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as CartLine[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {}
  listeners.forEach((l) => l());
}

export function addToCart(productId: string, quantity = 1, max = 99) {
  const lines = read();
  const found = lines.find((l) => l.productId === productId);
  write(
    found
      ? lines.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(max, l.quantity + quantity) } : l))
      : [...lines, { productId, quantity: Math.min(max, quantity) }],
  );
}

export function setQuantity(productId: string, quantity: number) {
  write(
    quantity <= 0
      ? read().filter((l) => l.productId !== productId)
      : read().map((l) => (l.productId === productId ? { ...l, quantity } : l)),
  );
}

export function clearCart() {
  write(EMPTY);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Returns the cart lines; empty during server render. */
export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
