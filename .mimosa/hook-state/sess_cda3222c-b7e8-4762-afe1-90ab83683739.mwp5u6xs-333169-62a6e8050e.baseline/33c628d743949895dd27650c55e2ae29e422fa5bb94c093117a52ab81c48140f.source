import type { CheckoutPaymentMethod } from "./checkout-input.ts";

export const PAYMENT_LABELS: Record<CheckoutPaymentMethod, string> = {
  card: "Platební karta",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  paypal: "PayPal",
};

/** Method name payment-intent.php understands for a method chosen in step 2 (both wallets are one Express Checkout). */
export function intentMethodFor(method: CheckoutPaymentMethod | null): "card" | "wallet" | "paypal" {
  if (method === "apple_pay" || method === "google_pay") return "wallet";
  return method === "paypal" ? "paypal" : "card";
}
