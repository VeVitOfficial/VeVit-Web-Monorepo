import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// Produkce přesměrovává apex (vevit.cz) na www.vevit.cz (308) — metadataBase
// musí ukazovat na kanonickou doménu, jinak z ní odvozené relativní URL
// (og:image, canonical přes alternates: { canonical: "/" } níže) míří na
// adresu, která se přesměruje, místo na finální URL. Viz src/lib/tools-seo.ts.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vevit.cz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "VeVit", template: "%s | VeVit" },
  description: "Nástroje, vzdělávání a digitální služby VeVit.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
