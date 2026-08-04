<?php
declare(strict_types=1);

/**
 * Static contract tests for the standalone login page.
 *
 * Run from the repository root:
 *   php tests/login-page-test.php
 */

$html = file_get_contents(__DIR__ . '/../login.html');
if (!is_string($html)) {
  fwrite(STDERR, "Unable to load login.html\n");
  exit(1);
}

$tests = 0;
$failures = [];

function login_page_test(string $name, callable $callback): void {
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

function login_page_assert_contains(string $needle, string $haystack): void {
  if (!str_contains($haystack, $needle)) {
    throw new RuntimeException("missing {$needle}");
  }
}

function login_page_assert_not_contains(string $needle, string $haystack): void {
  if (str_contains($haystack, $needle)) {
    throw new RuntimeException("unexpected {$needle}");
  }
}

function login_page_assert_ordered(array $needles, string $haystack): void {
  $offset = 0;
  foreach ($needles as $needle) {
    $position = strpos($haystack, $needle, $offset);
    if ($position === false) {
      throw new RuntimeException("missing ordered value {$needle}");
    }
    $offset = $position + strlen($needle);
  }
}

login_page_test('login uses one form with email, password, and remember choice', function () use ($html): void {
  login_page_assert_contains('id="loginForm"', $html);
  login_page_assert_contains('id="inputEmail"', $html);
  login_page_assert_contains('id="inputPass"', $html);
  login_page_assert_contains('id="inputRemember"', $html);
  login_page_assert_contains('name="remember"', $html);
  login_page_assert_not_contains('id="stepEmail"', $html);
  login_page_assert_not_contains('id="stepPass"', $html);
});

login_page_test('login submission sends the unified identifier and remember boolean', function () use ($html): void {
  login_page_assert_contains(
    'body: JSON.stringify({ identifier: identifier, password: pass, remember: remember })',
    $html
  );
  login_page_assert_contains("loginForm.addEventListener('submit'", $html);
});

login_page_test('password visibility control is accessible', function () use ($html): void {
  login_page_assert_contains('id="toggleLoginPassword"', $html);
  login_page_assert_contains('type="button"', $html);
  login_page_assert_contains('aria-controls="inputPass"', $html);
  login_page_assert_contains('aria-pressed="false"', $html);
  login_page_assert_contains('aria-label="Zobrazit heslo"', $html);
  login_page_assert_contains("inputPass.type = passwordVisible ? 'text' : 'password'", $html);
  login_page_assert_contains("passwordVisible ? 'Skrýt heslo' : 'Zobrazit heslo'", $html);
});

login_page_test('girl animation uses supplied frames in exact order', function () use ($html): void {
  login_page_assert_ordered([
    './images/holka odkryté oči.png',
    './images/zakrývání 1.png',
    './images/zakrývání 2.png',
    './images/holka zakryté oči.png',
  ], $html);
  login_page_assert_contains('id="loginGirlFrame"', $html);
  login_page_assert_contains('alt=""', $html);
  login_page_assert_contains('aria-hidden="true"', $html);
  login_page_assert_contains('new Image()', $html);
});

login_page_test('girl animation cancels overlap and respects reduced motion', function () use ($html): void {
  login_page_assert_contains('window.clearTimeout(girlFrameTimer)', $html);
  login_page_assert_contains('girlFrameTimer = window.setTimeout', $html);
  login_page_assert_contains('110', $html);
  login_page_assert_contains("matchMedia('(prefers-reduced-motion: reduce)')", $html);
  login_page_assert_contains('currentGirlFrame = targetFrame', $html);
});

login_page_test('girl decoration stays fixed and cannot obstruct the form', function () use ($html): void {
  login_page_assert_contains('.login-girl {', $html);
  login_page_assert_contains('position:fixed', $html);
  login_page_assert_contains('right:0', $html);
  login_page_assert_contains('bottom:0', $html);
  login_page_assert_contains('pointer-events:none', $html);
  login_page_assert_contains('user-select:none', $html);
  login_page_assert_contains('object-position:bottom center', $html);
  login_page_assert_contains('overflow-x:hidden', $html);
  login_page_assert_not_contains('background:var(--bg)', $html);
  login_page_assert_contains('@media (max-width: 1120px)', $html);
  login_page_assert_contains('display:none', $html);
});

if ($failures !== []) {
  fwrite(STDERR, "\n" . count($failures) . "/{$tests} tests failed\n");
  exit(1);
}

fwrite(STDOUT, "\n{$tests} tests passed\n");
