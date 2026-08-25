<?php
declare(strict_types=1);

/**
 * Contracts for the server-side OAuth integration.
 * Run: php tests/oauth-test.php
 */

require_once __DIR__ . '/../lib/oauth.php';

$tests = 0;
$failures = [];
function oauth_test(string $name, callable $callback): void {
  global $tests, $failures;
  $tests++;
  try { $callback(); fwrite(STDOUT, "PASS {$name}\n"); }
  catch (Throwable $error) {
    $failures[] = "{$name}: {$error->getMessage()}";
    fwrite(STDERR, "FAIL {$name}: {$error->getMessage()}\n");
  }
}
function oauth_same(mixed $expected, mixed $actual): void {
  if ($expected !== $actual) throw new RuntimeException('expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
}
function oauth_true(bool $condition, string $message = 'expected true'): void {
  if (!$condition) throw new RuntimeException($message);
}

oauth_test('only Google GitHub and Discord are accepted providers', function (): void {
  oauth_true(oauth_provider_allowed('google'));
  oauth_true(oauth_provider_allowed('github'));
  oauth_true(oauth_provider_allowed('discord'));
  oauth_true(!oauth_provider_allowed('apple'));
  oauth_true(!oauth_provider_allowed('../google'));
});

oauth_test('PKCE verifier creates a URL-safe S256 challenge', function (): void {
  $challenge = oauth_pkce_challenge('A' . str_repeat('b', 63));
  oauth_same(43, strlen($challenge));
  oauth_true(preg_match('/\A[A-Za-z0-9_-]{43}\z/', $challenge) === 1);
});

oauth_test('only allowlisted login errors are shown to users', function (): void {
  oauth_same('oauth_failed', oauth_safe_error_code('anything-from-provider'));
  oauth_same('oauth_email_missing', oauth_safe_error_code('oauth_email_missing'));
  oauth_true(str_contains(oauth_error_message('oauth_email_unverified'), 'ověřen'));
});

oauth_test('callback URLs always use the configured origin and provider allowlist', function (): void {
  $cfg = ['APP_URL' => 'https://account.vevit.cz/'];
  oauth_same('https://account.vevit.cz/api/oauth/discord/callback.php', oauth_callback_url($cfg, 'discord'));
  oauth_same('', oauth_callback_url($cfg, 'apple'));
});

oauth_test('migration protects identities and one-time OAuth attempts', function (): void {
  $sql = file_get_contents(__DIR__ . '/../sql/migrations/006_oauth_identities.sql');
  if (!is_string($sql)) throw new RuntimeException('missing OAuth migration');
  foreach ([
    'CREATE TABLE IF NOT EXISTS public.oauth_identities',
    "CHECK (provider IN ('google', 'github', 'discord'))",
    'UNIQUE (provider, provider_user_id)',
    'CREATE TABLE IF NOT EXISTS public.oauth_attempts',
    'state_hash',
    'used_at',
    'ENABLE ROW LEVEL SECURITY',
  ] as $needle) oauth_true(str_contains($sql, $needle), "missing {$needle}");
  oauth_true(!str_contains(strtolower($sql), 'apple'));
});

oauth_test('OAuth endpoints and pages use no Apple provider', function (): void {
  foreach ([
    'api/oauth/start.php',
    'api/oauth/callback-common.php',
    'api/oauth/google/callback.php',
    'api/oauth/github/callback.php',
    'api/oauth/discord/callback.php',
    'onboarding.php',
  ] as $path) oauth_true(is_file(__DIR__ . '/../' . $path), "missing {$path}");
  foreach (['login.html', 'register.html'] as $path) {
    $source = (string) file_get_contents(__DIR__ . '/../' . $path);
    foreach (['Pokračovat přes Google', 'Pokračovat přes GitHub', 'Pokračovat přes Discord'] as $label) {
      oauth_true(str_contains($source, $label), "{$path} missing {$label}");
    }
    oauth_true(!str_contains(strtolower($source), 'apple'));
  }
});

if ($failures !== []) { fwrite(STDERR, "\n" . count($failures) . "/{$tests} tests failed\n"); exit(1); }
fwrite(STDOUT, "\n{$tests} tests passed\n");
