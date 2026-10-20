import test from "node:test";
import assert from "node:assert/strict";
import {
  CheckoutValidationException,
  finalizeCheckoutDetails,
  normalizeCheckoutInput,
  requestHashInput,
  requireConsents,
} from "../../src/lib/checkout/checkout-input.ts";

const base = () => ({
  items: [{ product_id: 1, quantity: 2 }],
  email: "jan@example.cz",
  name: "Jan Novák",
  idempotency_key: "k".repeat(24),
  consents: { terms: true, digital_waiver: true },
});
const point = (extra = {}) => ({
  id: "12345",
  name: "Zásilkovna Brno",
  street: "Masarykova 1",
  city: "Brno",
  zip: "60200",
  country: "CZ",
  kind: "pickup",
  ...extra,
});
const failsWith = (fn, code) => assert.throws(fn, (e) => e instanceof CheckoutValidationException && e.errorCode === code, code);

test("slovak customer: phone, zip and pickup point", () => {
  const n = normalizeCheckoutInput({
    ...base(),
    phone: "+421 905 123 456",
    delivery: { method: "packeta_pickup", point: point({ country: "sk", zip: "811 01" }) },
  });
  assert.equal(n.phone, "+421905123456");
  assert.equal(n.delivery.method, "packeta_pickup");
  assert.equal(n.delivery.point.country, "SK");
  assert.equal(n.delivery.point.zip, "81101");
});

test("czech phone with 00 prefix is normalized", () => {
  assert.equal(normalizeCheckoutInput({ ...base(), phone: "00420 602-123-456" }).phone, "+420602123456");
});

test("bad phone numbers are rejected", () => {
  failsWith(() => normalizeCheckoutInput({ ...base(), phone: "123" }), "invalid_phone");
  failsWith(() => normalizeCheckoutInput({ ...base(), phone: "+48123456789" }), "invalid_phone");
});

test("pickup point outside CZ/SK is rejected", () => {
  failsWith(() => normalizeCheckoutInput({ ...base(), delivery: { method: "packeta_pickup", point: point({ country: "PL" }) } }), "invalid_delivery");
  failsWith(() => normalizeCheckoutInput({ ...base(), delivery: { method: "packeta_pickup", point: point({ id: "abc" }) } }), "invalid_delivery");
  failsWith(() => normalizeCheckoutInput({ ...base(), delivery: { method: "packeta_pickup" } }), "invalid_delivery");
  failsWith(() => normalizeCheckoutInput({ ...base(), delivery: { method: "drone" } }), "invalid_delivery");
});

test("company with a wrong ICO is rejected", () => {
  const company = { ico: "12345678", name: "Firma s.r.o.", dic: null, address: { street: "Ulice 1", city: "Praha", zip: "11000", country: "CZ" } };
  failsWith(() => normalizeCheckoutInput({ ...base(), billing: { company, address: null } }), "invalid_company");
});

test("valid company and a separate billing address are kept", () => {
  const company = { ico: "27082440", name: "Alza.cz a.s.", dic: "CZ27082440", address: { street: "Jankovcova 1522/53", city: "Praha 7", zip: "170 00", country: "CZ" } };
  const n = normalizeCheckoutInput({ ...base(), billing: { company, address: { street: "Fakturační 5", city: "Brno", zip: "60200", country: "CZ" } } });
  assert.equal(n.billing.company.ico, "27082440");
  assert.equal(n.billing.company.address.zip, "17000");
  assert.equal(n.billing.address.city, "Brno");
});

test("request hash input changes with the delivery method", () => {
  const pickup = normalizeCheckoutInput({ ...base(), delivery: { method: "packeta_pickup", point: point() } });
  const address = normalizeCheckoutInput({ ...base(), delivery: { method: "address" } });
  assert.notDeepEqual(requestHashInput(pickup), requestHashInput(address));
  assert.equal("idempotencyKey" in requestHashInput(pickup), false);
});

test("request hash input is stable for identical input", () => {
  const a = normalizeCheckoutInput({ ...base(), delivery: { method: "address" } });
  const b = normalizeCheckoutInput({ ...base(), delivery: { method: "address" } });
  assert.deepEqual(requestHashInput(a), requestHashInput(b));
});

test("unknown top-level fields are rejected", () => {
  failsWith(() => normalizeCheckoutInput({ ...base(), total: 1 }), "unexpected_field");
});

test("physical cart needs a phone and a delivery method", () => {
  const n = normalizeCheckoutInput({ ...base(), delivery: { method: "packeta_pickup", point: point() } });
  failsWith(() => finalizeCheckoutDetails(n, { hasPhysical: true, hasDigital: false }), "invalid_phone");
  const withPhone = normalizeCheckoutInput({ ...base(), phone: "+420602123456" });
  failsWith(() => finalizeCheckoutDetails(withPhone, { hasPhysical: true, hasDigital: false }), "delivery_required");
});

test("address delivery needs an address, pickup does not", () => {
  const address = normalizeCheckoutInput({ ...base(), phone: "+420602123456", delivery: { method: "address" } });
  failsWith(() => finalizeCheckoutDetails(address, { hasPhysical: true, hasDigital: false }), "shipping_required");
  const pickup = normalizeCheckoutInput({ ...base(), phone: "+420602123456", delivery: { method: "packeta_pickup", point: point() } });
  const done = finalizeCheckoutDetails(pickup, { hasPhysical: true, hasDigital: false });
  assert.equal(done.shipping, null);
  assert.equal(done.delivery.method, "packeta_pickup");
});

test("digital-only cart skips delivery and phone", () => {
  const n = normalizeCheckoutInput({ ...base(), delivery: { method: "address" }, shipping: { street: "Ulice 1", city: "Praha", zip: "110 00", country: "CZ" } });
  const done = finalizeCheckoutDetails(n, { hasPhysical: false, hasDigital: true });
  assert.equal(done.delivery, null);
  assert.equal(done.shipping, null);
  assert.equal(done.phone, null);
});

test("consents", () => {
  failsWith(() => requireConsents(true, { terms: true, digital_waiver: false }), "digital_waiver_required");
  failsWith(() => requireConsents(false, { terms: false, digital_waiver: false }), "terms_required");
  assert.doesNotThrow(() => requireConsents(false, { terms: true, digital_waiver: false }));
  assert.doesNotThrow(() => requireConsents(true, { terms: true, digital_waiver: true }));
});

test("consent messages are the agreed czech texts", () => {
  assert.throws(() => requireConsents(false, { terms: false, digital_waiver: false }), { message: "Potvrď souhlas s obchodními podmínkami." });
  assert.throws(() => requireConsents(true, { terms: true, digital_waiver: false }), {
    message: "Potvrď souhlas se zpřístupněním digitálního obsahu před uplynutím lhůty pro odstoupení.",
  });
});
