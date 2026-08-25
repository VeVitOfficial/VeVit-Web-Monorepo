<?php
// Locale resolution + per-locale URL routing helper pro PHP sekce.
// Resolution priorita: URL prefix → session.user.language → cookie → Accept-Lang → cs.
//
// Tento soubor nesmí být dostupný přes HTTP — root .htaccess blokuje ^shared/.
declare(strict_types=1);

require_once __DIR__ . '/php-i18n.php';

const VV_LOCALE_COOKIE = 'vevit-lang';
const VV_LOCALES = ['cs', 'en', 'de', 'es', 'uk', 'fr', 'sk'];
const VV_SECTIONS = ['home', 'account', 'edu', 'store', 'tools', 'auth'];

function vv_locale_valid(?string $code): string {
    return in_array($code, VV_LOCALES, true) ? $code : 'cs';
}

/** Locale prefix z env VEVIT_LANG (rewrite) nebo z REQUEST_URI.
 *  Apache po interním rewrite vystavuje env jako REDIRECT_VEVIT_LANG. */
function vv_locale_from_url(): ?string {
    $env = $_SERVER['VEVIT_LANG'] ?? ($_ENV['VEVIT_LANG'] ?? null);
    if (!is_string($env) || !in_array($env, VV_LOCALES, true)) {
        $env = $_SERVER['REDIRECT_VEVIT_LANG'] ?? ($_ENV['REDIRECT_VEVIT_LANG'] ?? null);
    }
    if (is_string($env) && in_array($env, VV_LOCALES, true)) return $env;
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (is_string($uri) && preg_match('#^/([a-z]{2})(?:/|$)#', $uri, $m) && in_array($m[1], VV_LOCALES, true)) {
        return $m[1];
    }
    return null;
}

/** Parse Accept-Language proti VV_LOCALES. Vrací 'cs' fallback. */
function vv_accept_language_negotiate(): string {
    $al = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '';
    if (!is_string($al) || $al === '') return 'cs';
    $prefs = [];
    foreach (explode(',', $al) as $part) {
        $p = explode(';', $part);
        $code = strtolower(trim($p[0]));
        if ($code === '') continue;
        $q = 1.0;
        for ($i = 1, $n = count($p); $i < $n; $i++) {
            if (preg_match('/^\s*q=([0-9.]+)\s*$/i', $p[$i], $qm)) $q = (float) $qm[1];
        }
        $prefs[$code] = max($prefs[$code] ?? 0.0, $q);
    }
    arsort($prefs);
    foreach ($prefs as $code => $q) {
        if ($q <= 0) continue;
        if (in_array($code, VV_LOCALES, true)) return $code;
        $base = explode('-', $code)[0];
        if (in_array($base, VV_LOCALES, true)) return $base;
    }
    return 'cs';
}

/**
 * Resolution: URL prefix → user.language → cookie → Accept-Lang → cs.
 * $user: optional already-validated user array (obsahuje 'language').
 * Pokud $user i $cfg chybí, session se neřeší (anonymní, jen cookie+Accept-Lang).
 */
function vv_resolve_locale(?array $user = null): string {
    $url = vv_locale_from_url();
    if ($url !== null) return $url;
    if (is_array($user) && isset($user['language'])) {
        return vv_locale_valid($user['language']);
    }
    $cookie = $_COOKIE[VV_LOCALE_COOKIE] ?? null;
    if (is_string($cookie) && in_array($cookie, VV_LOCALES, true)) return $cookie;
    return vv_accept_language_negotiate();
}

/** Nastaví cookie vevit-lang (1 rok, Path=/, SameSite=Lax). */
function vv_locale_cookie(string $lang): void {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['REQUEST_SCHEME'] ?? '') === 'https');
    setcookie(VV_LOCALE_COOKIE, vv_locale_valid($lang), [
        'expires' => time() + 60 * 60 * 24 * 365,
        'path' => '/',
        'secure' => $secure,
        'httponly' => false,
        'samesite' => 'Lax',
    ]);
    $_COOKIE[VV_LOCALE_COOKIE] = vv_locale_valid($lang);
}

/** Odstřihně locale prefix: /de/store → /store, /cs/ → /. */
function vv_strip_locale_prefix(string $path): string {
    if (preg_match('#^/([a-z]{2})(/|$)#', $path, $m) && in_array($m[1], VV_LOCALES, true)) {
        $rest = substr($path, 3);
        return $rest === '' ? '/' : $rest;
    }
    return $path;
}

/** Přidá locale prefix: /store + de → /de/store; / + cs → /cs/home. */
function vv_locale_redirect_target(string $path, string $lang): string {
    $stripped = vv_strip_locale_prefix($path);
    $lang = vv_locale_valid($lang);
    if ($stripped === '/' || $stripped === '') return '/' . $lang . '/home';
    return '/' . $lang . $stripped;
}

/**
 * Generuje <link rel=alternate hreflang> sadu (7 jazyků + x-default) + canonical.
 * $sectionPath: cesta sekce BEZ nebo S prefixem (např. '/store' nebo '/de/store').
 */
function vv_hreflang_tags(string $sectionPath, ?string $currentLang = null, string $origin = 'https://vevit.cz'): string {
    $currentLang = vv_locale_valid($currentLang ?? vv_locale_from_url() ?? 'cs');
    $base = vv_strip_locale_prefix($sectionPath);
    $suffix = ($base === '/' || $base === '') ? '/home' : $base;
    $tags = [];
    foreach (VV_LOCALES as $code) {
        $url = $origin . '/' . $code . $suffix;
        $tags[] = '<link rel="alternate" hreflang="' . $code . '" href="' . htmlspecialchars($url, ENT_QUOTES) . '">';
    }
    $xd = $origin . '/cs' . $suffix;
    $tags[] = '<link rel="alternate" hreflang="x-default" href="' . htmlspecialchars($xd, ENT_QUOTES) . '">';
    $canon = $origin . '/' . $currentLang . $suffix;
    $tags[] = '<link rel="canonical" href="' . htmlspecialchars($canon, ENT_QUOTES) . '">';
    return implode("\n    ", $tags);
}

/** True pokud REQUEST_URI je kořen sekce bez locale prefixu (pro 301 na /<lang>/…). */
function vv_is_bare_section_request(): bool {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    $path = parse_url($uri, PHP_URL_PATH);
    if (!is_string($path)) $path = $uri;
    if ($path === '/' || $path === '') return true;
    foreach (VV_SECTIONS as $sec) {
        if ($path === '/' . $sec || str_starts_with($path, '/' . $sec . '/')) return true;
    }
    return false;
}