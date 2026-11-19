import type { Metadata } from "next";
import { AnalyticsGate } from "@/components/analytics-gate";
import "./globals.css";
import "@/styles/tw-colors.css";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

// Písma self-hosted při buildu (next/font); latin-ext kvůli české diakritice.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

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
    <html lang="cs" className={`${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Ruční volba tématu se uplatní před prvním vykreslením (bez záblesku). Bez volby platí nastavení systému. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('vv-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}",
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <AnalyticsGate />
      </body>
    </html>
  );
}
