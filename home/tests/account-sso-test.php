<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$home = file_get_contents($root . '/index.html') ?: '';
$support = file_get_contents($root . '/support.html') ?: '';
$client = is_file($root . '/assets/js/account-session.js')
    ? (file_get_contents($root . '/assets/js/account-session.js') ?: '')
    : '';
$legacySources = '';
foreach (['api.php', 'api/config.php', 'api/login.php', 'api/logout.php', 'api/user.php', 'api/setup.php', 'assets/js/app.js'] as $file) {
    $legacySources .= is_file($root . '/' . $file) ? (file_get_contents($root . '/' . $file) ?: '') : '';
}

$failures = [];
function sso_expect(bool $condition, string $message): void
{
    global $failures;
    if (!$condition) {
        $failures[] = $message;
    }
}

foreach ([$home, $support] as $page) {
    sso_expect(str_contains($page, 'data-vevit-auth'), 'Every public page must expose the shared Account UI hook.');
    sso_expect(str_contains($page, 'assets/js/account-session.js'), 'Every public page must load the Account session client.');
}

foreach ([
    "fetch(ME_ENDPOINT",
    "credentials: 'include'",
    "'Accept': 'application/json'",
    "const ME_ENDPOINT = '/account/api/me.php'",
    "const LOGOUT_ENDPOINT = '/account/api/logout.php'",
    "'X-CSRF-Token': csrfToken",
    "link('Můj účet', '/account')",
    "link('Nastavení', '/account/profile')",
    'Můj účet',
    'Nastavení',
    'Odhlásit se',
    'Přihlásit se',
    'Vytvořit účet',
    'textContent',
] as $contract) {
    sso_expect(str_contains($client, $contract), "Missing SSO client contract: {$contract}");
}

foreach (['document.cookie', 'localStorage', 'sessionStorage', '__vvsession', 'vevit_auth'] as $forbidden) {
    sso_expect(!str_contains($client, $forbidden), "SSO client must not access browser auth state: {$forbidden}");
}

$helper = is_file($root . '/lib/vevit-auth.php') ? (file_get_contents($root . '/lib/vevit-auth.php') ?: '') : '';
$meEndpoint = is_file($root . '/api/auth/me.php') ? (file_get_contents($root . '/api/auth/me.php') ?: '') : '';
$logoutEndpoint = is_file($root . '/api/auth/logout.php') ? (file_get_contents($root . '/api/auth/logout.php') ?: '') : '';
sso_expect(str_contains($helper, "const VEVIT_SESSION_COOKIE = '__vvsession'"), 'Shared helper must use the central session cookie.');
sso_expect(str_contains($helper, "getenv('VEVIT_HOME_CONFIG_PATH')"), 'Shared helper must support the server config path.');
sso_expect(str_contains($helper, '/etc/vevit/home.php'), 'Shared helper must support config outside document root.');
sso_expect(!is_file($root . '/api/config.php'), 'Active Home config must not exist in document root.');
sso_expect(str_contains($helper, "'domain' => '.vevit.cz'"), 'Shared cookie must use the approved .vevit.cz domain.');
sso_expect(str_contains($helper, 'VEVIT_AUTH_INCLUDED'), 'Shared helper must deny direct HTTP execution.');
sso_expect(str_contains($meEndpoint, 'requireVevitAuth($config)'), 'Local me endpoint must verify the central session server-side.');
sso_expect(str_contains($logoutEndpoint, 'requireVevitAuth($config)'), 'Local logout endpoint must verify the central session server-side.');
sso_expect(str_contains($logoutEndpoint, 'requireVevitCsrf($config)'), 'Local logout endpoint must enforce CSRF.');
sso_expect(str_contains($logoutEndpoint, 'logoutVevitSession($config)'), 'Local logout endpoint must invalidate the central session.');

foreach (['vevit_auth', 'password_verify(', 'signCookieData(', 'verifyCookieData(', 'DB_PASS', 'SECRET_KEY'] as $forbidden) {
    sso_expect(!str_contains($legacySources, $forbidden), "Legacy Portal auth remains active: {$forbidden}");
}

if ($failures !== []) {
    fwrite(STDERR, "account-sso-test: FAIL\n- " . implode("\n- ", $failures) . "\n");
    exit(1);
}

fwrite(STDOUT, "account-sso-test: PASS\n");
