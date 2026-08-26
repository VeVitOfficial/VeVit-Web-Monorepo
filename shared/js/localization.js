// Globální přepínač jazyka (pill). Sjednocený storage klíč `vevit-lang`
// (stejný jako edu/js/store/lang.js). Pill ukazuje jen 2 volby: základní jazyk
// (baseLocale) + angličtina. Ostatních 5 jazyků zůstává dostupných na URL
// (/<lang>/<sekce>/) pro SEO, ale v pillu se neukážou. Základní jazyk se volí
// v nastavení účtu (DB users.language); pill je jen přepínač zobrazení
// (base ↔ en), DB base nemění.
//
// Locale resolution (klient): URL prefix /<lang>/ → localStorage `vevit-lang`
// → session.user.language → cs. URL prefix je kanonický (per-locale routing).
// Pro server-side (PHP sekce) se nastavuje cookie `vevit-lang` (path=/; 1 rok).

import { loadSession } from '/assets/shared/session.js?v=20260809c';

export const SUPPORTED_LOCALES = Object.freeze([
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' }, { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' }, { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' }, { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
]);

const STORAGE_KEY = 'vevit-lang';
const COOKIE_NAME = 'vevit-lang';
const LOCALE_SCROLL_KEY = 'vevit:locale-scroll';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 rok
const CODES = new Set(SUPPORTED_LOCALES.map(({ code }) => code));
const valid = (code) => (CODES.has(code) ? code : 'cs');
const byCode = (code) => SUPPORTED_LOCALES.find((locale) => locale.code === code) || byCode('cs');

const URL_LOCALE_RE = /^\/(cs|en|de|es|uk|fr|sk)(?=\/|$)/;
/** Locale z URL prefixu (kanonický zdroj pro per-locale routing). */
function urlLocaleCode() {
  if (typeof location === 'undefined') return null;
  const m = (location.pathname || '').match(URL_LOCALE_RE);
  return m ? m[1] : null;
}

let preferredLocale = 'cs';
let activeLocale = 'cs';
// Základní jazyk (ne-EN partner v pillu). Authed: users.language (en→cs).
// Anon: cs. Se mění jen z nastavení účtu (event `vevit:locale-basechange`).
let baseLocale = 'cs';
let authenticated = false;

export const getLocale = () => activeLocale;
export const getPreferredLocale = () => preferredLocale;
/** Základní jazyk uživatele (druhý jazyk v pillu je vždy en). */
export const getBaseLocale = () => baseLocale;

