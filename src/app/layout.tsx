import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vevit.cz";

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
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
