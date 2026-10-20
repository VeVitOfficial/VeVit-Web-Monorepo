import test from "node:test";
import assert from "node:assert/strict";
import { declineMessage } from "../../src/lib/payments/decline-messages.ts";

const GENERIC = "Banka platbu zamítla. Zkus jinou kartu nebo jiný způsob platby.";

test("known decline codes have specific czech messages", () => {
  assert.equal(declineMessage("insufficient_funds"), "Na kartě není dostatek prostředků.");
  assert.equal(declineMessage("incorrect_cvc"), "CVC nesouhlasí.");
  assert.equal(declineMessage("expired_card"), "Karta je prošlá.");
  assert.equal(declineMessage("authentication_required"), "Ověření 3D Secure se nepodařilo.");
  assert.equal(declineMessage("payment_intent_authentication_failure"), "Ověření 3D Secure se nepodařilo.");
});

test("generic and unknown codes fall back to the generic message", () => {
  assert.equal(declineMessage("card_declined"), GENERIC);
  assert.equal(declineMessage("generic_decline"), GENERIC);
  assert.equal(declineMessage("something_new"), GENERIC);
  assert.equal(declineMessage(undefined), GENERIC);
  assert.equal(declineMessage(null), GENERIC);
});

test("raw provider text never leaks through", () => {
  assert.equal(declineMessage("Your card number is 4242424242424242"), GENERIC);
});
