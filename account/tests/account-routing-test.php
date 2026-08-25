<?php
declare(strict_types=1);

/**
 * Static and pure-function contracts for canonical account routes.
 *
 * Run from the repository root:
 *   php tests/account-routing-test.php
 */

define('LOGIN_GATE_NO_MAIN', true);
require_once __DIR__ . '/../index.php';

$tests = 0;
$failures = [];

function account_routing_test(string $name, callable $callback): void {
  global $tests, $failures;
  $tests++;
  try {
    $callback();
    fwrite(STDOUT, "PASS {$name}\n");
  } catch (Throwable $error) {
    $failures[] = "{$name}: {$error->getMessage()}";
    fwrite(STDERR, "FAIL {$name}: {$error->getMessage()}\n");
  }
}

function account_routing_assert_same(mixed $expected, mixed $actual): void {
  if ($expected !== $actual) {
    throw new RuntimeException(
      'expected ' . var_export($expected, true) . ', got ' . var_export($actual, true)
    );
  }
}

function account_routing_assert_contains(string $needle, string $haystack): void {
  if (!str_contains($haystack, $needle)) {
    throw new RuntimeException("missing {$needle}");
  }
}

account_routing_test('canonical paths resolve to the approved section keys', function (): void {
  $routes = [
    '/' => 'overview',
    '/index.html' => 'overview',
    '/account' => 'overview',
    '/account/' => 'overview',
    '/account/profile' => 'profile',
    '/account/security?from=overview' => 'security',
    '/account/billing/' => 'billing',
    '/account/connections' => 'connections',
    '/account/notifications' => 'notifications',
    '/account/preferences' => 'preferences',
    '/account/privacy' => 'privacy',
  ];

  foreach ($routes as $uri => $expected) {
    account_routing_assert_same($expected, account_route_from_uri($uri));
  }
});

account_routing_test('unknown or malformed account routes fall back to overview', function (): void {
  account_routing_assert_same('overview', account_route_from_uri('/account/not-real'));
  account_routing_assert_same('overview', account_route_from_uri('/account/profile/extra'));
  account_routing_assert_same('overview', account_route_from_uri('https://example.test/account/billing'));
});

account_routing_test('Apache internally serves account paths through the auth gate', function (): void {
  $rules = file_get_contents(__DIR__ . '/../.htaccess');
  if (!is_string($rules)) {
    throw new RuntimeException('unable to load .htaccess');
  }

  account_routing_assert_contains('RewriteRule ^(/.*)?$ index.php [L,QSA]', $rules);
  account_routing_assert_contains('index.php [L,QSA]', $rules);
  account_routing_assert_contains('^login/?$', $rules);
});

if ($failures !== []) {
  fwrite(STDERR, "\n" . count($failures) . "/{$tests} tests failed\n");
  exit(1);
}

fwrite(STDOUT, "\n{$tests} tests passed\n");
