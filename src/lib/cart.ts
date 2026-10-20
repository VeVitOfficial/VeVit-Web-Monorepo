import { shippingMinor } from "@/lib/checkout/shipping";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  original_price: number;
  type: "physical" | "digital";
  slug: string;
  qty: number;
};

export const cartKey = "vevit_cart";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(cartKey) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is CartItem => Boolean(item && typeof item === "object" && "id" in item && "qty" in item)) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(cartKey, JSON.stringify(items));
  window.dispatchEvent(new Event("cartchange"));
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/** Standard shipping before tier perks (same rule as the checkout snapshot). */
export function cartBaseShipping(items: CartItem[]) {
  const hasPhysical = items.some((item) => item.type === "physical");
  // The delivery method is chosen later in checkout; the cart shows the standard (address) price.
  return shippingMinor({ method: hasPhysical ? "address" : null, hasPhysical, subtotalMinor: Math.round(cartSubtotal(items) * 100), freePerk: false }) / 100;
}

/** Shipping shown to the customer; Silver+ ships free (store-perks.ts). */
export function cartShipping(items: CartItem[], freeShipping = false) {
  return freeShipping ? 0 : cartBaseShipping(items);
}
