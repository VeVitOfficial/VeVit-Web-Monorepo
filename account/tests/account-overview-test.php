<?php
declare(strict_types=1);

/**
 * Pure and static contracts for the authenticated account overview.
 *
 * Run from the repository root:
 *   php tests/account-overview-test.php
 */

define('ACCOUNT_OVERVIEW_NO_MAIN', true);
require_once __DIR__ . '/../api/account-overview.php';

$tests = 0;
$failures = [];

function account_overview_test(string $name, callable $callback): void {
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

function account_overview_assert_same(mixed $expected, mixed $actual): void {
  if ($expected !== $actual) {
    throw new RuntimeException(
      'expected ' . var_export($expected, true) . ', got ' . var_export($actual, true)
    );
  }
}

function account_overview_assert_true(bool $value, string $message): void {
  if (!$value) throw new RuntimeException($message);
}

account_overview_test('profile completion reports concrete missing fields', function (): void {
  $summary = account_overview_profile([
    'full_name' => 'Eva Nováková',
    'nickname' => 'eva.n',
    'bio' => '',
    'location' => 'Praha',
    'birth_date' => null,
    'avatar_url' => '',
  ]);

  account_overview_assert_same(50, $summary['completion']);
  account_overview_assert_same(['bio', 'datum narození', 'profilová fotografie'], $summary['missing']);
});

account_overview_test('security summary uses active sessions and latest password event', function (): void {
  $summary = account_overview_security(
    ['two_factor_enabled' => true],
    [
      ['id' => 'session-1', 'expires_at' => '2099-01-01T00:00:00Z'],
      ['id' => 'session-2', 'expires_at' => '2099-01-02T00:00:00Z'],
    ],
    [
      ['kind' => 'password_change', 'created_at' => '2026-05-01T10:00:00Z'],
      ['kind' => 'login', 'created_at' => '2026-07-01T10:00:00Z'],
      ['kind' => 'password_change', 'created_at' => '2026-06-01T10:00:00Z'],
    ]
  );

  account_overview_assert_same(true, $summary['two_factor_enabled']);
  account_overview_assert_same(2, $summary['active_sessions']);
  account_overview_assert_same('2026-06-01T10:00:00Z', $summary['last_password_change']);
});

account_overview_test('activity is newest first, bounded, and field-safe', function (): void {
  $rows = [];
  for ($index = 0; $index < 12; $index++) {
    $rows[] = [
      'kind' => 'login',
      'detail' => str_repeat('x', 240),
      'created_at' => sprintf('2026-07-%02dT10:00:00Z', $index + 1),
      'user_id' => 'must-not-leak',
      'session_token' => 'must-not-leak',
    ];
  }

  $activity = account_overview_activity($rows);
  account_overview_assert_same(8, count($activity));
  account_overview_assert_same('2026-07-12T10:00:00Z', $activity[0]['created_at']);
  account_overview_assert_true(strlen($activity[0]['detail']) <= 160, 'detail must be bounded');
  account_overview_assert_true(!array_key_exists('user_id', $activity[0]), 'user_id leaked');
  account_overview_assert_true(!array_key_exists('session_token', $activity[0]), 'session token leaked');
});

account_overview_test('endpoint selects no authentication secrets', function (): void {
  $source = file_get_contents(__DIR__ . '/../api/account-overview.php');
  if (!is_string($source)) throw new RuntimeException('unable to load endpoint');
  foreach (['session_token', 'two_factor_secret', 'reset_token_hash'] as $secret) {
    account_overview_assert_true(!str_contains($source, "'{$secret}'"), "{$secret} selected");
  }
  account_overview_assert_true(str_contains($source, "REQUEST_METHOD"), 'method contract missing');
  account_overview_assert_true(str_contains($source, "requireAuth"), 'authentication missing');
});

if ($failures !== []) {
  fwrite(STDERR, "\n" . count($failures) . "/{$tests} tests failed\n");
  exit(1);
}

fwrite(STDOUT, "\n{$tests} tests passed\n");
