"use client";

import { useSyncExternalStore } from "react";

// Remembers the signed WhatsApp link (number + expiry + signature) in this browser, so checkout can
// pre-fill the number. The server re-verifies the signature when the order is placed.
export type WaLink = { wa: string; exp: string; sig: string };
const KEY = "wa-link-v1";
let cache: WaLink | null | undefined;
const listeners = new Set<() => void>();

function read(): WaLink | null {
  if (cache !== undefined) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as WaLink) : null;
    cache = v && Number(v.exp) > Date.now() / 1000 ? v : null;
  } catch {
    cache = null;
  }
  return cache;
}

export function saveWaLink(link: WaLink) {
  cache = link;
  try {
    localStorage.setItem(KEY, JSON.stringify(link));
  } catch {}
  listeners.forEach((l) => l());
}

export function useWaLink(): WaLink | null {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    read,
    () => null,
  );
}
