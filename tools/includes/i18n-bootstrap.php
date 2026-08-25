<?php
// i18n bootstrap pro tools sekci.
// Registruje slovník tools/lang/, nastaví aktuální jazyk z VEVIT_LANG (rewrite env)
// nebo z URL prefixu. Volá se jednou na request před prvním vv_t()/vv_te().
//
// Tento soubor nesmí být dostupný přes HTTP — tools/.htaccess blokuje includes/.
declare(strict_types=1);

require_once __DIR__ . '/../../shared/i18n/locale.php';

vv_i18n_register(__DIR__ . '/../lang');

$GLOBALS['vv_tools_lang'] = vv_resolve_locale();
vv_i18n_set_lang($GLOBALS['vv_tools_lang']);

// vv_tools_lang() je definována v includes/registry.php (využívá $GLOBALS['vv_tools_lang']).