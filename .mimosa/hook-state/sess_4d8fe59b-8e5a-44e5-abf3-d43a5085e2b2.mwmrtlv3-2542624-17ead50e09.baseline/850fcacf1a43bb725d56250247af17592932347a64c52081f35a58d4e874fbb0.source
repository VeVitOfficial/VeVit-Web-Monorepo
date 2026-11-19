"use client";

import { useEffect, useRef } from "react";
import { declineMessage } from "@/lib/payments/decline-messages";
import { getStripe } from "./stripe-client";

export type WalletAvailability = { applePay: boolean; googlePay: boolean };

type Props = {
  amountMinor: number;
  createIntent: () => Promise<{ clientSecret: string }>;
  returnUrl: string;
  onAvailability: (available: WalletAvailability) => void;
  /** Payment confirmed without a redirect. "Paid" is still decided by the webhook, not here. */
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

const GENERIC_ERROR = "Platbu se nepodařilo dokončit. Zkus to znovu nebo zvol jiný způsob platby.";

/** Apple Pay / Google Pay through Stripe's Express Checkout Element (card wallets only). */
export function WalletButton({ amountMinor, createIntent, returnUrl, onAvailability, onSuccess, onError }: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const latest = useRef({ createIntent, returnUrl, onAvailability, onSuccess, onError });

  useEffect(() => {
    latest.current = { createIntent, returnUrl, onAvailability, onSuccess, onError };
  });

  useEffect(() => {
    const mountPoint = container.current;
    if (!mountPoint) return;
    let cancelled = false;
    let destroy: (() => void) | null = null;

    void getStripe().then((stripe) => {
      if (!stripe || cancelled) {
        latest.current.onAvailability({ applePay: false, googlePay: false });
        return;
      }
      const elements = stripe.elements({ mode: "payment", amount: amountMinor, currency: "czk", allowedPaymentMethodTypes: ["card"] });
      const button = elements.create("expressCheckout", {
        paymentMethods: { applePay: "auto", googlePay: "auto", link: "never", paypal: "never", amazonPay: "never", klarna: "never" },
      });
      button.on("availablepaymentmethodschange", (event) => {
        latest.current.onAvailability({
          applePay: event.paymentMethods?.applePay?.available === true,
          googlePay: event.paymentMethods?.googlePay?.available === true,
        });
      });
      button.on("confirm", async (event) => {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          event.paymentFailed({ reason: "fail" });
          return;
        }
        let clientSecret: string;
        try {
          ({ clientSecret } = await latest.current.createIntent());
        } catch (reason) {
          event.paymentFailed({ reason: "fail" });
          latest.current.onError?.(reason instanceof Error ? reason.message : GENERIC_ERROR);
          return;
        }
        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: { return_url: latest.current.returnUrl },
          redirect: "if_required",
        });
        if (error) {
          latest.current.onError?.(declineMessage(error.decline_code ?? error.code));
          return;
        }
        latest.current.onSuccess?.();
      });
      button.mount(mountPoint);
      destroy = () => button.destroy();
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [amountMinor]);

  return <div ref={container} />;
}
