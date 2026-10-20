// Client-side checks for the checkout details step. They mirror the server rules
// (checkout-input.ts) only to point at the right field early; the server stays the authority.
import type { CheckoutDraft } from "./checkout-draft.ts";

export type FieldErrors = Record<string, string>;

const ZIP = /^\d{3} ?\d{2}$/;
const ADDRESS_ERRORS = {
  street: "Vyplň ulici a číslo.",
  city: "Vyplň město.",
  zip: "Zadej PSČ ve tvaru 123 45.",
} as const;

export function splitPhone(phone: string): { prefix: "+420" | "+421"; national: string } {
  if (phone.startsWith("+421")) return { prefix: "+421", national: phone.slice(4) };
  if (phone.startsWith("+420")) return { prefix: "+420", national: phone.slice(4) };
  return { prefix: "+420", national: "" };
}

export function joinPhone(prefix: string, national: string): string {
  const digits = national.replace(/\D/g, "");
  return digits === "" ? "" : `${prefix}${digits}`;
}

export function formatNationalNumber(national: string): string {
  return national.replace(/\D/g, "").replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

function checkAddress(address: { street: string; city: string; zip: string } | null, prefix: string, errors: FieldErrors): void {
  const key = (name: string) => (prefix === "" ? name : `${prefix}_${name}`);
  if (!address || address.street.trim() === "") errors[key("street")] = ADDRESS_ERRORS.street;
  if (!address || address.city.trim() === "") errors[key("city")] = ADDRESS_ERRORS.city;
  if (!address || !ZIP.test(address.zip.trim())) errors[key("zip")] = ADDRESS_ERRORS.zip;
}

export function validateDetails(
  draft: CheckoutDraft,
  cart: { hasPhysical: boolean; hasDigital: boolean },
  toggles: { company: boolean; billing: boolean },
): FieldErrors {
  const errors: FieldErrors = {};
  if (draft.contact.name.trim() === "") errors.name = "Vyplň jméno a příjmení.";
  if (!/^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(draft.contact.email.trim())) errors.email = "Zadej platný e-mail.";
  const phone = draft.contact.phone;
  if (phone !== "" ? !/^\+(420|421)\d{9}$/.test(phone) : cart.hasPhysical) errors.phone = "Zadej platné telefonní číslo.";

  if (cart.hasPhysical) {
    if (draft.delivery === null) errors.delivery = "Vyber způsob doručení.";
    else if (draft.delivery.method === "address") checkAddress(draft.shippingAddress, "", errors);
  }
  if (toggles.company && draft.company === null) errors.company = "Vyplň IČO a údaje firmy.";
  if (toggles.billing) checkAddress(draft.billingAddress, "billing", errors);

  if (!draft.consents.terms) errors.terms = "Potvrď souhlas s obchodními podmínkami.";
  if (cart.hasDigital && !draft.consents.digital_waiver) {
    errors.digital_waiver = "Potvrď souhlas se zpřístupněním digitálního obsahu před uplynutím lhůty pro odstoupení.";
  }
  return errors;
}
