
/**
 * Port of account/assets/i18n.js (klasický IIFE s window.VVAccountI18n) na
 * TS modul pro React verzi účtu. Slovník DICT/PLURAL/TZ_CITIES je převzat 1:1
 * (včetně cs fallbacku), jen se locale předává explicitně místo globálního
 * stavu — viz accountT/accountTp. applyI18n a init nemají v Reactu smysl
 * (texty se renderují přímo), tz/plurály jsou rozšířené o locale parametr.
 */

const SUPPORTED = ['cs', 'en', 'de', 'es', 'uk', 'fr', 'sk'] as const;
export type AccountLocale = (typeof SUPPORTED)[number];

const URL_RE = /^\/(cs|en|de|es|uk|fr|sk)(?=\/|$)/;

/** Locale z URL prefixu /<lang>/ (stejné určení jako v originál i18n.js). */
export function accountLocaleFromPath(pathname: string | undefined | null): AccountLocale {
  if (!pathname) return 'cs';
  const m = pathname.match(URL_RE);
  return m && (SUPPORTED as readonly string[]).includes(m[1]) ? (m[1] as AccountLocale) : 'cs';
}



// ── Slovník ──────────────────────────────────────────────────────────────
// Samotné texty (všech 7 jazyků, cca 170 kB) jsou v account-i18n-dict.ts a do klienta se
// nebundlují. Server je registruje přes account-i18n-server.ts, klient dostane jen
// aktuální jazyk + cs fallback od serveru (components/account/i18n-provider.tsx).
// Registr je klíčovaný jazykem a data jsou statická, takže souběžné SSR požadavky
// v různých jazycích se nepřepisují.
const DICT: Record<string, Record<string, string>> = {};

export function registerAccountDict(dicts: Record<string, Record<string, string>>): void {
  for (const [code, dict] of Object.entries(dicts)) if (!DICT[code]) DICT[code] = dict;
}

// ── Plurální tvary (one/few/many/other) ──────────────────────────────────
// Pro ne-slovanské jazyky (en/de/es/fr) stačí one/other; few/many = other.
const PLURAL: Record<string, Record<string, Record<string, string>>> = {
  'overview.activeSessions': {
    cs: { one: '{n} aktivní relace', few: '{n} aktivní relace', many: '{n} aktivních relací', other: '{n} aktivních relací' },
    en: { one: '{n} active session', few: '{n} active sessions', many: '{n} active sessions', other: '{n} active sessions' },
    de: { one: '{n} aktive Sitzung', few: '{n} aktive Sitzungen', many: '{n} aktive Sitzungen', other: '{n} aktive Sitzungen' },
    es: { one: '{n} sesión activa', few: '{n} sesiones activas', many: '{n} sesiones activas', other: '{n} sesiones activas' },
    uk: { one: '{n} активна сесія', few: '{n} активні сесії', many: '{n} активних сесій', other: '{n} активних сесій' },
    fr: { one: '{n} session active', few: '{n} sessions actives', many: '{n} sessions actives', other: '{n} sessions actives' },
    sk: { one: '{n} aktívna relácia', few: '{n} aktívne relácie', many: '{n} aktívnych relácií', other: '{n} aktívnych relácií' },
  },
  'security.sessionsCount': {
    cs: { one: '{n} neexpirovaná relace', few: '{n} neexpirované relace', many: '{n} neexpirovaných relací', other: '{n} neexpirovaných relací' },
    en: { one: '{n} non-expired session', few: '{n} non-expired sessions', many: '{n} non-expired sessions', other: '{n} non-expired sessions' },
    de: { one: '{n} nicht abgelaufene Sitzung', few: '{n} nicht abgelaufene Sitzungen', many: '{n} nicht abgelaufene Sitzungen', other: '{n} nicht abgelaufene Sitzungen' },
    es: { one: '{n} sesión no expirada', few: '{n} sesiones no expiradas', many: '{n} sesiones no expiradas', other: '{n} sesiones no expiradas' },
    uk: { one: '{n} нескінчена сесія', few: '{n} нескінчені сесії', many: '{n} нескінчених сесій', other: '{n} нескінчених сесій' },
    fr: { one: '{n} session non expirée', few: '{n} sessions non expirées', many: '{n} sessions non expirées', other: '{n} sessions non expirées' },
    sk: { one: '{n} neexpirovaná relácia', few: '{n} neexpirované relácie', many: '{n} neexpirovaných relácií', other: '{n} neexpirovaných relácií' },
  },
  'security.2faRecoveryRemaining': {
    cs: { one: 'zbývá {n} recovery kód', few: 'zbývá {n} recovery kódy', many: 'zbývá {n} recovery kódů', other: 'zbývá {n} recovery kódů' },
    en: { one: '{n} recovery code left', few: '{n} recovery codes left', many: '{n} recovery codes left', other: '{n} recovery codes left' },
    de: { one: '{n} Recovery-Code übrig', few: '{n} Recovery-Codes übrig', many: '{n} Recovery-Codes übrig', other: '{n} Recovery-Codes übrig' },
    es: { one: 'quedan {n} código de recuperación', few: 'quedan {n} códigos de recuperación', many: 'quedan {n} códigos de recuperación', other: 'quedan {n} códigos de recuperación' },
    uk: { one: 'залишився {n} код відновлення', few: 'залишилось {n} коди відновлення', many: 'залишилось {n} кодів відновлення', other: 'залишилось {n} кодів відновлення' },
    fr: { one: '{n} code de récupération restant', few: '{n} codes de récupération restants', many: '{n} codes de récupération restants', other: '{n} codes de récupération restants' },
    sk: { one: 'zostáva {n} recovery kód', few: 'zostáva {n} recovery kódy', many: 'zostáva {n} recovery kódov', other: 'zostáva {n} recovery kódov' },
  },
};

