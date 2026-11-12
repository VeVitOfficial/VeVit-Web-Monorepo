import { headers } from "next/headers";
import { ConsentBanner } from "@/components/tools/consent-banner";
import { SUPPORTED_LOCALES, type Locale } from "@/components/tools/registry/data";

// Společné pro všechny stránky nástrojů: lišta cookies + přijetí podmínek užití.
export default async function ToolsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const h = (await headers()).get("x-vv-locale");
  const locale: Locale = h && (SUPPORTED_LOCALES as readonly string[]).includes(h) ? (h as Locale) : "cs";
  return (
    <>
      {children}
      <ConsentBanner locale={locale} />
    </>
  );
}
