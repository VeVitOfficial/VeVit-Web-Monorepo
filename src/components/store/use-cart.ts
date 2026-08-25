"use client";

import { useMemo, useSyncExternalStore } from "react";
import { cartKey, type CartItem } from "@/lib/cart";

function subscribe(callback: () => void) {
  window.addEventListener("cartchange", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("cartchange", callback);
    window.removeEventListener("storage", callback);
  };
}

function snapshot() {
  return localStorage.getItem(cartKey) ?? "[]";
}

export function useCart() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  return useMemo(() => {
    try {
      const value: unknown = JSON.parse(raw);
      return Array.isArray(value) ? value as CartItem[] : [];
    } catch {
      return [];
    }
  }, [raw]);
}