// ── Locale map pro Intl (formátování data) ───────────────────────────────
const INTL_LOCALE: Record<string, string> = {
  cs: 'cs-CZ', en: 'en-GB', de: 'de-DE', es: 'es-ES',
  uk: 'uk-UA', fr: 'fr-FR', sk: 'sk-SK',
};

// ── Městské názvy timezones (pro preferences select) ─────────────────────
const TZ_CITIES: Record<string, Record<string, string>> = {
  cs: { 'Europe/Prague':'Praha', 'Europe/Bratislava':'Bratislava', 'Europe/Berlin':'Berlín', 'Europe/Madrid':'Madrid', 'Europe/Paris':'Paříž', 'Europe/Kyiv':'Kyjev', 'Europe/London':'Londýn', 'America/New_York':'New York', 'America/Los_Angeles':'Los Angeles', 'Asia/Tokyo':'Tokio', 'Australia/Sydney':'Sydney', 'UTC':'UTC' },
  en: { 'Europe/Prague':'Prague', 'Europe/Bratislava':'Bratislava', 'Europe/Berlin':'Berlin', 'Europe/Madrid':'Madrid', 'Europe/Paris':'Paris', 'Europe/Kyiv':'Kyiv', 'Europe/London':'London', 'America/New_York':'New York', 'America/Los_Angeles':'Los Angeles', 'Asia/Tokyo':'Tokyo', 'Australia/Sydney':'Sydney', 'UTC':'UTC' },
  de: { 'Europe/Prague':'Prag', 'Europe/Bratislava':'Bratislava', 'Europe/Berlin':'Berlin', 'Europe/Madrid':'Madrid', 'Europe/Paris':'Paris', 'Europe/Kyiv':'Kiew', 'Europe/London':'London', 'America/New_York':'New York', 'America/Los_Angeles':'Los Angeles', 'Asia/Tokyo':'Tokio', 'Australia/Sydney':'Sydney', 'UTC':'UTC' },
  es: { 'Europe/Prague':'Praga', 'Europe/Bratislava':'Bratislava', 'Europe/Berlin':'Berlín', 'Europe/Madrid':'Madrid', 'Europe/Paris':'París', 'Europe/Kyiv':'Kiev', 'Europe/London':'Londres', 'America/New_York':'Nueva York', 'America/Los_Angeles':'Los Ángeles', 'Asia/Tokyo':'Tokio', 'Australia/Sydney':'Sídney', 'UTC':'UTC' },
  uk: { 'Europe/Prague':'Прага', 'Europe/Bratislava':'Братислава', 'Europe/Berlin':'Берлін', 'Europe/Madrid':'Мадрид', 'Europe/Paris':'Париж', 'Europe/Kyiv':'Київ', 'Europe/London':'Лондон', 'America/New_York':'Нью-Йорк', 'America/Los_Angeles':'Лос-Анджелес', 'Asia/Tokyo':'Токіо', 'Australia/Sydney':'Сідней', 'UTC':'UTC' },
  fr: { 'Europe/Prague':'Prague', 'Europe/Bratislava':'Bratislava', 'Europe/Berlin':'Berlin', 'Europe/Madrid':'Madrid', 'Europe/Paris':'Paris', 'Europe/Kyiv':'Kyiv', 'Europe/London':'Londres', 'America/New_York':'New York', 'America/Los_Angeles':'Los Angeles', 'Asia/Tokyo':'Tokyo', 'Australia/Sydney':'Sydney', 'UTC':'UTC' },
  sk: { 'Europe/Prague':'Praha', 'Europe/Bratislava':'Bratislava', 'Europe/Berlin':'Berlín', 'Europe/Madrid':'Madrid', 'Europe/Paris':'Paríž', 'Europe/Kyiv':'Kyjev', 'Europe/London':'Londýn', 'America/New_York':'New York', 'America/Los_Angeles':'Los Angeles', 'Asia/Tokyo':'Tokio', 'Australia/Sydney':'Sydney', 'UTC':'UTC' },
};

