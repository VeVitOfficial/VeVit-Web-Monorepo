// Maps Stripe decline/error codes to customer-facing Czech text. Provider text is never passed through.

export const GENERIC_DECLINE_MESSAGE = "Banka platbu zamítla. Zkus jinou kartu nebo jiný způsob platby.";

const MESSAGES: Record<string, string> = {
  insufficient_funds: "Na kartě není dostatek prostředků.",
  incorrect_cvc: "CVC nesouhlasí.",
  expired_card: "Karta je prošlá.",
  authentication_required: "Ověření 3D Secure se nepodařilo.",
  payment_intent_authentication_failure: "Ověření 3D Secure se nepodařilo.",
};

export function declineMessage(code: string | null | undefined): string {
  if (typeof code !== "string") return GENERIC_DECLINE_MESSAGE;
  return Object.hasOwn(MESSAGES, code) ? MESSAGES[code]! : GENERIC_DECLINE_MESSAGE;
}
