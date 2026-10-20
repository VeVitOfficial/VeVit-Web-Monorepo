// Single source of truth for shipping prices. Server (snapshot) and client (cart, summary) both use it.

export type DeliveryMethod = "packeta_pickup" | "address";

export const SHIPPING_PRICES_MINOR: Readonly<Record<DeliveryMethod, number>> = {
  packeta_pickup: 6900,
  address: 9900,
};

export const FREE_SHIPPING_THRESHOLD_MINOR = 100000;

export function shippingMinor(input: {
  method: DeliveryMethod | null;
  hasPhysical: boolean;
  subtotalMinor: number;
  freePerk: boolean;
}): number {
  if (!input.hasPhysical) return 0;
  if (input.method === null) throw new Error("delivery_method_required");
  if (input.freePerk || input.subtotalMinor >= FREE_SHIPPING_THRESHOLD_MINOR) return 0;
  return SHIPPING_PRICES_MINOR[input.method];
}

export function missingForFreeShippingMinor(subtotalMinor: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD_MINOR - subtotalMinor);
}
