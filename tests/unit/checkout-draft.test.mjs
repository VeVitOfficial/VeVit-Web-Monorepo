import test from "node:test";
import assert from "node:assert/strict";
import { DRAFT_KEY, emptyDraft, parseDraft } from "../../src/lib/checkout/checkout-draft.ts";

const POINT = { id: "12345", name: "Albert", street: "Čechova 11", city: "Praha 7", zip: "17000", country: "CZ", kind: "pickup" };

test("storage key is versioned", () => {
  assert.equal(DRAFT_KEY, "vevit_checkout_draft_v1");
});

test("missing or broken storage gives the empty draft", () => {
  assert.deepEqual(parseDraft(null), emptyDraft());
  assert.deepEqual(parseDraft("not json"), emptyDraft());
  assert.deepEqual(parseDraft("[1]"), emptyDraft());
});

test("a stored draft round-trips", () => {
  const draft = {
    ...emptyDraft(),
    delivery: { method: "packeta_pickup", point: POINT },
    paymentMethod: "paypal",
    contact: { name: "Jan Novák", email: "jan@novak.cz", phone: "+420777123456" },
    consents: { terms: true, digital_waiver: false },
    notes: "Zvonit",
  };
  assert.deepEqual(parseDraft(JSON.stringify(draft)), draft);
});

test("invalid parts fall back without dropping valid ones", () => {
  const parsed = parseDraft(JSON.stringify({
    delivery: { method: "drone" },
    paymentMethod: "bitcoin",
    contact: { name: "Jan", email: 5, phone: "+420777123456" },
    notes: "ok",
  }));
  assert.equal(parsed.delivery, null);
  assert.equal(parsed.paymentMethod, null);
  assert.deepEqual(parsed.contact, { name: "Jan", email: "", phone: "+420777123456" });
  assert.equal(parsed.notes, "ok");
});

test("a pickup delivery without a usable point is dropped", () => {
  assert.equal(parseDraft(JSON.stringify({ delivery: { method: "packeta_pickup", point: { id: "x" } } })).delivery, null);
  assert.deepEqual(parseDraft(JSON.stringify({ delivery: { method: "address" } })).delivery, { method: "address" });
});
