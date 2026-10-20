"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { PostalAddress } from "@/lib/checkout/company";
import { formatNationalNumber, joinPhone, splitPhone, validateDetails, type FieldErrors } from "@/lib/checkout/details-validation";
import { PAYMENT_LABELS } from "@/lib/checkout/payment-labels";
import { useCart } from "@/components/store/use-cart";
import { CheckoutSteps } from "@/components/store/checkout/checkout-steps";
import { CheckoutSummary } from "@/components/store/checkout/checkout-summary";
import { CompanyFields } from "@/components/store/checkout/company-fields";
import { ToggleRow } from "@/components/store/checkout/toggle-row";
import { useCheckoutDraft } from "@/components/store/checkout/use-checkout-draft";

const noopSubscribe = () => () => {};

const GENERIC_ERROR = "Objednávku se nepodařilo připravit. Zkus to prosím znovu.";

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className={`store-field ${error ? "bad" : ""}`} data-error={error ? "true" : undefined}>
      {label}
      {children}
      <span className="store-field__error" role={error ? "alert" : undefined}>{error ?? ""}</span>
    </label>
  );
}

const EMPTY_ADDRESS: PostalAddress = { street: "", city: "", zip: "", country: "CZ" };

function AddressFields({ value, onChange, errors, prefix }: { value: PostalAddress | null; onChange: (address: PostalAddress) => void; errors: FieldErrors; prefix: string }) {
  const address = value ?? EMPTY_ADDRESS;
  const key = (name: string) => (prefix === "" ? name : `${prefix}_${name}`);
  return (
    <>
      <Field label="Ulice a číslo" error={errors[key("street")]}>
        <input value={address.street} autoComplete={prefix === "" ? "street-address" : "off"} onChange={(event) => onChange({ ...address, street: event.target.value })} />
      </Field>
      <div className="store-form-row">
        <Field label="Město" error={errors[key("city")]}>
          <input value={address.city} autoComplete={prefix === "" ? "address-level2" : "off"} onChange={(event) => onChange({ ...address, city: event.target.value })} />
        </Field>
        <Field label="PSČ" error={errors[key("zip")]}>
          <input value={address.zip} inputMode="numeric" autoComplete={prefix === "" ? "postal-code" : "off"} onChange={(event) => onChange({ ...address, zip: event.target.value })} />
        </Field>
      </div>
      <Field label="Země">
        <select value={address.country} onChange={(event) => onChange({ ...address, country: event.target.value === "SK" ? "SK" : "CZ" })}>
          <option value="CZ">Česko</option>
          <option value="SK">Slovensko</option>
        </select>
      </Field>
    </>
  );
}

/** Maps a server validation code to the field it belongs to. */
function fieldForCode(code: string, message: string): string | null {
  switch (code) {
    case "invalid_phone": return "phone";
    case "invalid_contact": return /e-?mail/i.test(message) ? "email" : "name";
    case "terms_required": return "terms";
    case "digital_waiver_required": return "digital_waiver";
    case "invalid_company": return "company";
    case "invalid_billing": return "billing_street";
    case "invalid_shipping":
    case "shipping_required": return "street";
    case "delivery_required":
    case "invalid_delivery": return "delivery";
    default: return null;
  }
}

