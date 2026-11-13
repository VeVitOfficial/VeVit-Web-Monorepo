"use client";

// Chyba načtení obsahu AIFB (výpadek sítě, chyba serveru): srozumitelná zpráva a tlačítko
// „Zkusit znovu" místo prázdné stránky. Hranice chyb leží nad EduRoot, proto jazyk z <html lang>.

import { translate, EDU_SUPPORTED_LOCALES, type EduLocale } from "@/lib/edu/i18n-data";

function currentLocale(): EduLocale {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "cs";
  return (EDU_SUPPORTED_LOCALES as readonly string[]).includes(lang) ? (lang as EduLocale) : "cs";
}

export default function AifbError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = currentLocale();
  return (
    <div className="aigram aifb">
      <main className="aigram-main aifb-main" role="alert">
        <h1>{translate(locale, "aifb.error.title")}</h1>
        <p className="aifb-lead">{translate(locale, "aifb.error.body")}</p>
        <button type="button" className="btn btn-primary" onClick={reset}>{translate(locale, "aifb.error.retry")}</button>
      </main>
    </div>
  );
}
