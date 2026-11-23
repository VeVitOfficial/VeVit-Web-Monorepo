"use client";

import { useEffect, useState } from "react";
import { getStripe } from "@/components/payments/stripe-client";

export type WalletSupport = { applePay: boolean; googlePay: boolean };

/**
 * Whether this device can pay with Apple Pay / Google Pay. null while Stripe is still answering.
 * The amount is a placeholder: only device support is asked here, the real payment is created later.
 */
export function useWalletSupport(): WalletSupport | null {
  const [support, setSupport] = useState<WalletSupport | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      let result: WalletSupport = { applePay: false, googlePay: false };
      try {
        const stripe = await getStripe();
        if (stripe) {
          const request = stripe.paymentRequest({ country: "CZ", currency: "czk", total: { label: "VeVit Store", amount: 100 } });
          const can = await request.canMakePayment();
          result = { applePay: can?.applePay === true, googlePay: can?.googlePay === true };
        }
      } catch {
        // Treated as "not available": the customer can still pay by card or PayPal.
      }
      if (active) setSupport(result);
    })();
    return () => {
      active = false;
    };
  }, []);
  return support;
}
