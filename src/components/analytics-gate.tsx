"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";

// Pages with card fields run no analytics. Reaching them is always a full page load, so the
// scripts are never loaded there (see checkout/page.tsx).
const PAYMENT_PAGES = /(?:^|\/)(?:store\/checkout\/platba|account\/billing\/(?:platba|karta))(?:\/|$)/;

// AI gramotnost (AIFB) je určená i dětem a škole: žádná analytika třetích stran (pravidlo R3).
const NO_ANALYTICS_PAGES = /(?:^|\/)edu\/ai-gramotnost(?:\/|$)/;

// Skripty se po klientské navigaci z jiné stránky už mohly načíst; události z AIFB se proto
// zahazují i tady (nikdy se neodešlou).
function dropAifbEvents<T extends { url: string }>(event: T): T | null {
  try {
    return NO_ANALYTICS_PAGES.test(new URL(event.url, "https://www.vevit.cz").pathname) ? null : event;
  } catch {
    return event;
  }
}

export function AnalyticsGate() {
  const pathname = usePathname() ?? "";
  if (PAYMENT_PAGES.test(pathname) || NO_ANALYTICS_PAGES.test(pathname)) return null;
  return (
    <>
      <Analytics beforeSend={dropAifbEvents} />
      <SpeedInsights beforeSend={dropAifbEvents} />
    </>
  );
}
