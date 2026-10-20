"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";

// Pages with card fields run no analytics. Reaching them is always a full page load, so the
// scripts are never loaded there (see checkout/page.tsx).
const PAYMENT_PAGES = /(?:^|\/)(?:store\/checkout\/platba|account\/billing\/(?:platba|karta))(?:\/|$)/;

export function AnalyticsGate() {
  const pathname = usePathname() ?? "";
  if (PAYMENT_PAGES.test(pathname)) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
