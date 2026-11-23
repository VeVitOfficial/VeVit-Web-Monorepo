"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readCart, saveCart } from "@/lib/cart";
import type { StoreProduct } from "@/lib/store-data";
import { Icon } from "@/components/store/icon";

type Props = {
  product: StoreProduct;
  image?: string | null;
  /** Kompaktní tlačítko na kartě produktu: přidá bez přesměrování. */
  compact?: boolean;
  disabled?: boolean;
  /** Na detailu produktu: volič množství vedle tlačítka. */
  withQuantity?: boolean;
};

export function AddToCart({ product, image = null, compact = false, disabled = false, withQuantity = false }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function add() {
    if (disabled) return;
    const items = readCart();
    const existing = items.find((item) => item.id === product.id);
    if (existing) existing.qty += qty;
    else items.push({
      id: product.id,
      name: product.name,
      price: product.sale_price ?? product.price,
      original_price: product.price,
      type: product.type,
      slug: product.slug,
      qty,
      image
    });
    saveCart(items);
    if (compact) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
      return;
    }
    router.push("/store/cart");
  }

  if (compact) {
    return (
      <button
        className={`sf-btn sf-btn--buy sf-btn--sm${added ? " is-added" : ""}`}
        type="button"
        onClick={add}
        disabled={disabled}
        aria-label={disabled ? `${product.name} zatím nelze koupit` : `Přidat ${product.name} do košíku`}
      >
        <Icon name={added ? "check_circle" : "shopping_bag"} />
        <span>{disabled ? "Brzy" : added ? "V košíku" : "Koupit"}</span>
      </button>
    );
  }

  return (
    <div className="sf-buy-row">
      {withQuantity && !disabled && (
        <div className="sf-qty" role="group" aria-label="Množství">
          <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Snížit množství">−</button>
          <output aria-live="polite">{qty}</output>
          <button type="button" onClick={() => setQty((value) => Math.min(99, value + 1))} aria-label="Zvýšit množství">+</button>
        </div>
      )}
      <button className="sf-btn sf-btn--buy sf-btn--lg" type="button" onClick={add} disabled={disabled}>
        <Icon name="shopping_bag" />
        <span>{disabled ? "Zatím nelze koupit" : "Přidat do košíku"}</span>
      </button>
    </div>
  );
}
