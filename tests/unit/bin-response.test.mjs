import test from "node:test";
import assert from "node:assert/strict";
import { mapBinResponse, matchKnownBank } from "../../src/lib/payments/bin-response.ts";

test("maps a binlist response", () => {
  const info = mapBinResponse({
    number: {},
    scheme: "mastercard",
    type: "credit",
    brand: "Standard",
    country: { numeric: "703", alpha2: "SK", name: "Slovakia" },
    bank: { name: "UniCredit Bank Czech Republic And Slovakia, A.S." },
  });
  assert.deepEqual(info, {
    bankName: "UniCredit Bank Czech Republic And Slovakia, A.S.",
    scheme: "mastercard",
    funding: "credit",
    country: "SK",
  });
});

test("invalid input gives all-null fields", () => {
  const empty = { bankName: null, scheme: null, funding: null, country: null };
  assert.deepEqual(mapBinResponse(null), empty);
  assert.deepEqual(mapBinResponse("x"), empty);
  assert.deepEqual(mapBinResponse([]), empty);
  assert.deepEqual(mapBinResponse({ scheme: 5, type: {}, country: "CZ", bank: [] }), empty);
});

test("overlong or odd values are not passed through", () => {
  const info = mapBinResponse({ bank: { name: "x".repeat(500) }, country: { alpha2: "czech" } });
  assert.equal(info.bankName, null);
  assert.equal(info.country, null);
});

test("known banks are matched by name", () => {
  assert.equal(matchKnownBank("Unicredit Bank Czech Republic And Slovakia, A.S."), "uc");
  assert.equal(matchKnownBank("Ceska Sporitelna"), "cs");
  assert.equal(matchKnownBank("Česká spořitelna, a.s."), "cs");
  assert.equal(matchKnownBank("Ceskoslovenska Obchodni Banka"), "csob");
  assert.equal(matchKnownBank("Komercni Banka"), "kb");
  assert.equal(matchKnownBank("Raiffeisenbank"), "rb");
  assert.equal(matchKnownBank("Moneta Money Bank"), "moneta");
  assert.equal(matchKnownBank("GE Money Bank"), "moneta");
  assert.equal(matchKnownBank("Air Bank"), "airbank");
});

test("unknown or foreign banks are not matched", () => {
  assert.equal(matchKnownBank("Some Bank"), null);
  assert.equal(matchKnownBank(null), null);
  assert.equal(matchKnownBank("Raiffeisen Bank International AG"), null);
});
