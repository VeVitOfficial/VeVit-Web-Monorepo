import test from "node:test";
import assert from "node:assert/strict";
import { paymentIntentIdempotencyKey } from "../../src/lib/payments/intent-keys.ts";

test("key is derived from order and attempt", () => {
  const order = "ab".repeat(16);
  assert.equal(paymentIntentIdempotencyKey(order, 2), `vevit-store:pi:v1:${order}:2`);
});

test("different attempts give different keys, same attempt is stable", () => {
  const order = "cd".repeat(16);
  assert.notEqual(paymentIntentIdempotencyKey(order, 0), paymentIntentIdempotencyKey(order, 1));
  assert.equal(paymentIntentIdempotencyKey(order, 1), paymentIntentIdempotencyKey(order, 1));
});

test("rejects malformed input", () => {
  assert.throws(() => paymentIntentIdempotencyKey("not-an-order", 0));
  assert.throws(() => paymentIntentIdempotencyKey("ab".repeat(16), -1));
  assert.throws(() => paymentIntentIdempotencyKey("ab".repeat(16), 1.5));
});
