// Browser-side tokenization: card details go straight to the Stripe API with the publishable key.
// Pure (only fetch, injectable) so it can run under node --test. Never log, store or echo the card.
import { declineMessage } from "./decline-messages.ts";

export type RawCard = { number: string; expMonth: number; expYear: number; cvc: string; name: string };

export type CardPaymentMethodResult = { id: string } | { error: string; code: string | null };

const PAYMENT_METHODS_URL = "https://api.stripe.com/v1/payment_methods";

export function buildPaymentMethodBody(card: RawCard): URLSearchParams {
  const body = new URLSearchParams();
  body.set("type", "card");
  body.set("card[number]", card.number);
  body.set("card[exp_month]", String(card.expMonth));
  body.set("card[exp_year]", String(card.expYear < 100 ? 2000 + card.expYear : card.expYear));
  body.set("card[cvc]", card.cvc);
  body.set("billing_details[name]", card.name);
  return body;
}

const ERROR_MESSAGES: Record<string, string> = {
  incorrect_number: "Číslo karty není platné. Zkontroluj překlep.",
  invalid_number: "Číslo karty není platné. Zkontroluj překlep.",
  invalid_expiry_month: "Platnost karty není platná.",
  invalid_expiry_year: "Platnost karty není platná.",
  incorrect_cvc: declineMessage("incorrect_cvc"),
  invalid_cvc: declineMessage("incorrect_cvc"),
  expired_card: declineMessage("expired_card"),
};

const GENERIC_ERROR = "Kartu se nepodařilo ověřit. Zkontroluj údaje a zkus to znovu.";

export async function createCardPaymentMethod(
  publishableKey: string,
  card: RawCard,
  fetchImpl: typeof fetch = fetch,
): Promise<CardPaymentMethodResult> {
  let response: Response;
  try {
    response = await fetchImpl(PAYMENT_METHODS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${publishableKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: buildPaymentMethodBody(card),
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    return { error: "Spojení se nepodařilo. Zkontroluj připojení a zkus to znovu.", code: null };
  }

  let json: { id?: unknown; error?: { code?: unknown; message?: unknown } } | null = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  if (response.ok && typeof json?.id === "string" && /^pm_/.test(json.id)) return { id: json.id };

  const code = typeof json?.error?.code === "string" ? json.error.code : null;
  const message = typeof json?.error?.message === "string" ? json.error.message : "";
  // Stripe refuses raw card data until support enables it on the account (test mode first).
  if (code === "integration_surface_unsupported" || /credit card numbers directly/i.test(message)) {
    return { error: "Platbu kartou se nepodařilo zahájit. Zkus jiný způsob platby nebo to později.", code: "raw_card_data_disabled" };
  }
  return { error: (code !== null && Object.hasOwn(ERROR_MESSAGES, code) ? ERROR_MESSAGES[code] : GENERIC_ERROR)!, code };
}
