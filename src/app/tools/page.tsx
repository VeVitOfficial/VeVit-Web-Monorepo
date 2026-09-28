import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/tools/site-header";
import { SiteFooter } from "@/components/tools/site-footer";
import { HubApp } from "@/components/tools/hub-app";
import { HUB_I18N, SUPPORTED_LOCALES, type Locale } from "@/components/tools/registry/data";
import { toolAlternates } from "@/lib/tools-seo";

// Legacy CSS — className v komponentách zůstávají totožné s legacy HTML,
// aby src/styles/tools.css a vevit-fonts.css styl fungoval.
import "../../../public/assets/fonts/vevit-fonts.css";
import "@/styles/tools.css";
// Přepínač aplikací (data-vevit-app-switcher) — stejné styly jako ostatní aplikace.
import "../../../public/assets/shared/app-switcher.css";

async function readLocale(): Promise<Locale> {
  const h = (await headers()).get("x-vv-locale");
  return h && (SUPPORTED_LOCALES as readonly string[]).includes(h) ? (h as Locale) : "cs";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocale();
  const s = HUB_I18N[locale] ?? HUB_I18N.cs;
  return { title: s.doc_title, description: s.doc_description, alternates: toolAlternates(locale, "tools") };
}

export default async function ToolsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const locale = await readLocale();
  const sp = await searchParams;
  const strings = HUB_I18N[locale] ?? HUB_I18N.cs;
  return (
    // .tools-hub — vizuální scope pro redesign hlavní stránky nástrojů
    // (viz tools-hub blok ve style.css). Ostatní stránky (jednotlivé nástroje)
    // sdílejí SiteHeader/SiteFooter beze změny, tenhle wrapper je nezasahuje.
    <div className="tools-hub">
      <SiteHeader
        locale={locale}
        strings={{
          categories: strings.header_categories,
          newest: strings.header_newest,
          login: strings.header_login,
          login_title: strings.header_login_title,
          brand_name: "VeVit",
          brand_suffix: "Tools",
        }}
      />
      <HubApp locale={locale} initialSearchParams={sp} strings={strings} />
      <SiteFooter locale={locale} strings={{ back: strings.footer_back, privacy: strings.footer_privacy, copyright: strings.footer_copyright }} />
    </div>
  );
}