export function accountInterpolate(str: string, vars: Record<string, unknown> | undefined): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? String(vars[name]) : m));
}


function lookup(key: string, langCode: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(DICT[langCode] ?? {}, key)
    ? DICT[langCode][key]
    : DICT.cs?.[key];
}

const prCache: Record<string, Intl.PluralRules> = {};
function pluralRules(code: string): Intl.PluralRules {
  if (!prCache[code]) prCache[code] = new Intl.PluralRules(code);
  return prCache[code];
}

/** Lokalizovaný řetězec s {var} interpolací; chybějící klíče fallbackují na cs. */
export function accountT(key: string, locale: string, vars?: Record<string, unknown>): string {
  const str = lookup(key, locale);
  return typeof str === 'string' ? accountInterpolate(str, vars) : key;
}

/** Lokalizovaný plurál (klíč v PLURAL = { cs: { one, few, many, other }, ... }). */
export function accountTp(key: string, n: number, locale: string, vars?: Record<string, unknown>): string {
  const entry = PLURAL[key] as Record<string, Record<string, string>> | undefined;
  if (!entry) return accountT(key, locale, vars);
  const forms = entry[locale] ?? entry.cs ?? {};
  const category = pluralRules(locale).select(n);
  const form = forms[category] ?? forms.other ?? forms.many ?? forms.few ?? forms.one;
  return accountInterpolate(form, vars);
}

export function accountIntlLocale(locale: string): string {
  return INTL_LOCALE[locale] || 'cs-CZ';
}

/** Vlastní název časové zóny pro aktuální jazyk (stejné mapy jako v i18n.js). */
export function accountTz(zone: string, locale: string): string {
  return TZ_CITIES[locale]?.[zone] ?? TZ_CITIES.cs[zone] ?? zone;
}

export function accountFormatDate(value: unknown, locale: string): string {
  if (!value) return accountT('date.unspecified', locale);
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? accountT('date.unspecified', locale)
    : new Intl.DateTimeFormat(accountIntlLocale(locale), { dateStyle: 'medium' }).format(date);
}

export function accountFormatDateTime(value: unknown, locale: string): string {
  if (!value) return accountT('date.unspecified', locale);
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? accountT('date.unspecified', locale)
    : new Intl.DateTimeFormat(accountIntlLocale(locale), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
