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

/**
 * The only decline codes a client may see or that get stored for display. Everything else
 * (stolen_card, fraudulent, ...) collapses to card_declined so the endpoint is no oracle for
 * card testing.
 */
export function publicDeclineCode(code: string | null | undefined): string {
  return typeof code === "string" && Object.hasOwn(MESSAGES, code) ? code : "card_declined";
}
