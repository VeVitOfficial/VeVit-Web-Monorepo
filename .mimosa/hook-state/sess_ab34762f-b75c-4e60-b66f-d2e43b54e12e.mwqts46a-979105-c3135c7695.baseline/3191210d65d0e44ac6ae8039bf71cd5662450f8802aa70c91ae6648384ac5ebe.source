"use client";

import { cartSubtotal } from "@/lib/cart";
import { missingForFreeShippingMinor, FREE_SHIPPING_THRESHOLD_MINOR, shippingMinor, type DeliveryMethod } from "@/lib/checkout/shipping";
import { useCart } from "@/components/store/use-cart";
import { useFreeShipping } from "@/components/store/use-free-shipping";

const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
const czk = (minor: number) => money.format(minor / 100);

type Props = {
  shippingMethod: DeliveryMethod | null;
  paymentLabel: string | null;
  deliveryLabel?: string | null;
  /** Informational VAT line for company purchases (prices already include VAT). */
  showVat?: boolean;
  children?: React.ReactNode;
};

/** Order summary with the free-shipping progress bar. Display only: the server recomputes the real price. */
export function CheckoutSummary({ shippingMethod, paymentLabel, deliveryLabel = null, showVat = false, children }: Props) {
  const items = useCart();
  const freePerk = useFreeShipping();
  const hasPhysical = items.some((item) => item.type === "physical");
  const subtotalMinor = Math.round(cartSubtotal(items) * 100);
  const chosen = !hasPhysical || shippingMethod !== null;
  const shipping = chosen ? shippingMinor({ method: shippingMethod, hasPhysical, subtotalMinor, freePerk }) : 0;
  const missing = missingForFreeShippingMinor(subtotalMinor);
  const progress = Math.min(100, Math.round((subtotalMinor / FREE_SHIPPING_THRESHOLD_MINOR) * 100));
  const totalMinor = subtotalMinor + shipping;
  // Prices include 21 % VAT (informational only; the invoice states the real rates).
  const vatMinor = Math.round((totalMinor * 21) / 121);

  return (
    <aside className="store-summary">
      <h2>Souhrn</h2>
      {items.map((item) => (
        <p key={item.id}><span>{item.qty}× {item.name}</span><strong>{money.format(item.price * item.qty)}</strong></p>
      ))}
      <p><span>Mezisoučet</span><strong>{czk(subtotalMinor)}</strong></p>
      {hasPhysical && (
        <p>
          <span>Doprava{deliveryLabel ? ` · ${deliveryLabel}` : ""}</span>
          <strong>{!chosen ? "vyber" : shipping === 0 ? "zdarma" : czk(shipping)}</strong>
        </p>
      )}
      {paymentLabel && <p><span>Platba</span><strong>{paymentLabel}</strong></p>}
      <p className="total"><span>Celkem</span><strong>{czk(totalMinor)}</strong></p>
      {showVat && <p className="store-note"><span>z toho DPH 21 %</span><span>{czk(vatMinor)}</span></p>}
      {hasPhysical && !freePerk && (
        <div className="store-free">
          {missing === 0 ? "Máš dopravu zdarma." : `Nakup ještě za ${czk(missing)} a máš dopravu zdarma.`}
          <div className="store-bar"><i style={{ width: `${progress}%` }} /></div>
        </div>
      )}
      {hasPhysical && freePerk && <p className="store-note">Doprava zdarma je výhoda tvého členství Premium.</p>}
      {children}
    </aside>
  );
}
