import type { Metadata } from "next";
import { SiteHeader } from "@/components/tools/site-header";
import { SiteFooter } from "@/components/tools/site-footer";
import { HUB_I18N, SUPPORTED_LOCALES, type Locale } from "@/components/tools/registry/data";
import { termsFor } from "@/components/tools/terms-content";
import { toolAlternates } from "@/lib/tools-seo";

import "../../../../../public/assets/fonts/vevit-fonts.css";
import "@/styles/tools.css";
import "../../../../../public/assets/shared/app-switcher.css";

async function readLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const h = (await params).locale;
  return (SUPPORTED_LOCALES as readonly string[]).includes(h) ? (h as Locale) : "cs";
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await readLocale(params);
  return { title: `${termsFor(locale).title} | VeVit Tools`, alternates: toolAlternates(locale, "tools/podminky-uziti") };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await readLocale(params);
  const strings = HUB_I18N[locale] ?? HUB_I18N.cs;
  const t = termsFor(locale);
  return (
    <>
      <SiteHeader
        locale={locale}
        strings={{
          categories: strings.header_categories,
          login: strings.header_login,
          login_title: strings.header_login_title,
          brand_name: "VeVit",
          brand_suffix: "Tools",
        }}
      />
      <main className="main tool-page legal-page" suppressHydrationWarning>
        <nav className="breadcrumb">
          <a href={`/${locale}/tools`} className="hover-fg">{strings.header_categories}</a>
          <span className="sep">/</span>
          <span>{t.title}</span>
        </nav>
        <h1>{t.title}</h1>
        <p className="legal-effective">{t.effective}</p>
        <p className="legal-intro">{t.intro}</p>
        {t.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
          </section>
        ))}
      </main>
      <SiteFooter locale={locale} strings={{ back: strings.footer_back, privacy: strings.footer_privacy, copyright: strings.footer_copyright }} />
    </>
  );
}
