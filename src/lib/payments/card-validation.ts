// Pure card-field validation. No imports: loaded by node --test as well as the browser bundle.

export type CardBrand = "visa" | "mastercard" | "amex" | "maestro";

export type FieldResult = { ok: boolean; complete: boolean; error: string | null };

const BRAND_LENGTHS: Record<CardBrand, number[]> = {
  visa: [13, 16, 19],
  mastercard: [16],
  amex: [15],
  maestro: [12, 13, 14, 15, 16, 17, 18, 19],
};

// Luhn is judged from this length up, so a Visa typed towards 16 digits is not flagged at 13.
const JUDGE_FROM_LENGTH: Record<CardBrand, number> = {
  visa: 16,
  mastercard: 16,
  amex: 15,
  maestro: 16,
};

const MAX_DIGITS = 19;
const MAX_YEARS_AHEAD = 20;

const MASTERCARD = /^(5[1-5]|2(2[2-9][1-9]|2[3-9]\d|[3-6]\d\d|7[01]\d|720))/;

export const CARD_ERRORS = {
  unsupported: "Tento typ karty nepřijímáme.",
  number: "Číslo karty není platné. Zkontroluj překlep.",
  month: "Měsíc musí být 01–12.",
  expired: "Karta už je prošlá.",
  year: "Neplatný rok.",
  cvc: "CVC je neúplné.",
  name: "Vyplň jméno na kartě.",
} as const;

export function detectBrand(digits: string): CardBrand | null {
  if (/^4/.test(digits)) return "visa";
  if (MASTERCARD.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(50|5[6-9]|6)/.test(digits)) return "maestro";
  return null;
}

export function brandLengths(brand: CardBrand): number[] {
  return [...BRAND_LENGTHS[brand]];
}

export function cvcLength(brand: CardBrand | null): 3 | 4 {
  return brand === "amex" ? 4 : 3;
}

export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "").slice(0, MAX_DIGITS);
}

export function formatCardNumber(digits: string, brand: CardBrand | null): string {
  const groups = brand === "amex" ? [4, 6, 5] : [4, 4, 4, 4, 4];
  const parts: string[] = [];
  let at = 0;
  for (const size of groups) {
    if (at >= digits.length) break;
    parts.push(digits.slice(at, at + size));
    at += size;
  }
  return parts.join(" ");
}

export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function validateCardNumber(digits: string): FieldResult & { brand: CardBrand | null } {
  const brand = detectBrand(digits);
  if (!brand) {
    return { ok: false, complete: false, brand, error: digits.length >= 2 ? CARD_ERRORS.unsupported : null };
  }
  const lengths = BRAND_LENGTHS[brand];
  const length = digits.length;
  const maxLength = lengths[lengths.length - 1];
  if (length > maxLength) {
    return { ok: false, complete: true, brand, error: CARD_ERRORS.number };
  }
  const lengthAllowed = lengths.includes(length);
  const luhn = lengthAllowed && luhnValid(digits);
  const judged = lengthAllowed && length >= JUDGE_FROM_LENGTH[brand];
  return {
    ok: luhn,
    complete: judged,
    brand,
    error: judged && !luhn ? CARD_ERRORS.number : null,
  };
}

export function validateExpiry(
  input: string,
  now: Date,
): FieldResult & { month: number | null; year: number | null } {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  const empty = { ok: false, complete: false, month: null, year: null };
  if (digits.length < 2) return { ...empty, error: null };

  const month = Number(digits.slice(0, 2));
  if (month < 1 || month > 12) return { ...empty, error: CARD_ERRORS.month };
  if (digits.length < 4) return { ...empty, error: null };

  const year = 2000 + Number(digits.slice(2, 4));
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const result = { complete: true, month, year };
  if (year > currentYear + MAX_YEARS_AHEAD) return { ...result, ok: false, error: CARD_ERRORS.year };
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { ...result, ok: false, error: CARD_ERRORS.expired };
  }
  return { ...result, ok: true, error: null };
}

export function validateCvc(input: string, brand: CardBrand | null): FieldResult {
  const required = cvcLength(brand);
  const digits = input.replace(/\D/g, "");
  const ok = digits.length === required;
  return { ok, complete: ok, error: ok ? null : CARD_ERRORS.cvc };
}

export function validateHolderName(input: string): FieldResult {
  const ok = input.trim().length >= 3;
  return { ok, complete: ok, error: ok ? null : CARD_ERRORS.name };
}
