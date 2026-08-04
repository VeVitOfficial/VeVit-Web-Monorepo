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
    "const ME_ENDPOINT = '/api/auth/me.php'",
    "const LOGOUT_ENDPOINT = '/api/auth/logout.php'",
    "'X-CSRF-Token': csrfToken",
    "https://account.vevit.cz/account",
    "https://account.vevit.cz/account/profile",
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
$serverConfig = is_file($root . '/api/config.php') ? (file_get_contents($root . '/api/config.php') ?: '') : '';
$meEndpoint = is_file($root . '/api/auth/me.php') ? (file_get_contents($root . '/api/auth/me.php') ?: '') : '';
$logoutEndpoint = is_file($root . '/api/auth/logout.php') ? (file_get_contents($root . '/api/auth/logout.php') ?: '') : '';
sso_expect(str_contains($helper, "const VEVIT_SESSION_COOKIE = '__vvsession'"), 'Shared helper must use the central session cookie.');
sso_expect(str_contains($helper, "require __DIR__ . '/../api/config.php'"), 'Shared helper must load the central config.php.');
sso_expect(!str_contains($helper, "getenv('VEVIT_"), 'Auth keys must not be distributed across helper environment lookups.');
foreach (['supabase_url', 'service_role', 'csrf_secret', 'gemini_api_key', 'openrouter_api_key', 'cookie_domain', 'allowed_origins'] as $key) {
    sso_expect(str_contains($serverConfig, "'{$key}' =>"), "Central config.php is missing {$key}.");
}
sso_expect(str_contains($serverConfig, 'VEVIT_CONFIG_INCLUDED'), 'Central config.php must deny direct HTTP execution.');
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
