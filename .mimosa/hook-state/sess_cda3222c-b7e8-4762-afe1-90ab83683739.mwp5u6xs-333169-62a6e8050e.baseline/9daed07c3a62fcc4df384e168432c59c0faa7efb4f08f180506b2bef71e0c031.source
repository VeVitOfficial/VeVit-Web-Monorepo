// Pure checks that tie a Stripe PaymentIntent event to a Store order. No imports.

export type IntentMismatchCode =
  | "metadata_mismatch"
  | "amount_mismatch"
  | "currency_mismatch"
  | "intent_mismatch"
  | "livemode_mismatch";

export function intentMismatch(
  order: { total_minor: number; currency: string; stripe_payment_intent: string | null; public_id: string },
  intent: { id: string; amount_received: number; currency: string; metadata: Record<string, string> | null; livemode: boolean },
  expectedLiveMode: boolean,
): IntentMismatchCode | null {
  if (intent.livemode !== expectedLiveMode) return "livemode_mismatch";
  if (intent.metadata?.order_public_id !== order.public_id) return "metadata_mismatch";
  if (order.stripe_payment_intent !== null && order.stripe_payment_intent !== intent.id) return "intent_mismatch";
  if (!Number.isInteger(intent.amount_received) || intent.amount_received !== order.total_minor) return "amount_mismatch";
  if (typeof intent.currency !== "string" || intent.currency.toLowerCase() !== order.currency.toLowerCase()) return "currency_mismatch";
  return null;
}

export type RecordedPaymentMethod = "card" | "apple_pay" | "google_pay" | "paypal";

export function paymentMethodFromCharge(
  details: { type?: string; card?: { wallet?: { type?: string } | null } | null } | null | undefined,
): RecordedPaymentMethod | null {
  if (!details) return null;
  if (details.type === "paypal") return "paypal";
  if (details.type !== "card") return null;
  const wallet = details.card?.wallet?.type;
  return wallet === "apple_pay" || wallet === "google_pay" ? wallet : "card";
}
