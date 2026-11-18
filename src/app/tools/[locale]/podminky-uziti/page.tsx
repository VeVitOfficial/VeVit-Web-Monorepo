import type { Metadata } from "next";
import { LegalHeader, LegalDocView } from "@/components/tools/legal-page";
import { SUPPORTED_LOCALES, type Locale } from "@/components/tools/registry/data";
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
  return { title: `${termsFor(locale).title} | EveryTool.cz`, alternates: toolAlternates(locale, "tools/podminky-uziti") };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await readLocale(params);
  return (
    <>
      <LegalHeader locale={locale} />
      <LegalDocView locale={locale} doc={termsFor(locale)} />
    </>
  );
}