export default function DetailsPage() {
  const router = useRouter();
  const items = useCart();
  const [draft, patch] = useCheckoutDraft();
  // false while hydrating (server snapshot), true on the client afterwards.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [companyLocal, setCompanyLocal] = useState<boolean | null>(null);
  const [billingLocal, setBillingLocal] = useState<boolean | null>(null);
  const [prefixLocal, setPrefixLocal] = useState<"+420" | "+421" | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState("");
  const [busy, setBusy] = useState(false);
  const latestDraft = useRef(draft);

  useEffect(() => {
    latestDraft.current = draft;
  });

  const hasPhysical = items.some((item) => item.type === "physical");
  const hasDigital = items.some((item) => item.type === "digital");
  const companyOn = companyLocal ?? draft.company !== null;
  const billingOn = billingLocal ?? draft.billingAddress !== null;
  const { prefix: storedPrefix, national } = splitPhone(draft.contact.phone);
  const prefix = prefixLocal ?? storedPrefix;

  // Physical goods need a delivery choice from step 2. Wait for the client-side draft before judging.
  useEffect(() => {
    if (hydrated && items.length > 0 && hasPhysical && draft.delivery === null) router.replace("/store/checkout/doprava");
  }, [hydrated, items.length, hasPhysical, draft.delivery, router]);

  // Signed-in customers get name and e-mail prefilled, never overwriting what they already typed.
  useEffect(() => {
    let active = true;
    fetch("/store/api/me.php", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { authenticated?: boolean; user?: { display_name?: string; email?: string } | null } | null) => {
        if (!active || !data?.authenticated || !data.user) return;
        const current = latestDraft.current.contact;
        patch({ contact: { ...current, name: current.name || data.user.display_name || "", email: current.email || data.user.email || "" } });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [patch]);

  if (items.length === 0) {
    return (
      <main className="store-main">
        <div className="store-empty"><h2>Košík je prázdný</h2><Link className="store-button primary" href="/store/catalog">Pokračovat v nákupu</Link></div>
      </main>
    );
  }

  const setContact = (change: Partial<typeof draft.contact>) => patch({ contact: { ...draft.contact, ...change } });
  const delivery = draft.delivery;
  const deliveryLabel = delivery === null ? null : delivery.method === "packeta_pickup" ? "Zásilkovna" : "na adresu";

  async function submit() {
    setTopError("");
    const found = validateDetails(draft, { hasPhysical, hasDigital }, { company: companyOn, billing: billingOn });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => document.querySelector("[data-error]")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    setBusy(true);
    const idempotencyKey = crypto.randomUUID();
    const payload = {
      items: items.map((item) => ({ product_id: item.id, quantity: item.qty })),
      idempotency_key: idempotencyKey,
      name: draft.contact.name.trim(),
      email: draft.contact.email.trim(),
      phone: draft.contact.phone === "" ? null : draft.contact.phone,
      notes: draft.notes,
      delivery: hasPhysical ? draft.delivery : null,
      shipping: hasPhysical && draft.delivery?.method === "address" ? draft.shippingAddress : null,
      billing: { company: companyOn ? draft.company : null, address: billingOn ? draft.billingAddress : null },
      payment_method: draft.paymentMethod,
      consents: draft.consents,
    };
    try {
      const response = await fetch("/store/api/create-checkout.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });
      const json = (await response.json().catch(() => null)) as { checkout?: { id?: string }; error?: { code?: string; message?: string } } | null;
      if (!response.ok || !json?.checkout?.id) {
        const message = json?.error?.message ?? GENERIC_ERROR;
        const field = fieldForCode(json?.error?.code ?? "", message);
        if (field) {
          setErrors({ [field]: message });
          requestAnimationFrame(() => document.querySelector("[data-error]")?.scrollIntoView({ block: "center", behavior: "smooth" }));
        } else {
          setTopError(message);
        }
        setBusy(false);
        return;
      }
      // Full page load on purpose: the payment page runs without analytics scripts.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full page load
      window.location.assign(`/store/checkout/platba?snapshot=${encodeURIComponent(json.checkout.id)}`);
    } catch {
      setTopError("Služba je dočasně nedostupná. Zkus to prosím znovu.");
      setBusy(false);
    }
  }

  return (
    <main className="store-main">
      <CheckoutSteps current={3} skipDelivery={!hasPhysical} />
      <div className="store-checkout-grid">
        <div>
          <section className="store-box">
            <h2>Kontaktní údaje</h2>
            <Field label="Jméno a příjmení" error={errors.name}>
              <input value={draft.contact.name} autoComplete="name" placeholder="Jan Novák" onChange={(event) => setContact({ name: event.target.value })} />
            </Field>
            <div className="store-form-row store-form-row--even">
              <Field label="E-mail" error={errors.email}>
                <input type="email" value={draft.contact.email} autoComplete="email" placeholder="jan@novak.cz" onChange={(event) => setContact({ email: event.target.value })} />
              </Field>
              <Field label={hasPhysical ? "Telefon" : "Telefon (nepovinný)"} error={errors.phone}>
                <span className="store-phone">
                  <select
                    aria-label="Předvolba"
                    value={prefix}
                    onChange={(event) => {
                      const next = event.target.value === "+421" ? "+421" : "+420";
                      setPrefixLocal(next);
                      setContact({ phone: joinPhone(next, national) });
                    }}
                  >
                    <option value="+420">🇨🇿 +420</option>
                    <option value="+421">🇸🇰 +421</option>
                  </select>
                  <input
                    type="tel"
                    value={formatNationalNumber(national)}
                    autoComplete="tel-national"
                    placeholder="777 123 456"
                    onChange={(event) => setContact({ phone: joinPhone(prefix, event.target.value) })}
                  />
                </span>
              </Field>
            </div>
            {hasPhysical && <p className="store-note">Zásilkovna pošle SMS, až bude balík připravený.</p>}
            {hasPhysical && delivery && (
              <div className={`store-deliv ${errors.delivery ? "bad" : ""}`} data-error={errors.delivery ? "true" : undefined}>
                <span>
                  {delivery.method === "packeta_pickup"
                    ? <>Zásilkovna · <b>{delivery.point.name}, {delivery.point.street}</b></>
                    : <>Doručení na adresu</>}
                </span>
                <Link href="/store/checkout/doprava">Změnit</Link>
              </div>
            )}
            {errors.delivery && <p className="store-error" role="alert">{errors.delivery} <Link href="/store/checkout/doprava">Zpět na výběr dopravy</Link></p>}
          </section>

          {hasPhysical && delivery?.method === "address" && (
            <section className="store-box">
              <h2>Doručovací adresa</h2>
              <AddressFields value={draft.shippingAddress} onChange={(shippingAddress) => patch({ shippingAddress })} errors={errors} prefix="" />
            </section>
          )}

          <section className="store-box">
            <h2>Fakturace</h2>
            <ToggleRow
              on={companyOn}
              onChange={(on) => {
                setCompanyLocal(on);
                if (!on) patch({ company: null });
              }}
              title="Nakupuji na firmu"
              hint="Faktura na IČO a DIČ, údaje doplníme z ARES"
            />
            {companyOn && <CompanyFields value={draft.company} onChange={(company) => patch({ company })} error={errors.company} />}
            <ToggleRow
              on={billingOn}
              onChange={(on) => {
                setBillingLocal(on);
                if (!on) patch({ billingAddress: null });
              }}
              title="Fakturační adresa je jiná"
              hint="Jinak použijeme sídlo firmy nebo doručovací adresu"
            />
            {billingOn && <AddressFields value={draft.billingAddress} onChange={(billingAddress) => patch({ billingAddress })} errors={errors} prefix="billing" />}
            <Field label="Poznámka k objednávce">
              <input value={draft.notes} maxLength={2000} placeholder="Nepovinné" onChange={(event) => patch({ notes: event.target.value })} />
            </Field>
          </section>
        </div>

        <CheckoutSummary
          shippingMethod={delivery?.method ?? null}
          deliveryLabel={deliveryLabel}
          paymentLabel={draft.paymentMethod ? PAYMENT_LABELS[draft.paymentMethod] : null}
          showVat={companyOn}
        >
          <label className={`store-check ${errors.terms ? "bad" : ""}`} data-error={errors.terms ? "true" : undefined}>
            <input type="checkbox" checked={draft.consents.terms} onChange={(event) => patch({ consents: { ...draft.consents, terms: event.target.checked } })} />
            <span>
              Souhlasím s <Link href="/store/terms" target="_blank">obchodními podmínkami</Link>, beru na vědomí <Link href="/store/privacy" target="_blank">zpracování osobních údajů</Link> a <Link href="/store/returns" target="_blank">podmínky vrácení zboží</Link>.
            </span>
          </label>
          {errors.terms && <p className="store-error" role="alert">{errors.terms}</p>}
          {hasDigital && (
            <>
              <label className={`store-check ${errors.digital_waiver ? "bad" : ""}`} data-error={errors.digital_waiver ? "true" : undefined}>
                <input type="checkbox" checked={draft.consents.digital_waiver} onChange={(event) => patch({ consents: { ...draft.consents, digital_waiver: event.target.checked } })} />
                <span>Žádám o zpřístupnění digitálního obsahu ihned po zaplacení a beru na vědomí, že tím ztrácím právo odstoupit od smlouvy.</span>
              </label>
              {errors.digital_waiver && <p className="store-error" role="alert">{errors.digital_waiver}</p>}
            </>
          )}
          {topError && <p className="store-error" role="alert">{topError}</p>}
          <button className="store-button primary" type="button" disabled={busy} onClick={submit}>{busy ? "Připravuji platbu…" : "Pokračovat k platbě"}</button>
          <p className="store-note">Fakturu pošleme e-mailem po zaplacení. U nákupu na firmu bude obsahovat IČO a DIČ.</p>
          <p className="store-note"><Link href="/store/cart">Zpět do košíku</Link></p>
        </CheckoutSummary>
      </div>
    </main>
  );
}
