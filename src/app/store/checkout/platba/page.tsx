import { Suspense } from "react";
import { PaymentPage } from "@/components/store/payment-page";

export const metadata = { title: "Platba. VeVit Store", robots: { index: false } };

export default function StorePaymentRoute() {
  return (
    <Suspense fallback={<main className="store-main"><div className="store-empty">Připravuji platbu…</div></main>}>
      <PaymentPage />
    </Suspense>
  );
}
