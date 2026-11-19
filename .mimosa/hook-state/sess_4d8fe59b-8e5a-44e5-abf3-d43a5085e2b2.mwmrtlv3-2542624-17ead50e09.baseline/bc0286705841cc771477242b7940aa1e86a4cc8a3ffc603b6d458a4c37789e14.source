import { notFound } from "next/navigation";
import { ConsentBanner } from "@/components/tools/consent-banner";
import { SUPPORTED_LOCALES, type Locale } from "@/components/tools/registry/data";
import { etFontsClass } from "@/components/tools/fonts";

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
    // .tools-app — vizuální scope pro EveryTool.cz redesign (tokeny a et-* třídy
    // ve tools.css). Wraper je v layoutu, takž pokrývá hub, jednotlivé nástroje
    // i právní stránky; mimo tools se třída nevyskytuje.
    <div className={`tools-app ${etFontsClass}`}>
      {/* EveryTool.cz má výchozí světlý režim: pokud si uživatel nezvolil téma
          (data-theme z vv-theme v root layoutu), nastavíme light před prvním
          vykreslením. ThemeToggle pak běžně přepíná a volbu ukládá. Jiné
          aplikace monorepa vůči systémovému nastavení mění chování. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{var d=document.documentElement;if(d.getAttribute('data-theme')!=='light'&&d.getAttribute('data-theme')!=='dark')d.setAttribute('data-theme','light')}catch(e){}",
        }}
      />
      {children}
      <ConsentBanner locale={locale} />
    </div>
  );
}
