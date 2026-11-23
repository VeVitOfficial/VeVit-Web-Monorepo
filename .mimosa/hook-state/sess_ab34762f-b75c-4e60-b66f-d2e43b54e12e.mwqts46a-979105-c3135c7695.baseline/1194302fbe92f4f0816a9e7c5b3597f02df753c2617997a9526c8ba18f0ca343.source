// Volba cookies a přijetí podmínek užití nástrojů. Uložené jen v prohlížeči (localStorage);
// volba sama je nezbytné úložiště. Analytika (Vercel Analytics, Speed Insights) běží na
// stránkách nástrojů až po souhlasu „Přijmout vše“ (AnalyticsGate).

export const CONSENT_KEY = "vv-consent";
/** Verze podmínek užití — po změně podmínek se lišta zobrazí znovu. */
export const TERMS_VERSION = "2026-11-07";
const CHANGE_EVENT = "vv-consent-change";
const OPEN_EVENT = "vv-consent-open";

export interface Consent { analytics: boolean; terms: string; at: string }

export function readConsent(): Consent | null {
  try {
    const v = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null");
    return v && typeof v.analytics === "boolean" && typeof v.terms === "string" ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean): void {
  const c: Consent = { analytics, terms: TERMS_VERSION, at: new Date().toISOString() };
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch { /* soukromé okno: volba platí do zavření stránky */ }
  memo = c;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Bez localStorage (zablokované úložiště) drží volbu aspoň do zavření stránky.
let memo: Consent | null = null;
const current = () => readConsent() ?? memo;

export const analyticsAllowed = () => current()?.analytics === true;
export const consentNeeded = () => current()?.terms !== TERMS_VERSION;

/** Pro useSyncExternalStore: změna volby v tomto i jiném panelu. */
export function subscribeConsent(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(CHANGE_EVENT, cb); window.removeEventListener("storage", cb); };
}

/** Znovu otevře lištu (odkaz „Nastavení cookies“ v patičce). */
export const openConsent = () => window.dispatchEvent(new Event(OPEN_EVENT));
export function onOpenConsent(cb: () => void): () => void {
  window.addEventListener(OPEN_EVENT, cb);
  return () => window.removeEventListener(OPEN_EVENT, cb);
}
