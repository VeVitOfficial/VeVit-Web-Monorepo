"use client";

// Lišta cookies + přijetí podmínek užití (stránky nástrojů). Obě tlačítka přijímají podmínky;
// liší se jen tím, jestli smí běžet anonymní analytika — souhlas s ní není podmínkou použití
// nástrojů (GDPR / ePrivacy: souhlas nesmí být vázaný na službu).
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/components/tools/registry/data";
import { consentNeeded, onOpenConsent, openConsent, saveConsent, subscribeConsent } from "@/lib/consent";

const STRINGS = {
  cs: {
    title: "Dáte si sušenku?",
    body: "Nezbytné úložiště v prohlížeči používáme, aby web fungoval (motiv, jazyk, oblíbené nástroje a tahle volba). S vaším souhlasem zapneme i anonymní měření návštěvnosti a rychlosti webu (Vercel Analytics). AI a serverové nástroje zpracovávají vstupy na serverech AWS.",
    terms_pre: "Kliknutím na kterékoli tlačítko přijímáte ",
    terms: "Podmínky užití",
    terms_post: ".",
    accept: "Přijmout vše",
    necessary: "Jen nezbytné",
    settings: "Nastavení cookies",
  },
  en: {
    title: "Fancy a cookie?",
    body: "We use essential browser storage to make the site work (theme, language, favourite tools and this choice). With your consent we also turn on anonymous traffic and speed measurement (Vercel Analytics). AI and server-side tools process inputs on AWS servers.",
    terms_pre: "By clicking either button you accept the ",
    terms: "Terms of Use",
    terms_post: ".",
    accept: "Accept all",
    necessary: "Essential only",
    settings: "Cookie settings",
  },
};
const strings = (locale: Locale) => (locale === "cs" || locale === "sk" ? STRINGS.cs : STRINGS.en);

const noop = () => () => {};

export function ConsentBanner({ locale }: { locale: Locale }) {
  // Na serveru lištu nevykreslujeme (volba je jen v prohlížeči); po hydrataci se ukáže, když chybí.
  const needed = useSyncExternalStore(subscribeConsent, consentNeeded, () => false);
  const [reopened, setReopened] = useState(false);
  useEffect(() => onOpenConsent(() => setReopened(true)), []);
  // Před hydratací (a na serveru) nic — žádný záblesk lišty u toho, kdo už zvolil.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  if (!hydrated || (!needed && !reopened)) return null;

  const s = strings(locale);
  const choose = (analytics: boolean) => { saveConsent(analytics); setReopened(false); };
  return (
    <section className="consent-banner" role="dialog" aria-live="polite" aria-labelledby="consent-title" aria-describedby="consent-body">
      {/* eslint-disable-next-line @next/next/no-img-element -- malý předpřipravený WebP (32 kB), dekorace mimo LCP */}
      <img className="consent-art" src="/tools/images/cookie-banner.webp" width={418} height={440} alt="" aria-hidden="true" />
      <div className="consent-text">
        <h2 id="consent-title">{s.title}</h2>
        <p id="consent-body">{s.body}</p>
        <p className="consent-terms">
          {s.terms_pre}<a href={`/${locale}/tools/podminky-uziti`}>{s.terms}</a>{s.terms_post}
        </p>
        <div className="consent-actions">
          <button type="button" className="consent-btn primary" onClick={() => choose(true)}>{s.accept}</button>
          <button type="button" className="consent-btn" onClick={() => choose(false)}>{s.necessary}</button>
        </div>
      </div>
    </section>
  );
}

/** Odkaz v patičce, který lištu znovu otevře (změna nebo odvolání souhlasu). */
export function ConsentSettingsButton({ locale }: { locale: Locale }) {
  return <button type="button" className="consent-link" onClick={openConsent}>{strings(locale).settings}</button>;
}
