"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { analyticsAllowed, subscribeConsent } from "@/lib/consent";

// Pages with card fields run no analytics. Reaching them is always a full page load, so the
// scripts are never loaded there (see checkout/page.tsx).
const PAYMENT_PAGES = /(?:^|\/)(?:store\/checkout\/platba|account\/billing\/(?:platba|karta))(?:\/|$)/;

// AI gramotnost (AIFB) je určená i dětem a škole: žádná analytika třetích stran (pravidlo R3).
// Interní cesta je /edu/<locale>/ai-gramotnost (src/proxy.ts), veřejná /<locale>/edu/ai-gramotnost.
const NO_ANALYTICS_PAGES = /(?:^|\/)edu\/(?:[a-z]{2}\/)?ai-gramotnost(?:\/|$)/;

// Nástroje: analytika až po souhlasu v cookie liště (ConsentBanner, „Přijmout vše“).
const CONSENT_PAGES = /(?:^|\/)tools(?:\/|$)/;

// Skripty se po klientské navigaci z jiné stránky už mohly načíst; události z AIFB se proto
// zahazují i tady (nikdy se neodešlou).
function dropAifbEvents<T extends { url: string }>(event: T): T | null {
  try {
    const path = new URL(event.url, "https://www.vevit.cz").pathname;
    // Totéž pro nástroje bez souhlasu (skripty načtené na jiné stránce webu).
    if (CONSENT_PAGES.test(path) && !analyticsAllowed()) return null;
    return NO_ANALYTICS_PAGES.test(path) ? null : event;
  } catch {
    return event;
  }
}

export function AnalyticsGate() {
  const pathname = usePathname() ?? "";
  const allowed = useSyncExternalStore(subscribeConsent, analyticsAllowed, () => false);
  if (PAYMENT_PAGES.test(pathname) || NO_ANALYTICS_PAGES.test(pathname)) return null;
  if (CONSENT_PAGES.test(pathname) && !allowed) return null;
  return (
    <>
      <Analytics beforeSend={dropAifbEvents} />
      <SpeedInsights beforeSend={dropAifbEvents} />
    </>
  );
}
