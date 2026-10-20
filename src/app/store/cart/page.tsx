"use client";

import Link from "next/link";
import { cartSubtotal, saveCart, type CartItem } from "@/lib/cart";
import { SHIPPING_PRICES_MINOR, shippingMinor } from "@/lib/checkout/shipping";
import { useCart } from "@/components/store/use-cart";
import { useFreeShipping } from "@/components/store/use-free-shipping";
import { CheckoutSteps } from "@/components/store/checkout/checkout-steps";

const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

export default function CartPage() {
  const items = useCart();
  function update(next: CartItem[]) { saveCart(next); }
  const subtotal = cartSubtotal(items);
  const freeShipping = useFreeShipping();
  const hasPhysical = items.some((item) => item.type === "physical");
  // The method is chosen in the next step; the cart only says whether shipping is free or what it starts at.
  const cheapest = hasPhysical ? shippingMinor({ method: "packeta_pickup", hasPhysical, subtotalMinor: Math.round(subtotal * 100), freePerk: freeShipping }) : 0;
  const shippingLabel = !hasPhysical ? "Digitální zboží" : cheapest === 0 ? (freeShipping ? "Zdarma · výhoda Premium" : "Zdarma") : `od ${money.format(SHIPPING_PRICES_MINOR.packeta_pickup / 100)} · vybereš v dalším kroku`;
  return (
    <main className="store-main">
      <CheckoutSteps current={1} />
      <div className="store-section-head"><div><h1>Košík</h1></div></div>
      {!items.length ? <div className="store-empty"><h2>Košík je prázdný</h2><Link className="store-button primary" href="/store/catalog">Pokračovat v nákupu</Link></div> : (
        <div className="store-checkout-grid">
          <section className="store-cart-list">{items.map((item) => <article className="store-cart-item" key={item.id}><div><p className="store-eyebrow">{item.type === "digital" ? "Digitální" : "Fyzický"}</p><h2>{item.name}</h2><span>{money.format(item.price)} / ks</span></div><div className="store-qty"><button onClick={() => update(items.map((value) => value.id === item.id ? { ...value, qty: Math.max(1, value.qty - 1) } : value))}>−</button><span>{item.qty}</span><button onClick={() => update(items.map((value) => value.id === item.id ? { ...value, qty: value.qty + 1 } : value))}>+</button><button aria-label={`Odstranit ${item.name}`} onClick={() => update(items.filter((value) => value.id !== item.id))}>×</button></div></article>)}</section>
          <aside className="store-summary"><h2>Souhrn</h2><p><span>Mezisoučet</span><strong>{money.format(subtotal)}</strong></p><p><span>Doprava</span><strong>{shippingLabel}</strong></p><Link className="store-button primary" href="/store/checkout">Pokračovat</Link></aside>
        </div>
      )}
    </main>
  );
}
