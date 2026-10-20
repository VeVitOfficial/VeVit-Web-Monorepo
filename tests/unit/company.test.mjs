import test from "node:test";
import assert from "node:assert/strict";
import { icoValid, mapAresSubject } from "../../src/lib/checkout/company.ts";

const ALZA = {
  ico: "27082440",
  obchodniJmeno: "Alza.cz a.s.",
  dic: "CZ27082440",
  sidlo: {
    kodStatu: "CZ",
    nazevObce: "Praha",
    nazevMestskehoObvodu: "Praha 7",
    nazevCastiObce: "Holešovice",
    nazevUlice: "Jankovcova",
    cisloDomovni: 1522,
    cisloOrientacni: 53,
    psc: 17000,
  },
};

test("ICO check digit", () => {
  assert.equal(icoValid("27082440"), true);
  assert.equal(icoValid("12345678"), false);
  assert.equal(icoValid("1234567"), false);
  assert.equal(icoValid("2708244A"), false);
  assert.equal(icoValid("270824400"), false);
});

test("ICO check digit branches", () => {
  // weighted sum % 11 === 0 -> check digit 1
  assert.equal(icoValid("25596641"), true);
  // 1000000: weighted sum 8, 8 % 11 = 8 -> check digit 11 - 8 = 3
  assert.equal(icoValid("10000003"), true);
  assert.equal(icoValid("10000004"), false);
});

test("maps an ARES subject", () => {
  assert.deepEqual(mapAresSubject(ALZA), {
    ico: "27082440",
    name: "Alza.cz a.s.",
    dic: "CZ27082440",
    address: { street: "Jankovcova 1522/53", city: "Praha 7", zip: "17000", country: "CZ" },
  });
});

test("company without DIC, without street and without orientation number", () => {
  const info = mapAresSubject({
    ico: "27082440",
    obchodniJmeno: "Malá obec s.r.o.",
    sidlo: { nazevObce: "Bukovany", nazevCastiObce: "Bukovany", cisloDomovni: 12, psc: 25101 },
  });
  assert.equal(info.dic, null);
  assert.equal(info.address.street, "Bukovany 12");
  assert.equal(info.address.city, "Bukovany");
});

test("nonsense input gives null", () => {
  assert.equal(mapAresSubject(null), null);
  assert.equal(mapAresSubject({}), null);
  assert.equal(mapAresSubject({ ico: "27082440" }), null);
  assert.equal(mapAresSubject({ ico: "27082440", obchodniJmeno: "X", sidlo: {} }), null);
});
