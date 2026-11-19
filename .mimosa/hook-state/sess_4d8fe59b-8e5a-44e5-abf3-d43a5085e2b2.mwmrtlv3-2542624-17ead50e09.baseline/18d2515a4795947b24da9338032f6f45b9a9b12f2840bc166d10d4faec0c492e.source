// Sdílené formátování a odvozené stavy produktu pro storefront (server i klient).

export const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

type AvailabilityInput = {
  type: "physical" | "digital";
  stock: number | null;
  is_sellable?: boolean | null;
  allow_backorder?: boolean | null;
};

export type Availability = {
  tone: "ok" | "warn" | "muted" | "bad";
  label: string;
  detail: string;
  buyable: boolean;
};

/** Dostupnost jako na Alze: jedna barevná řádka + krátké upřesnění. */
export function availability(product: AvailabilityInput): Availability {
  if (product.is_sellable === false) {
    return { tone: "muted", label: "Připravujeme", detail: "Produkt brzy naskladníme, cena je orientační.", buyable: false };
  }
  if (product.type === "digital") {
    return { tone: "ok", label: "Ihned ke stažení", detail: "Odkaz ke stažení obdržíte hned po zaplacení.", buyable: true };
  }
  if (product.stock == null || product.stock > 5) {
    return { tone: "ok", label: product.stock == null ? "Skladem" : "Skladem > 5 ks", detail: "Připraveno k odeslání z EU skladu.", buyable: true };
  }
  if (product.stock > 0) {
    return { tone: "ok", label: `Skladem ${product.stock} ks`, detail: "Připraveno k odeslání z EU skladu.", buyable: true };
  }
  if (product.allow_backorder) {
    return { tone: "warn", label: "Na objednávku", detail: "Zboží objednáme u dodavatele, termín upřesníme e-mailem.", buyable: true };
  }
  return { tone: "bad", label: "Vyprodáno", detail: "Momentálně nedostupné.", buyable: false };
}

/** Sleva v procentech (zaokrouhleno dolů), nebo null. */
export function discountPercent(price: number, salePrice: number | null) {
  if (salePrice == null || salePrice >= price || price <= 0) return null;
  return Math.floor(((price - salePrice) / price) * 100);
}

/** Cena bez DPH pro B2B zákazníky. */
export function priceWithoutVat(price: number, vatRate = 21) {
  return price / (1 + vatRate / 100);
}
