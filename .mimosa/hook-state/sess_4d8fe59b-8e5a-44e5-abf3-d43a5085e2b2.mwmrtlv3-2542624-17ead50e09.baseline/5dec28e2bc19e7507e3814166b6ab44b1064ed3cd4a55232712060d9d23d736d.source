// Stripe idempotency keys for PaymentIntent creation: one stable key per order and attempt.

export function paymentIntentIdempotencyKey(orderPublicId: string, attempt: number): string {
  if (!/^[a-f0-9]{32}$/.test(orderPublicId) || !Number.isInteger(attempt) || attempt < 0) {
    throw new Error("Invalid payment intent key input.");
  }
  return `vevit-store:pi:v1:${orderPublicId}:${attempt}`;
}
