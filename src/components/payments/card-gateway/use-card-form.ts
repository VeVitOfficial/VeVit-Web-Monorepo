"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CARD_BANKS, bankForDigits, type CardBankKey } from "@/lib/payments/card-banks";
import {
  brandLengths,
  cvcLength,
  detectBrand,
  digitsOnly,
  formatCardNumber,
  validateCardNumber,
  validateCvc,
  validateExpiry,
  validateHolderName,
} from "@/lib/payments/card-validation";

export type Zone = "number" | "name" | "exp" | "cvc";

export type BankView = {
  name: string;
  logo: string | null;
  background: string | null;
  foreground: string | null;
};

type BinAnswer = { bank_key: CardBankKey | null; bank_name: string | null } | null;

const BIN_DEBOUNCE_MS = 300;
const BIN_LENGTH = 6;

function formatExpiry(input: string): string {
  let digits = input.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`;
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function stripHolder(input: string): string {
  return input.replace(/[^\p{L} .'-]/gu, "").slice(0, 40);
}

/** Card form state. Card values live only in this component's memory: never persisted or logged. */
export function useCardForm() {
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [focused, setFocused] = useState<Zone | null>(null);
  const [touched, setTouched] = useState<Record<Zone, boolean>>({ number: false, name: false, exp: false, cvc: false });
  const [binAnswers, setBinAnswers] = useState<Record<string, BinAnswer>>({});

  const digits = digitsOnly(number);
  const numberResult = useMemo(() => validateCardNumber(digits), [digits]);
  const brand = numberResult.brand;
  const expiryResult = useMemo(() => validateExpiry(expiry, new Date()), [expiry]);
  const cvcResult = validateCvc(cvc, brand);
  const holderResult = validateHolderName(holder);

  const prefix = digits.length >= BIN_LENGTH ? digits.slice(0, BIN_LENGTH) : null;
  const localBank = bankForDigits(digits);

  const lookupNeeded = prefix !== null && bankForDigits(prefix) === null && !(prefix in binAnswers);

  useEffect(() => {
    if (!lookupNeeded || prefix === null) return;
    const timer = setTimeout(async () => {
      let answer: BinAnswer = null;
      try {
        const response = await fetch(`/api/payments/bin?prefix=${prefix}`, { cache: "no-store", credentials: "same-origin" });
        if (response.status === 200) {
          const json = (await response.json()) as { bank_key?: CardBankKey | null; bank_name?: string | null };
          answer = { bank_key: json.bank_key ?? null, bank_name: json.bank_name ?? null };
        }
      } catch {
        answer = null;
      }
      setBinAnswers((current) => ({ ...current, [prefix]: answer }));
    }, BIN_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [lookupNeeded, prefix]);

  const externalAnswer = prefix !== null ? (binAnswers[prefix] ?? null) : null;
  const bank: BankView | null = useMemo(() => {
    const known = localBank ?? (externalAnswer?.bank_key ? CARD_BANKS[externalAnswer.bank_key] : null);
    if (known) return { name: known.name, logo: known.logo, background: known.background, foreground: known.foreground };
    if (externalAnswer?.bank_name) return { name: externalAnswer.bank_name, logo: null, background: null, foreground: null };
    return null;
  }, [localBank, externalAnswer]);
  const bankUnknown = digits.length >= BIN_LENGTH && bank === null;

  const onNumber = useCallback((input: HTMLInputElement) => {
    const value = input.value;
    const selectionStart = input.selectionStart;
    const raw = digitsOnly(value);
    const nextBrand = detectBrand(raw);
    const limit = nextBrand ? Math.max(...brandLengths(nextBrand)) : 19;
    const clean = raw.slice(0, limit);
    const formatted = formatCardNumber(clean, nextBrand);
    if (selectionStart !== null) {
      const digitsBeforeCaret = Math.min(value.slice(0, selectionStart).replace(/\D/g, "").length, clean.length);
      let seen = 0;
      let position = digitsBeforeCaret === 0 ? 0 : formatted.length;
      for (let i = 0; i < formatted.length && digitsBeforeCaret > 0; i++) {
        if (/\d/.test(formatted[i]!) && ++seen === digitsBeforeCaret) { position = i + 1; break; }
      }
      // Keep the caret next to the same digit once React has committed the reformatted value.
      requestAnimationFrame(() => {
        if (document.activeElement === input) input.setSelectionRange(position, position);
      });
    }
    setNumber(formatted);
    // CVC length depends on the brand: trim an already typed CVC.
    setCvc((current) => current.slice(0, cvcLength(nextBrand)));
  }, []);

  const touch = useCallback((zone: Zone) => setTouched((current) => ({ ...current, [zone]: true })), []);

  const errors = {
    number: numberResult.error ?? (touched.number && !numberResult.ok ? "Vyplň číslo karty." : null),
    name: touched.name && !holderResult.ok ? holderResult.error : null,
    exp: expiryResult.error ?? (touched.exp && !expiryResult.ok ? "Vyplň platnost karty." : null),
    cvc: touched.cvc && !cvcResult.ok ? cvcResult.error : null,
  };

  const valid = numberResult.ok && holderResult.ok && expiryResult.ok && cvcResult.ok;
  const badZones: Zone[] = (Object.keys(errors) as Zone[]).filter((zone) => errors[zone] !== null);

  const touchAll = useCallback(() => setTouched({ number: true, name: true, exp: true, cvc: true }), []);
  const clearCvc = useCallback(() => setCvc(""), []);
  const reset = useCallback(() => {
    setNumber("");
    setHolder("");
    setExpiry("");
    setCvc("");
  }, []);

  return {
    number, holder, expiry, cvc, digits, brand, bank, bankUnknown,
    focused, setFocused, touch, touchAll,
    numberResult, expiryResult, errors, badZones, valid,
    onNumber,
    onHolder: (value: string) => setHolder(stripHolder(value)),
    onExpiry: (value: string) => setExpiry(formatExpiry(value)),
    onCvc: (value: string) => setCvc(value.replace(/\D/g, "").slice(0, cvcLength(brand))),
    clearCvc, reset,
  };
}
