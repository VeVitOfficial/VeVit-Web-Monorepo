// Language store – port LanguageProvider.tsx + i18n

import { languages, setLang, getLang, t, lessonsLabel, lessonsUnit } from "../i18n.js";

const KEY = "vevit-lang";

export function initLang() {
  let saved = localStorage.getItem(KEY);
  if (!saved || !languages.some((l) => l.code === saved)) saved = "cs";
  setLang(saved);
  document.documentElement.lang = saved;
}

export function currentLang() {
  return getLang();
}

export function changeLang(code) {
  setLang(code);
  localStorage.setItem(KEY, code);
  document.documentElement.lang = code;
  // Re-render celé aplikace
  window.dispatchEvent(new CustomEvent("vevit:langchange"));
}

export { languages, t, lessonsLabel, lessonsUnit };