import test from "node:test";
import assert from "node:assert/strict";
import { intentMismatch, paymentMethodFromCharge } from "../../src/lib/payments/intent-checks.ts";

const PUBLIC = "ab".repeat(16);
const order = { total_minor: 129000, currency: "czk", stripe_payment_intent: "pi_123", public_id: PUBLIC };
const intent = () => ({
  id: "pi_123",
  amount_received: 129000,
  currency: "czk",
  metadata: { order_public_id: PUBLIC },
  livemode: false,
});

test("matching intent has no mismatch", () => {
  assert.equal(intentMismatch(order, intent(), false), null);
});

test("order without a stored intent yet accepts the intent", () => {
  assert.equal(intentMismatch({ ...order, stripe_payment_intent: null }, intent(), false), null);
});

test("different amount", () => {
  assert.equal(intentMismatch(order, { ...intent(), amount_received: 100 }, false), "amount_mismatch");
});

test("different currency", () => {
  assert.equal(intentMismatch(order, { ...intent(), currency: "eur" }, false), "currency_mismatch");
});

test("metadata pointing at another order", () => {
  const other = { ...intent(), metadata: { order_public_id: "cd".repeat(16) } };
  assert.equal(intentMismatch(order, other, false), "metadata_mismatch");
  assert.equal(intentMismatch(order, { ...intent(), metadata: null }, false), "metadata_mismatch");
});

test("order already bound to a different intent", () => {
  assert.equal(intentMismatch({ ...order, stripe_payment_intent: "pi_other" }, intent(), false), "intent_mismatch");
});

test("livemode must match the configured mode", () => {
  assert.equal(intentMismatch(order, { ...intent(), livemode: true }, false), "livemode_mismatch");
});

test("payment method from the charge", () => {
  assert.equal(paymentMethodFromCharge({ type: "card", card: { wallet: { type: "apple_pay" } } }), "apple_pay");
  assert.equal(paymentMethodFromCharge({ type: "card", card: { wallet: { type: "google_pay" } } }), "google_pay");
  assert.equal(paymentMethodFromCharge({ type: "card", card: { wallet: null } }), "card");
  assert.equal(paymentMethodFromCharge({ type: "card", card: { wallet: { type: "link" } } }), "card");
  assert.equal(paymentMethodFromCharge({ type: "paypal" }), "paypal");
  assert.equal(paymentMethodFromCharge(null), null);
  assert.equal(paymentMethodFromCharge({ type: "sepa_debit" }), null);
});
