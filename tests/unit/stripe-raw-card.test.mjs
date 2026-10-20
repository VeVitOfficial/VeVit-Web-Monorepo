import test from "node:test";
import assert from "node:assert/strict";
import { buildPaymentMethodBody, createCardPaymentMethod } from "../../src/lib/payments/stripe-raw-card.ts";

const card = { number: "4242424242424242", expMonth: 9, expYear: 28, cvc: "123", name: "Jan Novák" };

test("body has the fields Stripe expects, with a four-digit year", () => {
  const body = buildPaymentMethodBody(card);
  assert.equal(body.get("type"), "card");
  assert.equal(body.get("card[number]"), "4242424242424242");
  assert.equal(body.get("card[exp_month]"), "9");
  assert.equal(body.get("card[exp_year]"), "2028");
  assert.equal(body.get("card[cvc]"), "123");
  assert.equal(body.get("billing_details[name]"), "Jan Novák");
});

test("a four-digit year is kept as is", () => {
  assert.equal(buildPaymentMethodBody({ ...card, expYear: 2031 }).get("card[exp_year]"), "2031");
});

test("request goes straight to the Stripe API with the publishable key only", async () => {
  let seen;
  const fetchImpl = async (url, init) => {
    seen = { url, init };
    return new Response(JSON.stringify({ id: "pm_123" }), { status: 200 });
  };
  const result = await createCardPaymentMethod("pk_test_abc", card, fetchImpl);
  assert.deepEqual(result, { id: "pm_123" });
  assert.equal(seen.url, "https://api.stripe.com/v1/payment_methods");
  assert.equal(seen.init.method, "POST");
  assert.equal(seen.init.headers.Authorization, "Bearer pk_test_abc");
  assert.equal(seen.init.headers["Content-Type"], "application/x-www-form-urlencoded");
  assert.equal(seen.init.credentials, "omit");
});

test("Stripe errors become Czech messages without echoing provider text", async () => {
  const failing = (code) => async () =>
    new Response(JSON.stringify({ error: { code, message: "Your card number 4242 is bad" } }), { status: 402 });
  const number = await createCardPaymentMethod("pk_test_abc", card, failing("incorrect_number"));
  assert.equal(number.error, "Číslo karty není platné. Zkontroluj překlep.");
  const expiry = await createCardPaymentMethod("pk_test_abc", card, failing("invalid_expiry_year"));
  assert.equal(expiry.error, "Platnost karty není platná.");
  const cvc = await createCardPaymentMethod("pk_test_abc", card, failing("incorrect_cvc"));
  assert.equal(cvc.error, "CVC nesouhlasí.");
  const other = await createCardPaymentMethod("pk_test_abc", card, failing("whatever"));
  assert.match(other.error, /^Kartu se nepodařilo ověřit/);
  assert.equal(other.error.includes("4242"), false);
});

test("raw card data being disabled is reported with its own code", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ error: { type: "invalid_request_error", message: "Sending credit card numbers directly to the Stripe API is generally unsafe." } }), { status: 402 });
  const result = await createCardPaymentMethod("pk_test_abc", card, fetchImpl);
  assert.equal(result.code, "raw_card_data_disabled");
  assert.match(result.error, /Platbu kartou se nepodařilo zahájit/);
});

test("network failure returns an error instead of throwing", async () => {
  const fetchImpl = async () => { throw new TypeError("network down"); };
  const result = await createCardPaymentMethod("pk_test_abc", card, fetchImpl);
  assert.match(result.error, /Spojení se nepodařilo/);
});
