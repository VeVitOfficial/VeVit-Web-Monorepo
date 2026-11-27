"use client";

// Právní stránky EveryTool.cz (Podmínky užití / Ochrana soukromí) — vzhled
// dle schválené makety legal.html: hero s blobs, přepínač dokumentů,
// „Ve zkratce“, sticky obsah (TOC) se scrollspy, číslované sekce a
// kontaktní karta. Klient kvůli IntersectionObserver (scrollspy).
import { useEffect, useState } from "react";
import { TOOLS, type Locale } from "@/components/tools/registry/data";
import type { LegalDoc } from "@/components/tools/terms-content";
import { ConsentSettingsButton } from "@/components/tools/consent-banner";
import { ThemeToggle } from "@/components/theme-toggle";

const TOC_COLORS = ["#FFD23F", "#FFB4C6", "#8EE6B0", "#C9B8FF", "#9FD8FF", "#FFC49A"];
const SHORT_COLORS = ["#E5383B", "#B27600", "#188A4A", "#2F6BFF", "#7B3FF2"];

export interface LegalStrings {
  eyebrow: string;
  hero_title: string;
  hero_lead: string;
  toc_label: string;
  short_title: string;
  contact_title: string;
  contact_text: string;
  back: string;
  back_aria: string;
}

const STRINGS: Record<"cs" | "en", LegalStrings> = {
  cs: {
    eyebrow: "PRÁVNÍ INFORMACE",
    hero_title: "Férově a srozumitelně",
    hero_lead: "Žádné kličky. Tady najdete pravidla používání EveryTool.cz a přehled, jak zacházíme s vašimi daty.",
    toc_label: "OBSAH",
    short_title: "Ve zkratce",
    contact_title: "Máte dotaz nebo chcete uplatnit svá práva?",
    contact_text: "Napište nám. Odpovíme bez zbytečného odkladu, nejpozději do 30 dnů.",
    back: "Zpět na nástroje",
    back_aria: "Zpět na všechny nástroje",
  },
  en: {
    eyebrow: "LEGAL INFORMATION",
    hero_title: "Fair and clear",
    hero_lead: "No fine print tricks. Here you will find the rules for using EveryTool.cz and an overview of how we handle your data.",
    toc_label: "CONTENTS",
    short_title: "In short",
    contact_title: "Have a question or want to exercise your rights?",
    contact_text: "Write to us. We reply without undue delay, at the latest within 30 days.",
    back: "Back to tools",
    back_aria: "Back to all tools",
  },
};

export function legalStrings(locale: Locale): LegalStrings {
  return locale === "cs" || locale === "sk" ? STRINGS.cs : STRINGS.en;
}

/** Zjednodušená hlavička právních stránek (dle makety): logo + téma + zpět. */
export function LegalHeader({ locale }: { locale: Locale }) {
  const s = legalStrings(locale);
  return (
    <header className="site-header et-hdr">
      <div className="et-wrap et-hdr-in">
        <a className="et-logo" href={`/${locale}/tools/`} aria-label="EveryTool.cz – domů" style={{ flex: "1 1 auto" }}>
          <span className="et-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span className="et-logo-t">
            <b>EveryTool<span>.cz</span></b>
            <small>by <span className="et-vevit">VeVit</span> web applications</small>
          </span>
        </a>
        <div className="et-actions">
          <ThemeToggle />
          <a className="et-btn" href={`/${locale}/tools/`} aria-label={s.back_aria}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            {s.back}
          </a>
        </div>
      </div>
    </header>
  );
}

