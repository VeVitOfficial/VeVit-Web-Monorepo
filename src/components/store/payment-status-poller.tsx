"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const INTERVAL_MS = 2000;
const MAX_WAIT_MS = 30_000;
const SETTLED = new Set(["paid", "failed", "manual_review", "cancelled", "refunded"]);

/** Re-renders the server page once the webhook has moved the order out of a waiting state. */
export function PaymentStatusPoller({ orderId }: { orderId: string }) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    const startedAt = Date.now();
    const tick = async () => {
      if (stopped || Date.now() - startedAt > MAX_WAIT_MS) return;
      try {
        const response = await fetch(`/store/api/payment-status.php?order=${encodeURIComponent(orderId)}`, { cache: "no-store", credentials: "same-origin" });
        const json = (await response.json()) as { payment_status?: string };
        if (response.ok && json.payment_status && SETTLED.has(json.payment_status)) {
          router.refresh();
          return;
        }
      } catch {
        // Keep polling; the page already explains the state.
      }
      setTimeout(tick, INTERVAL_MS);
    };
    const timer = setTimeout(tick, INTERVAL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [orderId, router]);

  return null;
}
