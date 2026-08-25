<?php
// PHP i18n pro server-renderované sekce (store, tools, account, auth stránky).
// Slovníky: <sekce>/lang/<code>.php vrací pole ['klíč' => 'text'].
// Fallback na cs. Interpolace {VAR}. OPcache cachuje PHP pole.
//
// Tento soubor nesmí být dostupný přes HTTP — root .htaccess blokuje ^shared/.
declare(strict_types=1);

const VV_I18N_LOCALES = ['cs', 'en', 'de', 'es', 'uk', 'fr', 'sk'];
const VV_I18N_DEFAULT = 'cs';

function vv_i18n_valid(?string $code): string {
    return in_array($code, VV_I18N_LOCALES, true) ? $code : VV_I18N_DEFAULT;
}

/** Zaregistruje adresář slovníků pro aktuální sekci (např. __DIR__ . '/../lang'). */
function vv_i18n_register(string $dir): void {
    $GLOBALS['_VV_I18N_DIR'] = rtrim($dir, '/');
}

function vv_i18n_dir(): ?string {
    return isset($GLOBALS['_VV_I18N_DIR']) ? (string) $GLOBALS['_VV_I18N_DIR'] : null;
}

/** Nastaví aktuální jazyk (typicky z vv_resolve_locale) pro implicitní t(). */
function vv_i18n_set_lang(string $lang): void {
    $GLOBALS['_VV_I18N_LANG'] = vv_i18n_valid($lang);
}

function vv_i18n_get_lang(): string {
    return vv_i18n_valid($GLOBALS['_VV_I18N_LANG'] ?? VV_I18N_DEFAULT);
}

/** Načte slovník pro daný jazyk (s in-memory cache). */
function vv_i18n_load(string $dir, string $lang): array {
    static $cache = [];
    $key = $dir . '|' . $lang;
    if (isset($cache[$key])) return $cache[$key];
    $dict = [];
    $file = $dir . '/' . $lang . '.php';
    if (is_file($file)) {
        $arr = include $file;
        if (is_array($arr)) $dict = $arr;
    }
    return $cache[$key] = $dict;
}

/**
 * Překlad klíče ze zaregistrovaného slovníku. Fallback na cs, pak na klíč.
 * $lang defaults to vv_i18n_get_lang(). $vars interpoluje jako {JMÉNO}.
 */
function vv_t(string $key, ?string $lang = null, array $vars = []): string {
    $dir = vv_i18n_dir();
    if ($dir === null) return $key;
    $lang = vv_i18n_valid($lang ?? vv_i18n_get_lang());
    $dict = vv_i18n_load($dir, $lang);
    $text = $dict[$key] ?? null;
    if ($text === null && $lang !== VV_I18N_DEFAULT) {
        $text = vv_i18n_load($dir, VV_I18N_DEFAULT)[$key] ?? null;
    }
    if ($text === null) return $key;
    if ($vars) {
        foreach ($vars as $k => $v) {
            $text = str_replace('{' . $k . '}', (string) $v, $text);
        }
    }
    return $text;
}

/** t() + htmlspecialchars, echo. Zkratka pro šablony: <?= vv_te('store.nav.home') ?> */
function vv_te(string $key, ?string $lang = null, array $vars = []): void {
    echo htmlspecialchars(vv_t($key, $lang, $vars), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}