// Tarify VeVit Premium — jediný zdroj dat pro domovskou stránku (#premium),
// hub nástrojů EveryTool.cz a další místa, kde se ceny/výhody ukazují.
// Zdroj pravdy pro skutečné platby zůstává DB (tiers/tier_prices) a
// /account/api/billing/plans.php; tady žije prezentační kopie pro veřejné
// stránky. Při změně cen v DB aktualizujte i tohle.

export type VevitTierKey = "bronze" | "silver" | "gold";

export interface VevitTier {
  key: VevitTierKey;
  name: string;
  /** Cena za měsíc v Kč (číslo pro výpočty). */
  monthly: number;
  /** Cena za rok v Kč. */
  yearly: number;
  /** Formátovaný roční cenový štítek ("990", "1 990"). */
  yearlyLabel: string;
  /** alternativní řádek u měsíční ceny ("nebo 990 Kč / rok"). */
  altMonthly: string;
  perks: string[];
  /** Štítek karty ("Nejvíc výhod"), jen pokud má tier zvýraznění. */
  pin?: string;
}

export const VEVIT_TIERS: readonly VevitTier[] = [
  {
    key: "bronze",
    name: "Bronze",
    monthly: 99,
    yearly: 990,
    yearlyLabel: "990",
    altMonthly: "nebo 990 Kč / rok",
    perks: [
      "Bez reklam",
      "Vybrané Premium kurzy v Edu",
      "50 AI dotazů denně",
      "5 % sleva ve VeVit Store",
      "+10 % XP za aktivitu",
    ],
  },
  {
    key: "silver",
    name: "Silver",
    monthly: 199,
    yearly: 1990,
    yearlyLabel: "1 990",
    altMonthly: "nebo 1 990 Kč / rok",
    perks: [
      "Všechny Premium kurzy v Edu",
      "Lekce offline a certifikáty",
      "200 AI dotazů denně",
      "10 % sleva ve VeVit Store",
      "Doprava ve VeVit Store zdarma",
      "+25 % XP za aktivitu",
    ],
  },
  {
    key: "gold",
    name: "Gold",
    monthly: 399,
    yearly: 3990,
    yearlyLabel: "3 990",
    altMonthly: "nebo 3 990 Kč / rok",
    pin: "Nejvíc výhod",
    perks: [
      "Vše ze Silver",
      "AI bez denního limitu",
      "Prioritní podpora a beta funkce dřív",
      "20 % sleva ve VeVit Store",
      "+50 % XP za aktivitu",
    ],
  },
];

/** Platinum — školy a firmy, cena na domluvu (není v plans API). */
export const VEVIT_PLATINUM = {
  name: "Platinum",
  priceLabel: "Na domluvu",
  periodLabel: "cena podle počtu licencí",
  ctaLabel: "Napsat poptávku",
  ctaHref: "mailto:info@vevit.cz?subject=VEVIT%20Platinum%20%E2%80%93%20popt%C3%A1vka",
  perks: [
    "Vše z Gold pro celou organizaci",
    "Třídy, učitelé a přehled pokroku",
    "Vlastní kurzy a obsah na míru",
    "Faktura na převod, smlouva",
    "Vlastní kontakt a školení",
  ],
} as const;

/** Formát "2 měsíce zdarma" — výhoda roční platby (12× měsíční − roční). */
export const YEARLY_BENEFIT_LABEL = "2 měsíce zdarma";
