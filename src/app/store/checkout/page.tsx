"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { cartShipping, cartSubtotal } from "@/lib/cart";
import { useCart } from "@/components/store/use-cart";

const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const physical = items.some((item) => item.type === "physical");
  const total = cartSubtotal(items) + cartShipping(items);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) { router.push("/store/cart"); return; }
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const idempotencyKey = crypto.randomUUID();
    const payload = {
      items: items.map((item) => ({ product_id: item.id, quantity: item.qty })),
      idempotency_key: idempotencyKey,
      name: form.get("name"), email: form.get("email"), notes: form.get("notes"),
      shipping: physical ? { street: form.get("street"), city: form.get("city"), zip: form.get("zip"), country: form.get("country") } : null
    };
    try {
      const snapshotResponse = await fetch("/store/api/create-checkout.php", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify(payload) });
      const snapshot = await snapshotResponse.json();
      if (!snapshotResponse.ok || !snapshot.checkout?.id) throw new Error(snapshot.error?.message ?? "Objednávku se nepodařilo připravit.");
      const paymentResponse = await fetch("/store/api/create-payment.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshot: snapshot.checkout.id }) });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok || !payment.url) throw new Error(payment.error?.message ?? "Platbu se nepodařilo připravit.");
      window.location.assign(payment.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Služba je dočasně nedostupná.");
      setBusy(false);
    }
  }

  return (
    <main className="store-main">
      <div className="store-section-head"><div><p className="store-eyebrow">2 / 2</p><h1>Pokladna</h1></div></div>
      {!items.length ? <div className="store-empty">Načítám košík…</div> : <form className="store-checkout-grid" onSubmit={submit}>
        <section className="store-form"><h2>Kontaktní údaje</h2><label>Jméno a příjmení<input required name="name" autoComplete="name" /></label><label>E-mail<input required type="email" name="email" autoComplete="email" /></label>{physical && <><h2>Doručovací adresa</h2><label>Ulice<input required name="street" autoComplete="street-address" /></label><div className="store-form-row"><label>Město<input required name="city" autoComplete="address-level2" /></label><label>PSČ<input required name="zip" autoComplete="postal-code" /></label></div><label>Země<select name="country"><option value="CZ">Česko</option><option value="SK">Slovensko</option></select></label></>}<label>Poznámka<textarea name="notes" rows={4} /></label></section>
        <aside className="store-summary"><h2>Objednávka</h2>{items.map((item) => <p key={item.id}><span>{item.qty}× {item.name}</span><strong>{money.format(item.price * item.qty)}</strong></p>)}<p className="total"><span>Celkem</span><strong>{money.format(total)}</strong></p>{error && <p className="store-error" role="alert">{error}</p>}<button className="store-button primary" disabled={busy} type="submit">{busy ? "Připravuji platbu…" : "Zaplatit přes Stripe"}</button></aside>
      </form>}
    </main>
  );
}
