"use client";

import { type FormEvent, useState } from "react";
import { BRAND_LOGOS } from "@/lib/payments/card-banks";
import { cvcLength, type CardBrand } from "@/lib/payments/card-validation";
import { createCardPaymentMethod } from "@/lib/payments/stripe-raw-card";
import { CardPreview } from "./card-preview";
import { type Zone, useCardForm } from "./use-card-form";
import styles from "./card-gateway.module.css";

type Props = {
  amountMinor: number;
  submitLabel: string;
  /** Receives the Stripe payment method id (pm_...). Throw Error(message) to show a message under the button. */
  onPaymentMethod: (paymentMethodId: string) => Promise<void>;
  disabled?: boolean;
};

const ACCEPTED: CardBrand[] = ["visa", "mastercard", "maestro", "amex"];
const BRAND_NAMES: Record<CardBrand, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", maestro: "Maestro" };
const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

export function CardGateway({ amountMinor, submitLabel, onPaymentMethod, disabled = false }: Props) {
  const form = useCardForm();
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

  const requiredCvc = cvcLength(form.brand);
  const fieldClass = (zone: Zone, extra = "") => [styles.field, extra, form.errors[zone] ? styles.bad : ""].filter(Boolean).join(" ");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || disabled) return;
    setSubmitError("");
    form.touchAll();
    if (!form.valid || form.expiryResult.month === null || form.expiryResult.year === null) return;
    if (!publishableKey) {
      setSubmitError("Platba kartou teď není dostupná. Zkus jiný způsob platby.");
      return;
    }
    setBusy(true);
    try {
      const created = await createCardPaymentMethod(publishableKey, {
        number: form.digits,
        expMonth: form.expiryResult.month,
        expYear: form.expiryResult.year,
        cvc: form.cvc,
        name: form.holder.trim(),
      });
      if ("error" in created) {
        setSubmitError(created.error);
        return;
      }
      try {
        await onPaymentMethod(created.id);
        form.reset();
      } catch (reason) {
        form.clearCvc();
        setSubmitError(reason instanceof Error ? reason.message : "Platba se nepodařila. Zkus to prosím znovu.");
      }
    } finally {
      setBusy(false);
    }
  }

  const tags: Array<{ text: string; kind?: "ok" | "err" }> = [];
  if (form.brand) tags.push({ text: BRAND_NAMES[form.brand] });
  if (form.bank) tags.push({ text: form.bank.name });
  if (form.numberResult.ok) tags.push({ text: "✓ číslo ověřeno (Luhn)", kind: "ok" });
  if (form.numberResult.error) tags.push({ text: `✗ ${form.numberResult.error}`, kind: "err" });

  return (
    <div className={styles.wrap}>
      <div>
        <CardPreview
          digits={form.digits}
          brand={form.brand}
          bank={form.bank}
          bankUnknown={form.bankUnknown}
          holder={form.holder}
          expiry={form.expiry}
          cvcLength={requiredCvc}
          cvcTyped={form.cvc.length}
          focused={form.focused}
          badZones={form.badZones}
        />
        <div className={styles.meta} aria-live="polite">
          {tags.map((tag) => (
            <span key={tag.text} className={`${styles.tag} ${tag.kind ? styles[tag.kind] : ""}`}>{tag.text}</span>
          ))}
        </div>
      </div>

      <form
        className={styles.form}
        onSubmit={submit}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) form.setFocused(null); }}
        autoComplete="on"
        noValidate
      >
        <h3 style={{ margin: "0 0 14px" }}>Platba kartou · {money.format(amountMinor / 100)}</h3>
        <div className={styles.accept} aria-label="Přijímané karty">
          {ACCEPTED.map((brand) => (
            <span key={brand} className={form.brand === brand ? styles.on : ""}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={BRAND_NAMES[brand]} src={BRAND_LOGOS[brand]} />
            </span>
          ))}
        </div>

        <label className={fieldClass("number")}>
          Číslo karty
          <span className={styles.inWrap}>
            <input
              value={form.number}
              onChange={(event) => form.onNumber(event.target)}
              onFocus={() => form.setFocused("number")}
              onBlur={() => form.touch("number")}
              autoComplete="cc-number"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              maxLength={23}
              spellCheck={false}
              aria-invalid={form.errors.number !== null}
              data-sensitive="true"
            />
            <span className={styles.inIcon}>
              {form.bank?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={form.bank.logo} />
              )}
              {form.brand && (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={BRAND_LOGOS[form.brand]} />
              )}
            </span>
          </span>
          <span className={styles.err} role="alert">{form.errors.number}</span>
        </label>

        <label className={fieldClass("name", styles.holder)}>
          Jméno na kartě
          <input
            value={form.holder}
            onChange={(event) => form.onHolder(event.target.value)}
            onFocus={() => form.setFocused("name")}
            onBlur={() => form.touch("name")}
            autoComplete="cc-name"
            placeholder="Jan Novák"
            spellCheck={false}
            aria-invalid={form.errors.name !== null}
            data-sensitive="true"
          />
          <span className={styles.err} role="alert">{form.errors.name}</span>
        </label>

        <div className={styles.split}>
          <label className={fieldClass("exp")}>
            Platnost
            <input
              value={form.expiry}
              onChange={(event) => form.onExpiry(event.target.value)}
              onFocus={() => form.setFocused("exp")}
              onBlur={() => form.touch("exp")}
              autoComplete="cc-exp"
              inputMode="numeric"
              placeholder="MM/RR"
              maxLength={5}
              spellCheck={false}
              aria-invalid={form.errors.exp !== null}
              data-sensitive="true"
            />
            <span className={styles.err} role="alert">{form.errors.exp}</span>
          </label>
          <label className={fieldClass("cvc")}>
            CVC
            <input
              value={form.cvc}
              onChange={(event) => form.onCvc(event.target.value)}
              onFocus={() => form.setFocused("cvc")}
              onBlur={() => form.touch("cvc")}
              autoComplete="cc-csc"
              inputMode="numeric"
              placeholder={requiredCvc === 4 ? "1234" : "123"}
              maxLength={requiredCvc}
              spellCheck={false}
              aria-invalid={form.errors.cvc !== null}
              data-sensitive="true"
            />
            <span className={styles.err} role="alert">{form.errors.cvc}</span>
          </label>
        </div>

        <button className={styles.pay} type="submit" disabled={busy || disabled}>
          {busy ? "Zpracovávám…" : submitLabel}
        </button>
        {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}
        <p className={styles.secure}>🔒 Údaje karty jdou přímo do Stripe · 3D Secure ověření v aplikaci banky</p>
      </form>
    </div>
  );
}
