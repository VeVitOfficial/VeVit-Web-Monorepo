import { loadSession } from '/assets/shared/session.js?v=20260809c';

export const SUPPORTED_LOCALES = Object.freeze([
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' }, { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' }, { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' }, { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
]);

const STORAGE_KEY = 'vevit-locale';
const CODES = new Set(SUPPORTED_LOCALES.map(({ code }) => code));
let preferredLocale = 'cs';
let activeLocale = 'cs';
const valid = (code) => CODES.has(code) ? code : 'cs';
const byCode = (code) => SUPPORTED_LOCALES.find((locale) => locale.code === code);
export const getLocale = () => activeLocale;

export function applyLocale(code, { persist = true } = {}) {
  activeLocale = valid(code); document.documentElement.lang = activeLocale;
  if (persist) localStorage.setItem(STORAGE_KEY, preferredLocale);
  document.querySelectorAll('[data-vevit-language]').forEach(render);
  window.dispatchEvent(new CustomEvent('vevit:localechange', { detail: { locale: activeLocale } }));
}

export function setPreferredLocale(code) {
  preferredLocale = valid(code);
  applyLocale(preferredLocale);
}

function choose(code) {
  // The header toggle is temporary: the Account preference remains the default.
  applyLocale(code, { persist: false });
}

function render(root) {
  const primary = byCode(preferredLocale); const alternate = byCode(preferredLocale === 'en' ? 'cs' : 'en');
  root.replaceChildren(); root.className = 'vv-locale'; root.setAttribute('aria-label', 'Jazyk rozhraní');
  [primary, alternate].forEach((locale) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = `${locale.flag} ${locale.code.toUpperCase()}`; button.title = locale.label; button.setAttribute('aria-pressed', String(locale.code === activeLocale)); button.addEventListener('click', () => choose(locale.code)); root.append(button); });
}

function styles() {
  if (document.getElementById('vv-locale-styles')) return;
  const style = document.createElement('style'); style.id = 'vv-locale-styles'; style.textContent = '.vv-locale{display:inline-flex;align-items:center;border:1px solid rgba(148,163,184,.32);border-radius:999px;padding:2px;background:rgba(15,23,42,.35)}.vv-locale button{border:0;border-radius:999px;background:transparent;color:inherit;padding:5px 8px;cursor:pointer;font:600 12px/1 system-ui,sans-serif}.vv-locale button[aria-pressed="true"]{background:#10b981;color:#06251b}.vv-locale button:focus-visible{outline:2px solid #34d399;outline-offset:2px}'; document.head.append(style);
}

async function boot() {
  styles(); setPreferredLocale(localStorage.getItem(STORAGE_KEY) || 'cs');
  try { const session = await loadSession(); if (session.state === 'authenticated') setPreferredLocale(session.user?.language || preferredLocale); } catch {}
  document.querySelectorAll('[data-vevit-language]').forEach(render);
  new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
    if (!(node instanceof Element)) return;
    if (node.matches('[data-vevit-language]')) render(node);
    node.querySelectorAll?.('[data-vevit-language]').forEach(render);
  }))).observe(document.body, { childList: true, subtree: true });
}

if (typeof document !== 'undefined') document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot, { once: true }) : boot();

window.addEventListener('vevit:localechange', (event) => {
  const locale = event.detail?.locale;
  if (locale && locale !== activeLocale) applyLocale(locale);
});
window.addEventListener('vevit:locale-preferencechange', (event) => setPreferredLocale(event.detail?.locale));
