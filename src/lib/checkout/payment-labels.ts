import type { CheckoutPaymentMethod } from "./checkout-input.ts";

export const PAYMENT_LABELS: Record<CheckoutPaymentMethod, string> = {
  card: "Platební karta",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  paypal: "PayPal",
};
