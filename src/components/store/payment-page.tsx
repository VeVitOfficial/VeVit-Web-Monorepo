"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TurnstileField, captchaToken, resetCaptcha } from "@/components/account/auth/captcha";
import { CardGateway } from "@/components/payments/card-gateway/card-gateway";
import { PayPalButton } from "@/components/payments/paypal-button";
import { getStripe } from "@/components/payments/stripe-client";
import { WalletButton, type WalletAvailability } from "@/components/payments/wallet-button";
import { CheckoutSteps } from "@/components/store/checkout/checkout-steps";
import { DRAFT_KEY, parseDraft } from "@/lib/checkout/checkout-draft";
import { intentMethodFor } from "@/lib/checkout/payment-labels";
import { BRAND_LOGOS } from "@/lib/payments/card-banks";
import { declineMessage } from "@/lib/payments/decline-messages";
import styles from "./payment-page.module.css";

type Method = "card" | "wallet" | "paypal";
type IntentMethod = Method;

const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
const PREPARE_ERROR = "Platbu se nyní nepodařilo připravit.";
const PAY_ERROR = "Platba se nepodařila. Zkus to prosím znovu.";

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; json: Record<string, unknown> | null }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  let json: Record<string, unknown> | null = null;
  try {
    json = (await response.json()) as Record<string, unknown>;
  } catch {
    json = null;
  }
  return { ok: response.ok, json };
}

function errorMessage(json: Record<string, unknown> | null, fallback: string): string {
  const error = json?.error as { message?: unknown } | undefined;
  return typeof error?.message === "string" ? error.message : fallback;
}

function goToSuccess(orderPublicId: string): void {
  // Full navigation: the payment page is the only place without analytics, success may have them.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full page load
  window.location.assign(`/store/success?order=${encodeURIComponent(orderPublicId)}`);
}

/** Method and delivery choice made in step 2, read once (the page is only ever rendered on the client). */
function readStepChoices(): { method: Method; hasDelivery: boolean } {
  try {
    const draft = parseDraft(sessionStorage.getItem(DRAFT_KEY));
    return { method: intentMethodFor(draft.paymentMethod), hasDelivery: draft.delivery !== null };
  } catch {
    return { method: "card", hasDelivery: false };
  }
}