/** Aktualizuje cookie `vevit-lang` tak, aby ji server (PHP sekce) přečetl. */
function writeCookie(code) {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${code}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Aplikuje jazyk: nastaví <html lang>, persistuje (localStorage + cookie),
 * překreslí pill a rozjede `vevit:localechange`. Redirect na /<lang>/ řeší
 * samostatně `navigateToLocale()` (Fáze B6) — tady se nic nepřesměrovává.
 */
export function applyLocale(code, { persist = true } = {}) {
  activeLocale = valid(code);
  document.documentElement.lang = activeLocale;
  if (persist) {
    preferredLocale = activeLocale;
    try { localStorage.setItem(STORAGE_KEY, activeLocale); } catch {}
  }
  writeCookie(activeLocale);
  document.querySelectorAll('[data-vevit-language]').forEach(render);
  injectHreflang();
  window.dispatchEvent(new CustomEvent('vevit:localechange', { detail: { locale: activeLocale } }));
}

/**
 * SEO: injektuje do <head> sadu <link rel="alternate" hreflang="…"> pro všech
 * 7 jazyků + x-default, a canonical pro aktuální jazyk. Funguje napříč sekcemi
 * (statickými home/edu/account i PHP store/tools). PHP sekce, které generují
 * canonical server-side, se nededuplikují — canonical se přidá jen chybí-li.
 */
function injectHreflang() {
  if (typeof document === 'undefined' || !document.head) return;
  const origin = location.origin;
  const section = currentSectionPath();
  const head = document.head;
  head.querySelectorAll('link[data-vv-hreflang]').forEach((el) => el.remove());
  const add = (rel, hreflang, href) => {
    const link = document.createElement('link');
    link.setAttribute('data-vv-hreflang', '');
    link.rel = rel;
    if (hreflang) link.hreflang = hreflang;
    link.href = href;
    head.append(link);
  };
  for (const { code } of SUPPORTED_LOCALES) add('alternate', code, `${origin}/${code}${section}`);
  add('alternate', 'x-default', `${origin}/cs${section}`);
  if (!head.querySelector('link[rel="canonical"]:not([data-vv-hreflang])')) {
    add('canonical', '', `${origin}/${activeLocale}${section}`);
  }
}

/**
 * Programové nastavení preference (boot, `vevit:locale-preferencechange`
 * z account UI). NePATCHuje DB — o uložení do DB rozhodl jiný zdroj
 * (session / account formulář), tady jen sjednáme UI.
 */
export function setPreferredLocale(code) {
  preferredLocale = valid(code);
  applyLocale(preferredLocale, { persist: true });
}

/** Sekce pod per-locale routingem (odpovídá .htaccess prefix pravidlu). */
const ROUTED_SECTION_RE = /^(\/(?:cs|en|de|es|uk|fr|sk))?\/(?:home|account|edu|store|tools)(?:\/|$)/i;

/* ── Per-locale routing helpers (Fáze B6) ────────────────────────────── */

const SECTION_RE = /^(\/(?:home|account|edu|store|tools|auth))(?:\/|$)/i;

/**
 * Vrátí cestu aktuální sekce BEZ locale prefixu, vč. počátečního lomítka.
 * Např. `/de/edu/dashboard` → `/edu/dashboard`; `/home` → `/home`; `/` → `/home`.
 */
export function currentSectionPath() {
  let path = location.pathname || '/';
  // Odstřihneme případný locale prefix /<lang>/.
  const prefix = path.match(/^\/([a-z]{2})(\/|$)/);
  if (prefix && CODES.has(prefix[1])) path = path.slice(prefix[1].length + 1) || '/';
  if (!path.startsWith('/')) path = '/' + path;
  if (path === '/' || !SECTION_RE.test(path)) return '/home';
  return path;
}

function normalizedSectionPath(path) {
  const normalized = String(path || '/').replace(/\/+$/, '');
  return normalized || '/';
}

function restoreLocaleScrollPosition() {
  const sectionPath = currentSectionPath();
  // Edu obnovuje pozici až po asynchronním vykreslení své SPA stránky.
  if (normalizedSectionPath(sectionPath).startsWith('/edu')) return;

  let saved;
  try {
    const raw = sessionStorage.getItem(LOCALE_SCROLL_KEY);
    if (!raw) return;
    saved = JSON.parse(raw);
  } catch {
    return;
  }

  const fresh = Date.now() - Number(saved.createdAt) < 15_000;
  const sameLocale = saved.locale === urlLocaleCode();
  const samePage = normalizedSectionPath(saved.path) === normalizedSectionPath(sectionPath);
  if (!fresh || !sameLocale || !samePage) {
    try { sessionStorage.removeItem(LOCALE_SCROLL_KEY); } catch {}
    return;
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const position = { x: Number(saved.x) || 0, y: Number(saved.y) || 0 };
  const deadline = performance.now() + 3000;
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  let stablePasses = 0;

  const apply = () => {
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(position.x, Math.min(position.y, maxY));
    const reached = maxY >= position.y - 1 && Math.abs(window.scrollY - position.y) <= 1;
    stablePasses = reached ? stablePasses + 1 : 0;
    if (stablePasses < 3 && performance.now() < deadline) {
      window.setTimeout(apply, 80);
      return;
    }
    root.style.scrollBehavior = previousScrollBehavior;
    try { sessionStorage.removeItem(LOCALE_SCROLL_KEY); } catch {}
  };

  window.requestAnimationFrame(apply);
}

/**
 * Přesměruje na `/<lang>/<sekce>/...` (per-locale URL routing, Fáze B).
 * Vrací true, pokud došlo k přesměrování (volající pak skipne in-place swap).
 */
export function navigateToLocale(code) {
  const next = valid(code);
  const target = '/' + next + currentSectionPath() + location.search + location.hash;
  if (target !== location.pathname + location.search + location.hash) {
    try {
      sessionStorage.setItem(LOCALE_SCROLL_KEY, JSON.stringify({
        locale: next,
        path: currentSectionPath(),
        x: window.scrollX,
        y: window.scrollY,
        createdAt: Date.now()
      }));
    } catch {}
    location.assign(target);
    return true;
  }
  return false;
}

/** Uživatel kliknul na pill → přepínač ZOBRAZENÍ (base ↔ en), ne změna base.
 *  Pill je jen navigace na /<lang>/<sekce>/; základní jazyk (base) se mění
 *  výhradně z nastavení účtu (viz `vevit:locale-basechange`). Pod per-locale
 *  routingem redirect na /<lang>/<sekce> (URL je kanonická); mimo něj
 *  (onboarding apod.) pouze in-place swap bez změny URL. */
function choose(code) {
  const next = valid(code);
  if (next === activeLocale) return;

  const animatePills = () => {
    document.querySelectorAll('[data-vevit-language]').forEach((root) => {
      const buttons = [...root.querySelectorAll('.vv-locale__btn')];
      const index = buttons.findIndex((button) => button.dataset.locale === next);
      if (index < 0) return;
      root.style.setProperty('--vv-locale-index', String(index));
      root.classList.add('is-switching');
      buttons.forEach((button) => {
        const active = button.dataset.locale === next;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.disabled = true;
      });
    });
  };

  if (ROUTED_SECTION_RE.test(location.pathname || '/')) {
    preferredLocale = next;
    activeLocale = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    writeCookie(next);
    animatePills();
    window.setTimeout(() => navigateToLocale(next), 260);
    return;
  }
  activeLocale = next;
  animatePills();
  window.setTimeout(() => applyLocale(next, { persist: true }), 260);
}

function render(root) {
  root.replaceChildren();
  root.className = 'vv-locale';
  root.setAttribute('aria-label', 'Jazyk rozhraní');
  // Pill ukazuje jen 2 volby: základní jazyk (base) + angličtina.
  // Ostatních 5 jazyků je dostupných na URL pro SEO, ale v pillu se neukážou.
  const items = [byCode(baseLocale), byCode('en')];
  const seen = new Set();
  const locales = items.filter((locale) => {
    if (seen.has(locale.code)) return false;
    seen.add(locale.code);
    return true;
  });
  const activeIndex = Math.max(0, locales.findIndex((locale) => locale.code === activeLocale));
  root.style.setProperty('--vv-locale-count', String(locales.length));
  root.style.setProperty('--vv-locale-index', String(activeIndex));
  const slider = document.createElement('span');
  slider.className = 'vv-locale__slider';
  slider.setAttribute('aria-hidden', 'true');
  root.append(slider);

  for (const locale of locales) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vv-locale__btn' + (locale.code === activeLocale ? ' is-active' : '');
    btn.dataset.locale = locale.code;
    btn.textContent = `${locale.flag} ${locale.label}`;
    btn.title = locale.label;
    btn.setAttribute('aria-pressed', locale.code === activeLocale ? 'true' : 'false');
    btn.setAttribute('aria-label', locale.label);
    btn.addEventListener('click', () => choose(locale.code));
    root.append(btn);
  }
}

function styles() {
  if (document.getElementById('vv-locale-styles')) return;
  const style = document.createElement('style');
  style.id = 'vv-locale-styles';
  style.textContent = `
    .vv-locale{--vv-locale-count:2;--vv-locale-index:0;position:relative;display:grid;grid-template-columns:repeat(var(--vv-locale-count),minmax(88px,1fr));align-items:center;padding:3px;border:1px solid rgba(148,163,184,.32);border-radius:999px;background:rgba(15,23,42,.38);box-shadow:inset 0 1px 0 rgba(255,255,255,.04);isolation:isolate}
    .vv-locale__slider{position:absolute;z-index:0;top:3px;bottom:3px;left:3px;width:calc((100% - 6px)/var(--vv-locale-count));border-radius:999px;background:#10b981;box-shadow:0 4px 14px rgba(16,185,129,.24);transform:translateX(calc(var(--vv-locale-index)*100%));transition:transform 240ms cubic-bezier(.22,.8,.3,1),box-shadow 240ms ease;pointer-events:none}
    .vv-locale.is-switching .vv-locale__slider{box-shadow:0 5px 18px rgba(16,185,129,.38)}
    .vv-locale__btn{position:relative;z-index:1;appearance:none;-webkit-appearance:none;border:0;border-radius:999px;background:transparent;color:inherit;padding:7px 12px;cursor:pointer;font:650 12px/1 system-ui,sans-serif;white-space:nowrap;transition:color 180ms ease,opacity 180ms ease}
    .vv-locale__btn:hover:not(.is-active){color:#34d399}
    .vv-locale__btn.is-active{color:#04140d}
    .vv-locale__btn:disabled{cursor:default;opacity:1}
    .vv-locale__btn:focus-visible{outline:2px solid #34d399;outline-offset:3px}
    @media(max-width:700px){.vv-locale{grid-template-columns:repeat(var(--vv-locale-count),minmax(76px,1fr))}.vv-locale__btn{padding-inline:9px;font-size:11px}}
    @media(prefers-reduced-motion:reduce){.vv-locale__slider,.vv-locale__btn{transition:none}}
  `;
  document.head.append(style);
}

async function boot() {
  styles();
  // 1) URL prefix je kanonický (per-locale routing) — má přednost nad vším.
  const urlLang = urlLocaleCode();
  // 2) Explicitní volba uživatele (přežije reload) — fallback, když není URL prefix.
  let stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch {}
  if (urlLang) {
    setPreferredLocale(urlLang);
  } else if (stored && CODES.has(stored)) {
    setPreferredLocale(stored);
  }
  // 3) Přihlášený bez URL i stored: session.user.language (cross-device).
  try {
    const session = await loadSession();
    authenticated = session.state === 'authenticated';
    if (authenticated) {
      // Základní jazyk = users.language (base, ne-EN partner v pillu).
      // EN nemůže být base (je to vždy ten druhý jazyk) → fallback na cs.
      const dbLang = session.user?.language;
      baseLocale = (dbLang && dbLang !== 'en') ? valid(dbLang) : 'cs';
      if (!urlLang && !stored) {
        setPreferredLocale(session.user?.language || preferredLocale);
      }
    } else {
      baseLocale = 'cs';
    }
  } catch {}
  document.querySelectorAll('[data-vevit-language]').forEach(render);
  new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
    if (!(node instanceof Element)) return;
    if (node.matches('[data-vevit-language]')) render(node);
    node.querySelectorAll?.('[data-vevit-language]').forEach(render);
  }))).observe(document.body, { childList: true, subtree: true });
}