/** Vlastní obsah dokumentu: „Ve zkratce“ + TOC se scrollspy + číslované sekce. */
export function LegalDocView({ locale, doc }: { locale: Locale; doc: LegalDoc }) {
  const s = legalStrings(locale);
  const [active, setActive] = useState(doc.sections[0]?.id ?? "");

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".et-lsec"));
    if (sections.length === 0 || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) setActive(en.target.id);
      }
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach((sec) => obs.observe(sec));
    return () => obs.disconnect();
  }, [doc]);

  return (
    <main className="et-legal">
      <section className="et-legal-hero">
        <span className="et-blob" aria-hidden="true" style={{ left: "6%", top: "60px", width: "50px", height: "50px", borderRadius: "50%", background: "#FFD23F" }}></span>
        <span className="et-blob" aria-hidden="true" style={{ right: "8%", top: "80px", width: "44px", height: "44px", borderRadius: "12px", background: "#2EC4B6", rotate: "-14deg" }}></span>
        <span className="et-blob" aria-hidden="true" style={{ right: "16%", bottom: "40px", width: "26px", height: "26px", borderRadius: "50%", border: "6px solid #FF5A5F" }}></span>
        <div className="et-legal-in">
          <span className="et-eyebrow">{s.eyebrow}</span>
          <h1>{s.hero_title}</h1>
          <p className="et-lead">{s.hero_lead}</p>
          <nav className="et-docseg" aria-label={s.eyebrow}>
            <a href={`/${locale}/tools/podminky-uziti`} aria-current={doc.title === "Podmínky užití" || doc.title === "Terms of Use" ? "page" : undefined}>Podmínky užití</a>
            <a href={`/${locale}/tools/ochrana-soukromi`} aria-current={doc.title === "Ochrana soukromí" || doc.title === "Privacy Notice" ? "page" : undefined}>Ochrana soukromí</a>
          </nav>
        </div>
      </section>
      <div className="et-wrap">
        <section className="et-short-sec" aria-labelledby="et-short-h">
          <h2 id="et-short-h">{s.short_title}</h2>
          <div className="et-short">
            {doc.short.map((card, i) => (
              <div key={card.h} className="et-tint" style={{ "--c": SHORT_COLORS[i % SHORT_COLORS.length] } as React.CSSProperties}>
                <b>{card.h}</b>
                <span>{card.t.replace("{count}", String(TOOLS.length))}</span>
              </div>
            ))}
          </div>
        </section>
        <div className="et-legal-layout">
          <nav className="et-toc" aria-label={`${s.toc_label} – ${doc.title}`}>
            <strong>{s.toc_label}</strong>
            {doc.sections.map((sec, i) => (
              <a key={sec.id} href={`#${sec.id}`} aria-current={active === sec.id || undefined}>
                <span className="et-num" style={{ "--n": TOC_COLORS[i % TOC_COLORS.length] } as React.CSSProperties}>{i + 1}</span>
                {sec.h}
              </a>
            ))}
          </nav>
          <article className="et-legal-doc">
            <div className="et-legal-head">
              <h2>{doc.title}</h2>
              <span className="et-eff">{doc.effective}</span>
              <p className="et-intro">{doc.intro}</p>
            </div>
            {doc.sections.map((sec, i) => (
              <section className="et-lsec" id={sec.id} key={sec.id}>
                <h3>
                  <span className="et-badge-n" style={{ "--n": TOC_COLORS[i % TOC_COLORS.length], "--rot": i % 2 ? "4deg" : "-4deg" } as React.CSSProperties}>{i + 1}</span>
                  {sec.h}
                </h3>
                {sec.p.map(([lead, text], j) => (
                  <p key={j}>{lead ? <b>{lead}</b> : null}{text}</p>
                ))}
              </section>
            ))}
          </article>
        </div>
      </div>
      <div className="et-wrap">
        <div className="et-contact">
          <span className="ic" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
          </span>
          <div className="t">
            <b>{s.contact_title}</b>
            <span>{s.contact_text}</span>
          </div>
          <a className="et-btn et-contact-mail" href="mailto:info@vevit.cz">info@vevit.cz</a>
        </div>
      </div>
      <footer className="et-legal-foot">
        <span><b className="et-legal-brand">EveryTool<span>.cz</span></b> · by VeVit web applications</span>
        <span>© 2026 EveryTool.cz · <ConsentSettingsButton locale={locale} /></span>
      </footer>
    </main>
  );
}
