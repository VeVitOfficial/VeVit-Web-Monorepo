import type { Metadata } from "next";
import type { Locale } from "@/components/tools/registry/data";

// Produkce přesměrovává apex (vevit.cz) na www.vevit.cz (308). Globální
// metadataBase v src/app/layout.tsx zůstává na apexu a je mimo scope téhle
// appky — kanonické URL nástrojů proto stavíme na absolutní adrese nezávisle
// na něm, ať nedědí špatný origin.
export const SITE_ORIGIN = "https://www.vevit.cz";

/**
 * `alternates` pro generateMetadata stránek /tools: canonical na aktuální
 * jazykovou cestu (libovolný podporovaný locale) + hreflang jen pro
 * cs/en/x-default, jak žádá zadání Fáze 1 (body 1-2) — ostatní locales
 * (de/es/uk/fr/sk) canonical dostanou, ale do hreflang sady nepatří.
 *
 * `toolPath` je cesta BEZ jazykového prefixu a bez úvodního/koncového lomítka,
 * např. "tools" pro hub nebo "tools/pdf-merge" pro nástroj.
 */
export function toolAlternates(locale: Locale, toolPath: string): Metadata["alternates"] {
  const url = (l: string) => `${SITE_ORIGIN}/${l}/${toolPath}`;

  return {
    canonical: url(locale),
    languages: {
      cs: url("cs"),
      en: url("en"),
      "x-default": url("cs"),
    },
  };
}
