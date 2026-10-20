"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND_LOGOS } from "@/lib/payments/card-banks";
import { FREE_SHIPPING_THRESHOLD_MINOR, SHIPPING_PRICES_MINOR, shippingMinor, type DeliveryMethod } from "@/lib/checkout/shipping";
import { PAYMENT_LABELS } from "@/lib/checkout/payment-labels";
import { cartSubtotal } from "@/lib/cart";
import { useCart } from "@/components/store/use-cart";
import { useFreeShipping } from "@/components/store/use-free-shipping";
import { CheckoutSteps } from "@/components/store/checkout/checkout-steps";
import { CheckoutSummary } from "@/components/store/checkout/checkout-summary";
import { MethodOption } from "@/components/store/checkout/method-option";
import { PacketaPicker } from "@/components/store/checkout/packeta-picker";
import { useCheckoutDraft } from "@/components/store/checkout/use-checkout-draft";
import { useWalletSupport } from "@/components/store/checkout/use-wallet-support";

const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

function Logos({ keys }: { keys: Array<keyof typeof BRAND_LOGOS> }) {
  return (
    <>
      {keys.map((key) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key} alt="" src={BRAND_LOGOS[key]} className="store-method__logo" />
      ))}
    </>
  );
}

function PriceTag({ method, subtotalMinor, freePerk }: { method: DeliveryMethod; subtotalMinor: number; freePerk: boolean }) {
  const price = SHIPPING_PRICES_MINOR[method];
  const free = shippingMinor({ method, hasPhysical: true, subtotalMinor, freePerk }) === 0;
  return free ? <><s>{money.format(price / 100)}</s> zdarma</> : <>{money.format(price / 100)}</>;
}

export default function DeliveryPage() {
  const router = useRouter();
  const items = useCart();
  const freePerk = useFreeShipping();
  const wallet = useWalletSupport();
  const [draft, patch] = useCheckoutDraft();
  // Picking "pickup point" before a point is chosen cannot live in the draft (it needs a point).
  const [choice, setChoice] = useState<DeliveryMethod | null>(null);
  const hasPhysical = items.some((item) => item.type === "physical");
  const subtotalMinor = Math.round(cartSubtotal(items) * 100);

  // A digital-only cart has nothing to deliver: go straight to the details step.
  useEffect(() => {
    if (items.length > 0 && !hasPhysical) router.replace("/store/checkout/udaje");
  }, [items.length, hasPhysical, router]);

  // The device may not support the wallet chosen earlier (e.g. the draft came from another browser).
  useEffect(() => {
    if (!wallet) return;
    if ((draft.paymentMethod === "apple_pay" && !wallet.applePay) || (draft.paymentMethod === "google_pay" && !wallet.googlePay)) {
      patch({ paymentMethod: null });
    }
  }, [wallet, draft.paymentMethod, patch]);

  if (items.length === 0) {
    return (
      <main className="store-main">
        <div className="store-empty"><h2>Košík je prázdný</h2><Link className="store-button primary" href="/store/catalog">Pokračovat v nákupu</Link></div>
      </main>
    );
  }
  if (!hasPhysical) return <main className="store-main"><div className="store-empty">Pokračuji k údajům…</div></main>;

  const delivery = draft.delivery;
  const method: DeliveryMethod | null = choice ?? delivery?.method ?? null;
  const canContinue = delivery !== null && draft.paymentMethod !== null;
  const walletChecking = wallet === null;
  const deliveryLabel = method === null ? null : method === "packeta_pickup" ? "Zásilkovna" : "na adresu";

  return (
    <main className="store-main">
      <CheckoutSteps current={2} />
      <div className="store-checkout-grid">
        <div>
          <section className="store-box">
            <h2>Doprava</h2>
            <MethodOption
              name="delivery"
              selected={method === "packeta_pickup"}
              onSelect={() => {
                setChoice("packeta_pickup");
                if (delivery?.method === "address") patch({ delivery: null });
              }}
              icon={
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Zásilkovna" src="/payments/brands/zasilkovna.png" className="store-method__logo store-method__logo--square" />
              }
              title="Zásilkovna: výdejní místo nebo Z-BOX"
              hint="Vyzvednutí na výdejním místě nebo v Z-BOXu · ČR a SR"
              price={<PriceTag method="packeta_pickup" subtotalMinor={subtotalMinor} freePerk={freePerk} />}
            >
              <PacketaPicker
                value={delivery?.method === "packeta_pickup" ? delivery.point : null}
                onChange={(point) => patch({ delivery: point ? { method: "packeta_pickup", point } : null })}
              />
            </MethodOption>
            <MethodOption
              name="delivery"
              selected={method === "address"}
              onSelect={() => {
                setChoice("address");
                patch({ delivery: { method: "address" } });
              }}
              icon={<span aria-hidden="true">🚚</span>}
              title={<>Doručení na adresu <span className="store-tag">dopravce doplníme</span></>}
              hint="Doručení domů nebo do práce · ČR a SR"
              price={<PriceTag method="address" subtotalMinor={subtotalMinor} freePerk={freePerk} />}
            />
            <p className="store-note">Doprava je zdarma od {money.format(FREE_SHIPPING_THRESHOLD_MINOR / 100)}. Obsahuje-li košík jen digitální produkty, tento krok se přeskočí.</p>
          </section>

          <section className="store-box">
            <h2>Platba</h2>
            <MethodOption
              name="payment"
              selected={draft.paymentMethod === "card"}
              onSelect={() => patch({ paymentMethod: "card" })}
              icon={<Logos keys={["visa", "mastercard", "maestro", "amex"]} />}
              title="Platební karta"
              hint="Visa, Mastercard, Maestro, Amex"
            />
            <MethodOption
              name="payment"
              selected={draft.paymentMethod === "apple_pay"}
              disabled={wallet !== null && !wallet.applePay}
              onSelect={() => patch({ paymentMethod: "apple_pay" })}
              icon={<Logos keys={["applepay"]} />}
              title="Apple Pay"
              hint={wallet !== null && !wallet.applePay ? "Na tomto zařízení není k dispozici." : walletChecking ? "Zjišťuji dostupnost…" : "Platba přes Apple Pay"}
            />
            <MethodOption
              name="payment"
              selected={draft.paymentMethod === "google_pay"}
              disabled={wallet !== null && !wallet.googlePay}
              onSelect={() => patch({ paymentMethod: "google_pay" })}
              icon={<Logos keys={["googlepay"]} />}
              title="Google Pay"
              hint={wallet !== null && !wallet.googlePay ? "Na tomto zařízení není k dispozici." : walletChecking ? "Zjišťuji dostupnost…" : "Platba přes Google Pay"}
            />
            <MethodOption
              name="payment"
              selected={draft.paymentMethod === "paypal"}
              onSelect={() => patch({ paymentMethod: "paypal" })}
              icon={<Logos keys={["paypal"]} />}
              title="PayPal"
              hint="Přesměrování na PayPal a zpět"
            />
          </section>
        </div>

        <CheckoutSummary
          shippingMethod={method}
          deliveryLabel={deliveryLabel}
          paymentLabel={draft.paymentMethod ? PAYMENT_LABELS[draft.paymentMethod] : null}
        >
          <button className="store-button primary" type="button" disabled={!canContinue} onClick={() => router.push("/store/checkout/udaje")}>
            Pokračovat k údajům
          </button>
          <p className="store-note">Konečnou cenu vždy spočítá server, tady je jen zobrazení.</p>
        </CheckoutSummary>
      </div>
    </main>
  );
}
