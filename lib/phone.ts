"use client";

import { useSyncExternalStore } from "react";

// Remembers the customer's chosen phone in this browser only (localStorage).
const KEY = "my-phone-v1";
let cache: string | null | undefined;
const listeners = new Set<() => void>();

function read(): string | null {
  if (cache !== undefined) return cache;
  try {
    cache = localStorage.getItem(KEY);
  } catch {
    cache = null;
  }
  return cache;
}

export function setMyPhone(id: string | null) {
  cache = id;
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useMyPhone(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
