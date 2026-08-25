<?php
// Locale-aware loader for ai-gramotnost course content (no-DB fallback path).
//
// Mechanism: based on the resolved locale, require data/content.<lang>.php when
// it exists, otherwise fall back to data/content.php (cs canonical). A per-lang
// file is expected to `require_once __DIR__.'/content.php'` (which provides the
// builder helpers + content*() functions + canonical $LESSONS) and then override
// the small translatable globals ($ACHS, $CHAPTERS, $COURSE_META). Lesson bodies
// ($LESSONS) stay cs until full-content translation follow-up.
//
// Locale priority: VEVIT_LANG env (.htaccess) → URL prefix → cookie vevit-lang → cs.
// When shared/i18n/locale.php is available, its vv_resolve_locale() is preferred.
declare(strict_types=1);

function ai_gram_lang(): string {
    if (is_callable('vv_resolve_locale')) {
        try { return vv_resolve_locale(); } catch (Throwable $e) {}
    }
    $supported = ['cs' => 'cs', 'en' => 'en', 'de' => 'de', 'es' => 'es', 'uk' => 'uk', 'fr' => 'fr', 'sk' => 'sk'];
    $env = (string)($_SERVER['VEVIT_LANG'] ?? '');
    if (isset($supported[$env])) return $supported[$env];
    $uri = (string)($_SERVER['REQUEST_URI'] ?? '');
    if (preg_match('#^/(cs|en|de|es|uk|fr|sk)/#', $uri, $m)) return $m[1];
    $cookie = (string)($_COOKIE['vevit-lang'] ?? '');
    if (isset($supported[$cookie])) return $supported[$cookie];
    return 'cs';
}

$lang = ai_gram_lang();
$base = __DIR__ . '/content.php';
$localized = __DIR__ . "/content.{$lang}.php";

if ($lang !== 'cs' && is_file($localized)) {
    require_once $localized;
} else {
    require_once $base;
}