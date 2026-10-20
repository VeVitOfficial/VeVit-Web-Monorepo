import test from "node:test";
import assert from "node:assert/strict";
import {
  brandLengths,
  cvcLength,
  detectBrand,
  digitsOnly,
  formatCardNumber,
  luhnValid,
  validateCardNumber,
  validateCvc,
  validateExpiry,
  validateHolderName,
} from "../../src/lib/payments/card-validation.ts";

test("brand detection", () => {
  assert.equal(detectBrand("4140920000000002"), "visa");
  assert.equal(detectBrand("5402980000000006"), "mastercard");
  assert.equal(detectBrand("2221000000000009"), "mastercard");
  assert.equal(detectBrand("371449635398431"), "amex");
  assert.equal(detectBrand("6759649826438453"), "maestro");
  assert.equal(detectBrand("9"), null);
});

test("brand lengths and cvc length", () => {
  assert.deepEqual(brandLengths("visa"), [13, 16, 19]);
  assert.deepEqual(brandLengths("mastercard"), [16]);
  assert.deepEqual(brandLengths("amex"), [15]);
  assert.deepEqual(brandLengths("maestro"), [12, 13, 14, 15, 16, 17, 18, 19]);
  assert.equal(cvcLength("amex"), 4);
  assert.equal(cvcLength("visa"), 3);
  assert.equal(cvcLength(null), 3);
});

test("luhn", () => {
  assert.equal(luhnValid("4140920000000002"), true);
  assert.equal(luhnValid("4111111111111112"), false);
});

test("pasted number is normalized and formatted", () => {
  assert.equal(digitsOnly("4111-1111 1111 1111"), "4111111111111111");
  assert.equal(digitsOnly("4".repeat(25)).length, 19);
  assert.equal(formatCardNumber("371449635398431", "amex"), "3714 496353 98431");
  assert.equal(formatCardNumber("4140920000000002", "visa"), "4140 9200 0000 0002");
});

test("luhn only judged at full brand length", () => {
  assert.deepEqual(validateCardNumber("411111111111111").error, null); // 15 digits visa: incomplete, no error
  assert.equal(validateCardNumber("4111111111111112").error, "Číslo karty není platné. Zkontroluj překlep.");
  assert.equal(validateCardNumber("4140920000000002").ok, true);
  assert.equal(validateCardNumber("371449635398431").ok, true);
  assert.equal(validateCardNumber("99").error, "Tento typ karty nepřijímáme.");
});

test("a single unknown digit is not yet an error", () => {
  assert.equal(validateCardNumber("9").error, null);
  assert.equal(validateCardNumber("9").complete, false);
});

test("expiry boundaries", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  assert.equal(validateExpiry("10/26", now).ok, true);
  assert.equal(validateExpiry("0926", now).error, "Karta už je prošlá.");
  assert.equal(validateExpiry("13/27", now).error, "Měsíc musí být 01–12.");
  assert.equal(validateExpiry("01/47", now).error, "Neplatný rok.");
  assert.equal(validateExpiry("1", now).complete, false);
});

test("expiry returns month and four-digit year", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  const r = validateExpiry("09/28", now);
  assert.equal(r.month, 9);
  assert.equal(r.year, 2028);
});

test("cvc length by brand", () => {
  assert.equal(validateCvc("123", "visa").ok, true);
  assert.equal(validateCvc("123", "amex").ok, false);
  assert.equal(validateCvc("1234", "amex").ok, true);
  assert.equal(validateCvc("12", "visa").error, "CVC je neúplné.");
});

test("holder name needs at least three characters", () => {
  assert.equal(validateHolderName("Jan Novák").ok, true);
  assert.equal(validateHolderName("  ab ").error, "Vyplň jméno na kartě.");
});
