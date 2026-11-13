import { notFound } from "next/navigation";
import { ConsentBanner } from "@/components/tools/consent-banner";
import { SUPPORTED_LOCALES, type Locale } from "@/components/tools/registry/data";

// /tools/<locale>/*: locale je segment cesty (src/proxy.ts), stránky se generují staticky per jazyk.
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

// Společné pro všechny stránky nástrojů: lišta cookies + přijetí podmínek užití.
export default async function ToolsLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const value = (await params).locale;
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(value)) notFound();
  const locale = value as Locale;
  return (
    <>
      {children}
      <ConsentBanner locale={locale} />
    </>
  );
}
