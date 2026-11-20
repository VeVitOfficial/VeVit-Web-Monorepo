"use client";

// Premium sekce hubu EveryTool.cz (dle index.html): Zdarma / EveryTool Premium /
// VeVit Premium. Tarify VeVit čte ze sdíleného src/lib/premium-tiers.ts
// (stejný zdroj jako domovská stránka), takže ceny a výhody nejsou duplicitní.
//
// ⚠ Roční cena EveryTool Premium a sleva ([CENA] / [X] %) jsou záměrné
//   placeholdery — doplní se po rozhodnutí. Měsíčně 130 Kč, 200 AI dotazů
//   denně; bez reklam má už verze Zdarma.
import { useState } from "react";
import { TOOLS, type HubI18n, type Locale } from "@/components/tools/registry/data";
import { VEVIT_TIERS, VEVIT_PLATINUM } from "@/lib/premium-tiers";

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const ARROW = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const CROWN = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
  </svg>
);

const TIER_DOTS: Record<string, string> = { bronze: "#C47A3D", silver: "#8A94A6", gold: "#E0A500" };

export function HubPremium({ locale, strings }: { locale: Locale; strings: HubI18n }) {
  const [yearly, setYearly] = useState(false);
  const [tierIdx, setTierIdx] = useState(1); // Silver jako výchozí (dle makety)
  const tier = VEVIT_TIERS[tierIdx];

  return (
    <section className="et-sec et-premium-sec" id="et-premium" aria-labelledby="et-premium-h">
      <header className="et-sec-h et-prem-head">
        <span className="et-prem-badge">
          <span className="et-crown" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" /></svg>
          </span>
          EveryTool Premium
        </span>
        <h2 id="et-premium-h">{strings.prem_title}</h2>
        <p className="et-prem-sub">{strings.prem_sub}</p>
        <div className="et-seg" role="group" aria-label={strings.prem_period_label}>
          <span className="et-seg-knob" style={{ width: "calc(50% - 7px)", transform: `translateX(calc((100% + 4px) * ${yearly ? 1 : 0}))` }} aria-hidden="true"></span>
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>{strings.prem_month}</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>{strings.prem_year}</button>
        </div>
      </header>

      <div className="et-plans">
        {/* ── Zdarma ── */}
        <article className="et-plan et-plan-free">
          <div>
            <div className="et-plan-name">{strings.free_name}</div>
            <div className="et-plan-sub">{strings.free_sub}</div>
          </div>
          <ul className="et-perks">
            {strings.free_perks.map((perk) => (
              <li key={perk}><i aria-hidden="true">{CHECK}</i>{perk.replace("{tools}", String(TOOLS.length))}</li>
            ))}
          </ul>
          <a className="et-big et-big-outline" href="#et-katalog">{strings.free_cta}</a>
        </article>

        {/* ── EveryTool Premium ── */}
        <article className="et-plan et-plan-pro">
          <span className="et-orbit" aria-hidden="true"></span>
          <div className="et-plan-head">
            <span className="et-tag">{strings.pro_tag}</span>
            <div className="et-plan-name"><span className="et-crown" aria-hidden="true">{CROWN}</span>{strings.pro_name}</div>
            <div className="et-plan-sub">{strings.pro_sub}</div>
          </div>
          <div className="et-price et-plan-rel">
            {/* Měsíční cena 130 Kč; roční cena a sleva se doplní (viz plán). */}
            <b>{yearly ? strings.pro_price_placeholder_yearly : strings.pro_price_placeholder}</b>
            <span className="et-unit">{yearly ? strings.pro_unit_y : strings.pro_unit_m}</span>
            {yearly ? <span className="et-save">{strings.pro_save_placeholder}</span> : null}
          </div>
          <ul className="et-perks et-plan-rel">
            {strings.pro_perks.map((perk) => (
              <li key={perk}><i aria-hidden="true">{CHECK}</i>{perk}</li>
            ))}
          </ul>
          <a className="et-big et-big-yellow" href={`/${locale}/account/billing`}>{strings.pro_cta}{ARROW}</a>
        </article>

        {/* ── VeVit Premium ── */}
        <article className="et-plan et-plan-vevit">
          <span className="et-vorbit" aria-hidden="true"></span>
          <div className="et-plan-head">
            <span className="et-tag et-tag-violet">{strings.vevit_tag}</span>
            <div className="et-plan-name"><span className="et-vmark" aria-hidden="true">V</span>{strings.vevit_name}</div>
            <div className="et-plan-sub">{strings.vevit_sub}</div>
          </div>
          <div className="et-seg et-seg-tiers" role="group" aria-label={strings.vevit_tiers_label}>
            <span className="et-seg-knob" style={{ width: "calc((100% - 16px) / 3)", transform: `translateX(calc((100% + 4px) * ${tierIdx}))` }} aria-hidden="true"></span>
            {VEVIT_TIERS.map((t, i) => (
              <button key={t.key} type="button" aria-pressed={i === tierIdx} onClick={() => setTierIdx(i)}>
                <span className="et-dot" style={{ background: TIER_DOTS[t.key] }} aria-hidden="true"></span>
                {t.name}
              </button>
            ))}
          </div>
          <div className="et-price et-plan-rel">
            <b key={`${tier.key}-${yearly}`} className="et-bump">{yearly ? tier.yearlyLabel : tier.monthly} Kč</b>
            <span className="et-unit">{yearly ? strings.unit_year : strings.unit_month}</span>
            <span className="et-valt">{yearly ? strings.vevit_2m_free : tier.altMonthly}</span>
          </div>
          <ul className="et-perks et-plan-rel">
            <li key={strings.vevit_everytool_perk}><i aria-hidden="true">{CHECK}</i>{strings.vevit_everytool_perk}</li>
            {tier.perks.map((perk) => (
              <li key={perk}><i aria-hidden="true">{CHECK}</i>{perk}</li>
            ))}
          </ul>
          <div className="et-plan-cta et-plan-rel">
            <a className="et-big et-big-violet" href={`/${locale}/account/billing`}>
              {strings.vevit_cta.replace("{tier}", tier.name)}{ARROW}
            </a>
            <a className="et-plat" href={VEVIT_PLATINUM.ctaHref}>{strings.vevit_platinum}</a>
          </div>
        </article>
      </div>
      <p className="et-prem-foot">{strings.prem_foot}</p>
    </section>
  );
}
