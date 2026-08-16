<?php
declare(strict_types=1);

/**
 * Contracts for the authenticated profile-avatar upload flow.
 *
 * Run from the repository root:
 *   php tests/avatar-upload-test.php
 */

require_once __DIR__ . '/../lib/avatar-storage.php';

$tests = 0;
$failures = [];

function avatar_test(string $name, callable $callback): void {
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

function avatar_assert_same(mixed $expected, mixed $actual): void {
  if ($expected !== $actual) {
    throw new RuntimeException('expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
  }
}

function avatar_assert_true(bool $value, string $message): void {
  if (!$value) throw new RuntimeException($message);
}

avatar_test('only supported image MIME types receive an extension', function (): void {
  avatar_assert_same('jpg', avatar_extension_for_mime('image/jpeg'));
  avatar_assert_same('png', avatar_extension_for_mime('image/png'));
  avatar_assert_same('webp', avatar_extension_for_mime('image/webp'));
  avatar_assert_same(null, avatar_extension_for_mime('image/svg+xml'));
  avatar_assert_same(null, avatar_extension_for_mime('text/plain'));
});

avatar_test('storage avatar values are opaque paths scoped to the signed-in user', function (): void {
  $value = avatar_storage_value('user-42', '0123456789abcdef0123456789abcdef', 'webp');
  avatar_assert_same('storage:user-42/0123456789abcdef0123456789abcdef.webp', $value);
  avatar_assert_same('user-42/0123456789abcdef0123456789abcdef.webp', avatar_storage_path($value, 'user-42'));
  avatar_assert_same(null, avatar_storage_path($value, 'another-user'));
  avatar_assert_same(null, avatar_storage_path('https://example.test/avatar.png', 'user-42'));
});

avatar_test('avatar feature keeps files private and uses authenticated endpoints', function (): void {
  $migration = file_get_contents(__DIR__ . '/../sql/migrations/008_avatar_storage.sql');
  $upload = file_get_contents(__DIR__ . '/../api/avatar-upload.php');
  $serve = file_get_contents(__DIR__ . '/../api/avatar.php');
  $page = file_get_contents(__DIR__ . '/../index.html');
  if (!is_string($migration) || !is_string($upload) || !is_string($serve) || !is_string($page)) {
    throw new RuntimeException('avatar feature files are missing');
  }
  avatar_assert_true(str_contains($migration, "'vevit-avatars'"), 'private avatar bucket missing');
  avatar_assert_true(str_contains($migration, 'false'), 'avatar bucket must not be public');
  avatar_assert_true(str_contains($upload, 'beginMultipart'), 'upload must validate multipart requests');
  avatar_assert_true(str_contains($upload, 'requireAuth'), 'upload authentication missing');
  avatar_assert_true(str_contains($serve, 'requireAuth'), 'private image endpoint authentication missing');
  avatar_assert_true(str_contains($page, 'id="avatarUploadInput"'), 'upload input missing from profile');
});

avatar_test('profile photograph itself is the accessible upload trigger', function (): void {
  $page = file_get_contents(__DIR__ . '/../index.html');
  $script = file_get_contents(__DIR__ . '/../assets/app.js');
  if (!is_string($page) || !is_string($script)) throw new RuntimeException('profile UI files are missing');
  avatar_assert_true(str_contains($page, 'id="avatarUploadTrigger"'), 'clickable avatar trigger missing');
  avatar_assert_true(str_contains($page, 'aria-controls="avatarUploadInput"'), 'avatar trigger must describe its controlled input');
  avatar_assert_true(!str_contains($page, 'id="avatarUploadBtn"'), 'separate upload button must not remain');
  avatar_assert_true(str_contains($script, "$('avatarUploadTrigger').addEventListener('click'"), 'click handler missing');
});

avatar_test('account assets use the current cache version', function (): void {
  $page = file_get_contents(__DIR__ . '/../index.html');
  if (!is_string($page)) throw new RuntimeException('account page is missing');
  avatar_assert_true(str_contains($page, 'app.js?v=20260728-totp-2fa'), 'new account handlers may be hidden behind cached JavaScript');
  avatar_assert_true(str_contains($page, 'styles.css?v=20260728-totp-2fa'), 'new account styles may be hidden behind cached CSS');
});

avatar_test('avatar endpoints fail safely when a deployment misses their library', function (): void {
  foreach (['avatar-upload.php', 'avatar-remove.php', 'avatar.php'] as $endpoint) {
    $source = file_get_contents(__DIR__ . '/../api/' . $endpoint);
    if (!is_string($source)) throw new RuntimeException("missing {$endpoint}");
    avatar_assert_true(str_contains($source, "is_file(\$avatarStorage)"), "{$endpoint} exposes a PHP fatal on incomplete deployment");
    avatar_assert_true(str_contains($source, 'Služba profilových fotografií není dostupná.'), "{$endpoint} has no safe deployment error");
  }
});

if ($failures !== []) {
  fwrite(STDERR, "\n" . count($failures) . "/{$tests} tests failed\n");
  exit(1);
}

fwrite(STDOUT, "\n{$tests} tests passed\n");
