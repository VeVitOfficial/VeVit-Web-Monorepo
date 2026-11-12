"use client";

import Image from "next/image";
import Link from "next/link";
import { cartSubtotal, saveCart, type CartItem } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD_MINOR, SHIPPING_PRICES_MINOR, shippingMinor } from "@/lib/checkout/shipping";
import { money } from "@/lib/store-format";
import { useCart } from "@/components/store/use-cart";
import { useFreeShipping } from "@/components/store/use-free-shipping";
import { CheckoutSteps } from "@/components/store/checkout/checkout-steps";
import { Icon } from "@/components/store/icon";

export default function CartPage() {
  const items = useCart();
  function update(next: CartItem[]) { saveCart(next); }
  const setQty = (id: number, qty: number) => update(items.map((value) => value.id === id ? { ...value, qty: Math.min(99, Math.max(1, qty)) } : value));
  const subtotal = cartSubtotal(items);
  const savings = items.reduce((sum, item) => sum + Math.max(0, (item.original_price ?? item.price) - item.price) * item.qty, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const freeShipping = useFreeShipping();
  const hasPhysical = items.some((item) => item.type === "physical");
  // The method is chosen in the next step; the cart only says whether shipping is free or what it starts at.
  const cheapest = hasPhysical ? shippingMinor({ method: "packeta_pickup", hasPhysical, subtotalMinor: Math.round(subtotal * 100), freePerk: freeShipping }) : 0;
  const shippingLabel = !hasPhysical ? "Digitální zboží" : cheapest === 0 ? (freeShipping ? "Zdarma · Premium" : "Zdarma") : `od ${money.format(SHIPPING_PRICES_MINOR.packeta_pickup / 100)}`;
  const threshold = FREE_SHIPPING_THRESHOLD_MINOR / 100;
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <main className="sf-main" id="main-content">
      <CheckoutSteps current={1} />
      <div className="sf-page-head">
        <h1>Košík {count > 0 ? <span className="sf-muted">({count} {count === 1 ? "položka" : count <= 4 ? "položky" : "položek"})</span> : null}</h1>
      </div>

      {!items.length ? (
        <div className="sf-empty sf-empty--cart">
          <Icon name="shopping_bag" className="sf-empty__icon" />
          <h2>Košík je prázdný</h2>
          <p>Vyberte si z katalogu elektroniky, školních a kancelářských potřeb.</p>
          <Link className="sf-btn sf-btn--buy" href="/store/catalog">Pokračovat v nákupu</Link>
        </div>
      ) : (
        <div className="sf-cart">
          <section aria-label="Položky v košíku">
            {hasPhysical && !freeShipping && (
              <div className={`sf-freeship${remaining === 0 ? " is-done" : ""}`}>
                <p>
                  <Icon name="local_shipping" />
                  {remaining === 0
                    ? <span><b>Máte dopravu zdarma.</b></span>
                    : <span>Nakupte ještě za <b>{money.format(remaining)}</b> a máte dopravu zdarma.</span>}
                </p>
                <div className="sf-freeship__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Do dopravy zdarma"><span style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            <ul className="sf-cart__list">
              {items.map((item) => {
                const href = `/store/product/${encodeURIComponent(item.slug)}`;
                return (
                  <li className="sf-cart-item" key={item.id}>
                    <Link href={href} className="sf-cart-item__media" tabIndex={-1} aria-hidden="true">
                      {item.image ? <Image src={item.image} alt="" fill sizes="88px" /> : <span className="sf-card__placeholder">VeVit</span>}
                    </Link>
                    <div className="sf-cart-item__info">
                      <Link href={href} className="sf-cart-item__name">{item.name}</Link>
                      <p className="sf-muted">
                        {item.type === "digital" ? "Digitální produkt · ihned ke stažení" : "Fyzický produkt"} · {money.format(item.price)} / ks
                      </p>
                    </div>
                    <div className="sf-qty" role="group" aria-label={`Množství ${item.name}`}>
                      <button type="button" onClick={() => setQty(item.id, item.qty - 1)} aria-label="Snížit množství" disabled={item.qty <= 1}>−</button>
                      <output aria-live="polite">{item.qty}</output>
                      <button type="button" onClick={() => setQty(item.id, item.qty + 1)} aria-label="Zvýšit množství">+</button>
                    </div>
                    <div className="sf-cart-item__total">
                      <strong>{money.format(item.price * item.qty)}</strong>
                      {item.original_price > item.price ? <s>{money.format(item.original_price * item.qty)}</s> : null}
                    </div>
                    <button className="sf-icon-btn" type="button" aria-label={`Odstranit ${item.name}`} onClick={() => update(items.filter((value) => value.id !== item.id))}>
                      <Icon name="close" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link className="sf-link" href="/store/catalog">← Pokračovat v nákupu</Link>
          </section>

          <aside className="sf-summary" aria-label="Souhrn objednávky">
            <h2>Souhrn objednávky</h2>
            <dl>
              <div><dt>Zboží ({count} ks)</dt><dd>{money.format(subtotal)}</dd></div>
              {savings > 0 ? <div className="is-saving"><dt>Ušetříte</dt><dd>−{money.format(savings)}</dd></div> : null}
              <div><dt>Doprava</dt><dd>{shippingLabel}</dd></div>
              <div className="sf-summary__total"><dt>{hasPhysical && cheapest > 0 ? "Celkem od" : "Celkem"} <small>vč. DPH</small></dt><dd>{money.format(subtotal + (hasPhysical ? cheapest / 100 : 0))}</dd></div>
            </dl>
            {hasPhysical && cheapest > 0 ? <p className="sf-muted sf-summary__note">Způsob dopravy vyberete v dalším kroku.</p> : null}
            <Link className="sf-btn sf-btn--buy sf-btn--lg sf-btn--block" href="/store/checkout">Pokračovat k dopravě <span aria-hidden="true">→</span></Link>
            <ul className="sf-summary__trust">
              <li><Icon name="lock" /> Bezpečná platba</li>
              <li><Icon name="currency_exchange" /> Faktura s DPH</li>
              <li><Icon name="replay" /> 14 dní na vrácení</li>
            </ul>
          </aside>
        </div>
      )}
    </main>
  );
}
