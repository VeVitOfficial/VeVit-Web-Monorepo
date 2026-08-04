<?php

declare(strict_types=1);

$helper = dirname(__DIR__) . '/lib/vevit-auth.php';
if (!is_file($helper)) {
    fwrite(STDERR, "vevit-auth-test: FAIL\n- Missing lib/vevit-auth.php\n");
    exit(1);
}
require_once $helper;

$failures = [];
function auth_expect(bool $condition, string $message): void
{
    global $failures;
    if (!$condition) $failures[] = $message;
}

$config = [
    'supabase_url' => 'https://ooxlxveagkxejlposfsi.supabase.co',
    'service_role' => 'server-test-key',
    'csrf_secret' => 'csrf-test-key',
    'cookie_domain' => '.vevit.cz',
    'allowed_origins' => ['https://vevit.cz'],
];

$options = vevitAuthCookieOptions($config, 1800000000);
auth_expect($options === [
    'expires' => 1800000000,
    'path' => '/',
    'domain' => '.vevit.cz',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
], 'Cookie attributes do not match the central session contract.');
$modernHeaders = vevitSupabaseHeaders('sb_secret_home_test_value');
$legacyHeaders = vevitSupabaseHeaders('legacy-jwt-test-value');
auth_expect(!in_array('Authorization: Bearer sb_secret_home_test_value', $modernHeaders, true), 'Modern Supabase secret must not be sent as Bearer.');
auth_expect(in_array('Authorization: Bearer legacy-jwt-test-value', $legacyHeaders, true), 'Legacy transition must retain its required Bearer header.');
auth_expect(vevitMaskEmail('jan.novak@example.cz') === 'j***@example.cz', 'Email masking failed.');

$token = str_repeat('a', 64);
$_COOKIE = [VEVIT_SESSION_COOKIE => $token];
auth_expect(strlen(currentVevitCsrfToken($config)) === 64, 'Session-bound CSRF token is invalid.');
auth_expect(currentVevitCsrfToken($config) !== $token, 'CSRF response must not expose the session token.');
auth_expect(vevitOriginAllowed($config, 'https://vevit.cz'), 'Trusted Origin was rejected.');
auth_expect(!vevitOriginAllowed($config, 'https://vevit.cz.evil.example'), 'Lookalike Origin was accepted.');
$GLOBALS['_VEVIT_AUTH_ADAPTERS'] = [
    'find_session' => static fn () => [
        'user_id' => 'user-1',
        'expires_at' => gmdate('c', time() + 3600),
    ],
    'find_user' => static fn () => [
        'id' => 'user-1',
        'full_name' => 'Jan Novák',
        'nickname' => 'jan',
        'email' => 'jan.novak@example.cz',
        'avatar_url' => '/uploads/avatar.webp',
        'password' => 'must-not-leak',
    ],
];
$user = optionalVevitAuth($config);
auth_expect(($user['id'] ?? null) === 'user-1', 'Valid session was not accepted.');
auth_expect(!array_key_exists('password', $user ?? []), 'Sensitive user data leaked.');

$GLOBALS['_VEVIT_AUTH_ADAPTERS']['find_session'] = static fn () => [
    'user_id' => 'user-1',
    'expires_at' => gmdate('c', time() - 60),
];
auth_expect(optionalVevitAuth($config) === null, 'Expired session was accepted.');
$GLOBALS['_VEVIT_AUTH_ADAPTERS']['find_session'] = static fn () => null;
auth_expect(optionalVevitAuth($config) === null, 'Revoked or missing session was accepted.');

unset($GLOBALS['_VEVIT_AUTH_ADAPTERS']);
unset($_COOKIE[VEVIT_SESSION_COOKIE]);

if ($failures !== []) {
    fwrite(STDERR, "vevit-auth-test: FAIL\n- " . implode("\n- ", $failures) . "\n");
    exit(1);
}
fwrite(STDOUT, "vevit-auth-test: PASS\n");
