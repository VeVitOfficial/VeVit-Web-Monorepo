"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/components/store/use-cart";

/** Entry point of the checkout: physical goods go to delivery and payment choice, digital-only carts to the details. */
export default function CheckoutEntryPage() {
  const router = useRouter();
  const items = useCart();
  const physical = items.some((item) => item.type === "physical");

  useEffect(() => {
    if (items.length > 0) router.replace(physical ? "/store/checkout/doprava" : "/store/checkout/udaje");
  }, [items.length, physical, router]);

  return (
    <main className="store-main">
      {items.length === 0
        ? <div className="store-empty"><h2>Košík je prázdný</h2><Link className="store-button primary" href="/store/catalog">Pokračovat v nákupu</Link></div>
        : <div className="store-empty">Pokračuji do pokladny…</div>}
    </main>
  );
}