export function PaymentPage() {
  const params = useSearchParams();
  // Captured once: the URL is rewritten from ?snapshot= to ?order= after the order exists.
  const [initial] = useState(() => ({
    snapshot: params.get("snapshot") ?? "",
    order: params.get("order") ?? "",
    returned: params.has("payment_intent"),
    redirectStatus: params.get("redirect_status") ?? "",
    ...readStepChoices(),
  }));
  const [orderId, setOrderId] = useState(initial.order);
  const [amountMinor, setAmountMinor] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [chosen, setMethod] = useState<Method>(initial.method);
  const [wallet, setWallet] = useState<WalletAvailability | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (initial.order) {
          const response = await fetch(`/store/api/payment-status.php?order=${encodeURIComponent(initial.order)}`, { cache: "no-store", credentials: "same-origin" });
          const json = (await response.json().catch(() => null)) as { payment_status?: string; amount_minor?: number } | null;
          if (!response.ok || !json) throw new Error("Objednávka není dostupná.");
          const settled = json.payment_status === "paid" || json.payment_status === "manual_review";
          // Returning from 3D Secure / PayPal: the success page polls the real state.
          if (settled || (initial.returned && initial.redirectStatus !== "failed")) {
            goToSuccess(initial.order);
            return;
          }
          if (cancelled) return;
          setAmountMinor(typeof json.amount_minor === "number" ? json.amount_minor : null);
          if (initial.returned) setError("Platba se nezdařila. Zkus to znovu nebo zvol jiný způsob platby.");
          setReady(true);
        } else if (initial.snapshot) {
          const { ok, json } = await postJson("/store/api/payment-intent.php", { snapshot: initial.snapshot, method: initial.method });
          const publicId = (json?.order as { public_id?: string } | undefined)?.public_id;
          if (!ok || !publicId || typeof json?.amount_minor !== "number") throw new Error(errorMessage(json, PREPARE_ERROR));
          if (cancelled) return;
          setOrderId(publicId);
          setAmountMinor(json.amount_minor);
          // The snapshot is consumed; make a reload land on the order.
          window.history.replaceState(null, "", `${window.location.pathname}?order=${publicId}`);
          setReady(true);
        } else {
          throw new Error("Chybí údaje objednávky. Vrať se do košíku.");
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : PREPARE_ERROR);
      }
    })();
    return () => { cancelled = true; };
  }, [initial]);

  async function requestIntent(intentMethod: IntentMethod): Promise<string> {
    const { ok, json } = await postJson("/store/api/payment-intent.php", { order: orderId, method: intentMethod });
    if (!ok || typeof json?.client_secret !== "string") throw new Error(errorMessage(json, PREPARE_ERROR));
    return json.client_secret;
  }

  async function payByCard(paymentMethodId: string): Promise<void> {
    // Recreates the card intent when the customer tried PayPal first; reuses it otherwise.
    await requestIntent("card");
    const { ok, json } = await postJson("/store/api/pay-card.php", {
      order: orderId,
      payment_method: paymentMethodId,
      turnstile_token: captchaToken(),
    });
    resetCaptcha();
    if (!ok) throw new Error(errorMessage(json, PAY_ERROR));
    if (json?.status === "requires_action" && typeof json.client_secret === "string") {
      const stripe = await getStripe();
      if (!stripe) throw new Error(PAY_ERROR);
      const result = await stripe.handleNextAction({ clientSecret: json.client_secret });
      if (result.error) throw new Error(declineMessage(result.error.decline_code ?? result.error.code));
      if (result.paymentIntent?.status === "requires_payment_method") throw new Error(declineMessage("authentication_required"));
    }
    goToSuccess(orderId);
  }

  const returnUrl = ready ? `${window.location.origin}/store/checkout/platba?order=${orderId}` : "";
  const walletUnavailable = wallet !== null && !wallet.applePay && !wallet.googlePay;
  // A wallet chosen in step 2 may not exist on this device: fall back to the card form.
  const method: Method = chosen === "wallet" && walletUnavailable ? "card" : chosen;

  if (!ready) {
    return (
      <main className="store-main">
        <CheckoutSteps current={4} skipDelivery={!initial.hasDelivery} />
        <div className="store-section-head"><div><h1>Platba</h1></div></div>
        {error
          ? <><p className={styles.error} role="alert">{error}</p><Link className="store-button" href="/store/cart">Zpět do košíku</Link></>
          : <div className="store-empty">Připravuji platbu…</div>}
      </main>
    );
  }

  return (
    <main className="store-main">
      <CheckoutSteps current={4} skipDelivery={!initial.hasDelivery} />
      <div className="store-section-head"><div><h1>Zaplatit objednávku</h1></div></div>
      {amountMinor !== null && <p className={styles.amount}>K úhradě <strong>{money.format(amountMinor / 100)}</strong></p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {initial.hasDelivery && <p className={styles.change}><Link href="/store/checkout/doprava">Změnit způsob platby</Link></p>}

      <fieldset className={styles.methods}>
        <legend className="sr-only">Způsob platby</legend>
        <label className={`${styles.method} ${method === "card" ? styles.selected : ""}`}>
          <input type="radio" name="method" checked={method === "card"} onChange={() => setMethod("card")} />
          <span className={styles.icons}>
            {(["visa", "mastercard", "maestro", "amex"] as const).map((brand) => (
              // eslint-disable-next-line @next/next/no-img-element
              <span key={brand}><img alt="" src={BRAND_LOGOS[brand]} /></span>
            ))}
          </span>
          <span className={styles.title}>Platební karta</span>
        </label>
        <label className={`${styles.method} ${method === "wallet" ? styles.selected : ""} ${walletUnavailable ? styles.unavailable : ""}`}>
          <input type="radio" name="method" checked={method === "wallet"} disabled={walletUnavailable} onChange={() => setMethod("wallet")} />
          <span className={styles.icons}>
            {(["applepay", "googlepay"] as const).map((brand) => (
              // eslint-disable-next-line @next/next/no-img-element
              <span key={brand}><img alt="" src={BRAND_LOGOS[brand]} /></span>
            ))}
          </span>
          <span className={styles.title}>
            Apple Pay / Google Pay
            {walletUnavailable && <span className={styles.hint}>Na tomto zařízení není k dispozici.</span>}
          </span>
        </label>
        <label className={`${styles.method} ${method === "paypal" ? styles.selected : ""}`}>
          <input type="radio" name="method" checked={method === "paypal"} onChange={() => setMethod("paypal")} />
          <span className={styles.icons}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span><img alt="" src={BRAND_LOGOS.paypal} /></span>
          </span>
          <span className={styles.title}>PayPal</span>
        </label>
      </fieldset>

      {amountMinor !== null && method === "card" && (
        <div className={styles.panel}>
          <TurnstileField action="store_payment" className={styles.captcha} />
          <CardGateway amountMinor={amountMinor} submitLabel={`Zaplatit ${money.format(amountMinor / 100)}`} onPaymentMethod={payByCard} />
        </div>
      )}
      {amountMinor !== null && (
        // Mounted even while hidden: Express Checkout reports device support only once it renders.
        <div className={method === "wallet" ? styles.walletBox : styles.hiddenWallet}>
          <WalletButton
            amountMinor={amountMinor}
            returnUrl={returnUrl}
            createIntent={async () => ({ clientSecret: await requestIntent("wallet") })}
            onAvailability={setWallet}
            onSuccess={() => goToSuccess(orderId)}
            onError={setError}
          />
        </div>
      )}
      {method === "paypal" && (
        <div className={styles.panel}>
          <PayPalButton createIntent={async () => ({ clientSecret: await requestIntent("paypal") })} returnUrl={returnUrl} onError={setError} />
        </div>
      )}
    </main>
  );
}
