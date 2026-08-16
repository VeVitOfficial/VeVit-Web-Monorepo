<?php
declare(strict_types=1);

/**
 * Tests for the server-side account login gate.
 *
 * Run from the repository root:
 *   php tests/login-gate-test.php
 */

function login_gate_metadata(): void {
  $status = http_response_code();
  fwrite(STDERR, "\n__LOGIN_GATE_META__" . json_encode([
    'status' => $status === false ? 200 : $status,
  ]) . "\n");
}

function login_gate_child(string $scenario, string $requestUri = '/'): never {
  register_shutdown_function('login_gate_metadata');
  define('LOGIN_GATE_NO_MAIN', true);
  require_once __DIR__ . '/../index.php';

  $_SERVER = ['HTTPS' => 'on', 'REQUEST_URI' => $requestUri];
  $_COOKIE = [];

  if ($scenario === 'guest') {
    login_gate_run([]);
  }

  if ($scenario === 'member' || $scenario === 'incomplete-member') {
    $_COOKIE = [COOKIE_NAME => str_repeat('a', 64)];
    $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
      'filtered_get' => static fn (): array => [
        'data' => [['user_id' => 'user-1', 'remember' => false]],
      ],
      'find_one' => static function () use ($scenario): array {
        return ['data' => $scenario === 'member'
          ? ['id' => 'user-1', 'email' => 'user@example.test', 'full_name' => 'Jan Novák', 'nickname' => 'jan.novak']
          : ['id' => 'user-1', 'email' => 'user@example.test', 'full_name' => 'Jan Novák', 'nickname' => null]];
      },
      'update' => static fn (): array => ['data' => []],
      'set_cookie' => static fn (): bool => true,
    ];
    login_gate_run([]);
  }

  fwrite(STDERR, "Unknown scenario: {$scenario}\n");
  exit(2);
}

function run_login_gate(string $scenario, string $requestUri = '/'): array {
  $process = proc_open(
    [PHP_BINARY, __FILE__, '--scenario', $scenario, $requestUri],
    [
      0 => ['pipe', 'r'],
      1 => ['pipe', 'w'],
      2 => ['pipe', 'w'],
    ],
    $pipes
  );
  if (!is_resource($process)) {
    throw new RuntimeException('unable to start PHP subprocess');
  }

  fclose($pipes[0]);
  $stdout = stream_get_contents($pipes[1]);
  $stderr = stream_get_contents($pipes[2]);
  fclose($pipes[1]);
  fclose($pipes[2]);
  $exit = proc_close($process);
  $meta = null;
  if (preg_match('/__LOGIN_GATE_META__(\{.*\})/', $stderr, $match) === 1) {
    $meta = json_decode($match[1], true);
  }

  return ['exit' => $exit, 'stdout' => $stdout, 'meta' => $meta];
}

if (($argv[1] ?? '') === '--scenario') {
  login_gate_child((string) ($argv[2] ?? ''), (string) ($argv[3] ?? '/'));
}

$tests = 0;
$failures = [];

function login_gate_test(string $name, callable $callback): void {
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

function login_gate_assert_same(mixed $expected, mixed $actual): void {
  if ($expected !== $actual) {
    throw new RuntimeException('expected ' . var_export($expected, true)
      . ', got ' . var_export($actual, true));
  }
}

function login_gate_assert_contains(string $needle, string $haystack): void {
  if (!str_contains($haystack, $needle)) {
    throw new RuntimeException("missing {$needle}");
  }
}

login_gate_test('guests receive a redirect status before account HTML', function (): void {
  $result = run_login_gate('guest');
  login_gate_assert_same(0, $result['exit']);
  login_gate_assert_same(302, $result['meta']['status'] ?? null);
  login_gate_assert_same('', $result['stdout']);
});

login_gate_test('members receive the account HTML', function (): void {
  $result = run_login_gate('member', '/account/profile');
  login_gate_assert_same(0, $result['exit']);
  login_gate_assert_same(200, $result['meta']['status'] ?? null);
  login_gate_assert_contains('id="app"', $result['stdout']);
  login_gate_assert_contains('id="vv-bootstrap"', $result['stdout']);
  login_gate_assert_contains('data-route="profile"', $result['stdout']);
  login_gate_assert_contains('&quot;id&quot;:&quot;user-1&quot;', $result['stdout']);
});

login_gate_test('incomplete members are routed to onboarding instead of an account loading state', function (): void {
  $result = run_login_gate('incomplete-member', '/account');
  login_gate_assert_same(0, $result['exit']);
  login_gate_assert_same(302, $result['meta']['status'] ?? null);
  login_gate_assert_same('', $result['stdout']);
});

login_gate_test('Apache maps root, index page, and login route correctly', function (): void {
  $rules = file_get_contents(__DIR__ . '/../.htaccess');
  if (!is_string($rules)) {
    throw new RuntimeException('unable to load .htaccess');
  }
  login_gate_assert_contains('DirectoryIndex index.php', $rules);
  login_gate_assert_contains('^login/?$', $rules);
  login_gate_assert_contains('^$', $rules);
  login_gate_assert_contains('^index\\.html$', $rules);
});

if ($failures !== []) {
  fwrite(STDERR, "\n" . count($failures) . "/{$tests} tests failed\n");
  exit(1);
}

fwrite(STDOUT, "\n{$tests} tests passed\n");
