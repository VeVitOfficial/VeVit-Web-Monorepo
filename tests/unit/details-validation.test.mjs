import test from "node:test";
import assert from "node:assert/strict";
import { emptyDraft } from "../../src/lib/checkout/checkout-draft.ts";
import { splitPhone, validateDetails, joinPhone, formatNationalNumber } from "../../src/lib/checkout/details-validation.ts";

const PHYSICAL = { hasPhysical: true, hasDigital: false };
const DIGITAL = { hasPhysical: false, hasDigital: true };
const POINT = { id: "1", name: "Albert", street: "Čechova 11", city: "Praha 7", zip: "17000", country: "CZ", kind: "pickup" };

function filled(extra = {}) {
  return {
    ...emptyDraft(),
    contact: { name: "Jan Novák", email: "jan@novak.cz", phone: "+420777123456" },
    delivery: { method: "packeta_pickup", point: POINT },
    consents: { terms: true, digital_waiver: false },
    ...extra,
  };
}

test("complete pickup order has no errors", () => {
  assert.deepEqual(validateDetails(filled(), PHYSICAL, { company: false, billing: false }), {});
});

test("contact fields", () => {
  const errors = validateDetails(filled({ contact: { name: " ", email: "x", phone: "" } }), PHYSICAL, { company: false, billing: false });
  assert.equal(errors.name, "Vyplň jméno a příjmení.");
  assert.equal(errors.email, "Zadej platný e-mail.");
  assert.equal(errors.phone, "Zadej platné telefonní číslo.");
});

test("phone is optional for digital goods but must be valid when given", () => {
  const base = filled({ contact: { name: "Jan", email: "jan@novak.cz", phone: "" }, delivery: null });
  assert.deepEqual(validateDetails(base, DIGITAL, { company: false, billing: false }), { digital_waiver: "Potvrď souhlas se zpřístupněním digitálního obsahu před uplynutím lhůty pro odstoupení." });
  const withBad = { ...base, contact: { ...base.contact, phone: "+420123" }, consents: { terms: true, digital_waiver: true } };
  assert.equal(validateDetails(withBad, DIGITAL, { company: false, billing: false }).phone, "Zadej platné telefonní číslo.");
});

test("slovak customer is accepted", () => {
  const draft = filled({ contact: { name: "Ján", email: "jan@sk.sk", phone: "+421905123456" }, delivery: { method: "packeta_pickup", point: { ...POINT, country: "SK", zip: "81101" } } });
  assert.deepEqual(validateDetails(draft, PHYSICAL, { company: false, billing: false }), {});
});

test("address delivery needs a valid address", () => {
  const draft = filled({ delivery: { method: "address" }, shippingAddress: { street: "", city: "Praha", zip: "1700", country: "CZ" } });
  const errors = validateDetails(draft, PHYSICAL, { company: false, billing: false });
  assert.equal(errors.street, "Vyplň ulici a číslo.");
  assert.equal(errors.zip, "Zadej PSČ ve tvaru 123 45.");
  assert.equal(errors.city, undefined);
});

test("missing delivery on a physical cart", () => {
  assert.equal(validateDetails(filled({ delivery: null }), PHYSICAL, { company: false, billing: false }).delivery, "Vyber způsob doručení.");
});

test("company toggle requires a loaded or filled company", () => {
  assert.equal(validateDetails(filled(), PHYSICAL, { company: true, billing: false }).company, "Vyplň IČO a údaje firmy.");
  const company = { ico: "27082440", name: "Alza.cz a.s.", dic: null, address: { street: "Jankovcova 1522/53", city: "Praha 7", zip: "17000", country: "CZ" } };
  assert.deepEqual(validateDetails(filled({ company }), PHYSICAL, { company: true, billing: false }), {});
});

test("different billing address is validated", () => {
  const errors = validateDetails(filled(), PHYSICAL, { company: false, billing: true });
  assert.equal(errors.billing_street, "Vyplň ulici a číslo.");
  assert.equal(errors.billing_city, "Vyplň město.");
  assert.equal(errors.billing_zip, "Zadej PSČ ve tvaru 123 45.");
});

test("terms are always required", () => {
  assert.equal(validateDetails(filled({ consents: { terms: false, digital_waiver: false } }), PHYSICAL, { company: false, billing: false }).terms, "Potvrď souhlas s obchodními podmínkami.");
});

test("phone helpers", () => {
  assert.deepEqual(splitPhone("+421905123456"), { prefix: "+421", national: "905123456" });
  assert.deepEqual(splitPhone("+420777123456"), { prefix: "+420", national: "777123456" });
  assert.deepEqual(splitPhone(""), { prefix: "+420", national: "" });
  assert.equal(joinPhone("+421", "905 123 456"), "+421905123456");
  assert.equal(joinPhone("+420", ""), "");
  assert.equal(formatNationalNumber("777123456"), "777 123 456");
});
