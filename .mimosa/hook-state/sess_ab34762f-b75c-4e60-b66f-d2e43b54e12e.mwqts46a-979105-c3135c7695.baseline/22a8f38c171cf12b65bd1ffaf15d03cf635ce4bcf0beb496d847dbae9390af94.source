// Language store – port LanguageProvider.tsx + i18n
// Locale se čte primárně z URL prefixu (/<lang>/edu/…), fallback localStorage → cs.
// `applyUrlLocale` volá router při navigaci (bez re-render eventu);
// `changeLang` používá globální pill / vevit:localechange (re-render).

import { languages, setLang, getLang, t, lessonsLabel, lessonsUnit } from "../i18n.js";

const KEY = "vevit-lang";
const SUPPORTED = ["cs", "en", "de", "es", "uk", "fr", "sk"];
const LOCALE_RE = /^\/(cs|en|de|es|uk|fr|sk)(?=\/|$)/;

function valid(code) {
  return SUPPORTED.includes(code) ? code : "cs";
}

function detectLocaleFromUrl() {
  const m = (location.pathname || "").match(LOCALE_RE);
  return m ? m[1] : null;
}

export function initLang() {
  let code = detectLocaleFromUrl();
  if (!code) {
    const saved = localStorage.getItem(KEY);
    code = valid(saved);
  }
  code = valid(code);
  setLang(code);
  document.documentElement.lang = code;
}

export function currentLang() {
  return getLang();
}

// Aplikuje locale z URL bez dispatche re-render eventu — volá router v renderRoute.
// Persistuje volbu (cookie/localStorage) pro anonymního návratníka.
export function applyUrlLocale(code) {
  const c = valid(code);
  setLang(c);
  try { localStorage.setItem(KEY, c); } catch {}
  document.documentElement.lang = c;
}

export function changeLang(code) {
  const c = valid(code);
  setLang(c);
  try { localStorage.setItem(KEY, c); } catch {}
  document.documentElement.lang = c;
  // Re-render celé aplikace
  window.dispatchEvent(new CustomEvent("vevit:langchange"));
}

export { languages, t, lessonsLabel, lessonsUnit };