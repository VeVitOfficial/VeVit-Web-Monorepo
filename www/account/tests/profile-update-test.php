<?php
declare(strict_types=1);

/**
 * Validation and static security contracts for profile updates.
 *
 * Run from the repository root:
 *   php tests/profile-update-test.php
 */

define('PROFILE_UPDATE_NO_MAIN', true);
require_once __DIR__ . '/../api/profile-update.php';

$tests = 0;
$failures = [];

function profile_update_test(string $name, callable $callback): void {
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

function profile_update_assert_same(mixed $expected, mixed $actual): void {
  if ($expected !== $actual) {
    throw new RuntimeException(
      'expected ' . var_export($expected, true) . ', got ' . var_export($actual, true)
    );
  }
}

function profile_update_assert_true(bool $value, string $message): void {
  if (!$value) throw new RuntimeException($message);
}

profile_update_test('profile nickname uses the registration policy', function (): void {
  $valid = profile_update_prepare_patch(
    ['nickname' => 'eva.n_24'],
    ['nickname' => 'old_name']
  );
  profile_update_assert_same('eva.n_24', $valid['patch']['nickname']);
  profile_update_assert_same([], $valid['errors']);

  $invalid = profile_update_prepare_patch(
    ['nickname' => '<script>'],
    ['nickname' => 'old_name']
  );
  profile_update_assert_same('nickname', $invalid['errors'][0]['field'] ?? null);
});

profile_update_test('only supported bounded profile fields enter the patch', function (): void {
  $result = profile_update_prepare_patch([
    'full_name' => '  Eva Nováková  ',
    'bio' => str_repeat('a', 301),
    'phone' => '  +420 123 456 789 ',
    'location' => ' Praha ',
    'birth_date' => 'not-a-date',
    'avatar_url' => 'https://attacker.test/avatar.png',
    'password' => 'must-not-enter-patch',
    'role' => 'admin',
  ], ['nickname' => 'eva']);

  profile_update_assert_same('Eva Nováková', $result['patch']['full_name']);
  profile_update_assert_same('+420 123 456 789', $result['patch']['phone']);
  profile_update_assert_same('Praha', $result['patch']['location']);
  profile_update_assert_true(!array_key_exists('avatar_url', $result['patch']), 'avatar_url accepted');
  profile_update_assert_true(!array_key_exists('password', $result['patch']), 'password accepted');
  profile_update_assert_true(!array_key_exists('role', $result['patch']), 'role accepted');
  profile_update_assert_same(['bio', 'birth_date'], array_column($result['errors'], 'field'));
});

profile_update_test('profile language accepts only supported application locales', function (): void {
  $valid = profile_update_prepare_patch(['language' => 'uk'], []);
  profile_update_assert_same('uk', $valid['patch']['language']);
  profile_update_assert_same([], $valid['errors']);
  $invalid = profile_update_prepare_patch(['language' => 'ru'], []);
  profile_update_assert_same('language', $invalid['errors'][0]['field'] ?? null);
});

profile_update_test('endpoint uses authenticated ownership and never returns update rows', function (): void {
  $source = file_get_contents(__DIR__ . '/../api/profile-update.php');
  if (!is_string($source)) throw new RuntimeException('unable to load endpoint');
  profile_update_assert_true(str_contains($source, "requireAuth"), 'authentication missing');
  profile_update_assert_true(str_contains($source, "['id' => \$user['id']]"), 'owner filter missing');
  profile_update_assert_true(str_contains($source, 'registerNicknameIsValid'), 'shared nickname policy missing');
  profile_update_assert_true(str_contains($source, "array_merge(\$user, \$patch)"), 'safe response projection missing');
  profile_update_assert_true(!str_contains($source, "\$res['data'][0]"), 'raw updated row returned');
});

if ($failures !== []) {
  fwrite(STDERR, "\n" . count($failures) . "/{$tests} tests failed\n");
  exit(1);
}

fwrite(STDOUT, "\n{$tests} tests passed\n");
