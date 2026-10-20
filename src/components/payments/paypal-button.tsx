"use client";

import { useState } from "react";
import { BRAND_LOGOS } from "@/lib/payments/card-banks";
import { getStripe } from "./stripe-client";

type Props = {
  createIntent: () => Promise<{ clientSecret: string }>;
  returnUrl: string;
  onError?: (message: string) => void;
};

const GENERIC_ERROR = "Platbu přes PayPal se nepodařilo zahájit. Zkus to znovu nebo zvol jiný způsob platby.";

/** Redirects to PayPal through Stripe; the customer returns to returnUrl and the webhook confirms. */
export function PayPalButton({ createIntent, returnUrl, onError }: Props) {
  const [busy, setBusy] = useState(false);

  async function start() {
    if (busy) return;
    setBusy(true);
    try {
      const stripe = await getStripe();
      if (!stripe) throw new Error(GENERIC_ERROR);
      const { clientSecret } = await createIntent();
      const { error } = await stripe.confirmPayPalPayment(clientSecret, { return_url: returnUrl });
      // On success the browser has already been redirected; only failures come back here.
      if (error) throw new Error(GENERIC_ERROR);
    } catch (reason) {
      onError?.(reason instanceof Error ? reason.message : GENERIC_ERROR);
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={busy}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: 13, fontSize: 16, fontWeight: 700, border: 0, borderRadius: 12, background: "#ffc439", color: "#111", cursor: busy ? "wait" : "pointer" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src={BRAND_LOGOS.paypal} height={20} />
      {busy ? "Přesměrovávám na PayPal…" : "Zaplatit přes PayPal"}
    </button>
  );
}