if (typeof document !== 'undefined') {
  // Synchronní early-init: nastaví <html lang> z URL prefixu ještě před
  // DOMContentLoaded, aby home UI.apply() četlo správný jazyk hned (boot
  // běží asynchronně a dispatch localechange by mohl přijet pozdě).
  const earlyUrlLang = urlLocaleCode();
  if (earlyUrlLang) {
    activeLocale = earlyUrlLang;
    preferredLocale = earlyUrlLang;
    document.documentElement.lang = earlyUrlLang;
    writeCookie(earlyUrlLang);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreLocaleScrollPosition, { once: true });
  } else {
    restoreLocaleScrollPosition();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}

// Externí změna jazyka (např. z edu bridge) → pouze aplikovat, nepersistovat znovu.
window.addEventListener('vevit:localechange', (event) => {
  const locale = event.detail?.locale;
  if (locale && locale !== activeLocale) applyLocale(locale, { persist: true });
});
// Account UI uložil jazyk → sjednotit preferenci (bez DB PATCH, už je uloženo).
window.addEventListener('vevit:locale-preferencechange', (event) => setPreferredLocale(event.detail?.locale));

// Account UI uložil ZÁKLADNÍ jazyk (base) → aktualizuj baseLocale, překresli
// pill na {newBase, en} a přesměruj na /<newBase>/<sekci>/. (Ostatních 5 jazyků
// zůstává na URL pro SEO, ale pill je neukáže.)
window.addEventListener('vevit:locale-basechange', (event) => {
  const code = event.detail?.locale;
  if (!code) return;
  baseLocale = (code === 'en') ? 'cs' : valid(code);
  document.querySelectorAll('[data-vevit-language]').forEach(render);
  if (ROUTED_SECTION_RE.test(location.pathname || '/')) navigateToLocale(baseLocale);
});
