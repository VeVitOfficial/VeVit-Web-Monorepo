// Pure mapping of an external BIN lookup answer (binlist format) onto the fields VeVit stores.
import type { CardBankKey } from "./card-banks.ts";

export type MappedBin = {
  bankName: string | null;
  scheme: string | null;
  funding: string | null;
  country: string | null;
};

const MAX_TEXT = 120;

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed !== "" && trimmed.length <= MAX_TEXT ? trimmed : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function mapBinResponse(json: unknown): MappedBin {
  const root = record(json);
  const country = text(record(root?.country)?.alpha2);
  return {
    bankName: text(record(root?.bank)?.name),
    scheme: text(root?.scheme),
    funding: text(root?.type),
    country: country !== null && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : null,
  };
}

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Needle lists are normalized names; "raiffeisenbank" does not match "Raiffeisen Bank International".
const NAME_RULES: Array<[CardBankKey, string[]]> = [
  ["uc", ["unicredit"]],
  ["csob", ["ceskoslovenska obchodni banka", "csob"]],
  ["cs", ["ceska sporitelna"]],
  ["kb", ["komercni banka"]],
  ["rb", ["raiffeisenbank"]],
  ["moneta", ["moneta money bank", "ge money bank"]],
  ["airbank", ["air bank"]],
];

export function matchKnownBank(bankName: string | null): CardBankKey | null {
  if (bankName === null) return null;
  const name = normalize(bankName);
  for (const [key, needles] of NAME_RULES) {
    if (needles.some((needle) => name.includes(needle))) return key;
  }
  return null;
}
