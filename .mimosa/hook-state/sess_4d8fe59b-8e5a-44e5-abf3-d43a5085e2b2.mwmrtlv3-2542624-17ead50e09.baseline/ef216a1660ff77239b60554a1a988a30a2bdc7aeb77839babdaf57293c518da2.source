"use client";

import { useEffect } from "react";
import { saveCart } from "@/lib/cart";
import { useCheckoutDraft } from "./use-checkout-draft";

/** Rendered on the order page once the order exists: the cart and the checkout draft have done their job. */
export function ClearCheckout() {
  const [, , clear] = useCheckoutDraft();
  useEffect(() => {
    clear();
    try {
      saveCart([]);
    } catch {
      // Storage blocked: nothing to clear.
    }
  }, [clear]);
  return null;
}
