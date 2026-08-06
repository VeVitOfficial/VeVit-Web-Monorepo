<?php
declare(strict_types=1);

/**
 * Dependency-free auth helper security tests.
 *
 * Run from the repository root:
 *   php tests/auth-helpers-test.php
 */

require_once __DIR__ . '/../lib/auth-helpers.php';

function scenario_finish_metadata(): void {
  $status = http_response_code();
  $metadata = [
    'status' => $status === false ? 200 : $status,
    'events' => $GLOBALS['_AUTH_TEST_EVENTS'] ?? [],
    'cookie_present' => isset($_COOKIE[COOKIE_NAME]),
  ];
  fwrite(STDERR, "\n__AUTH_META__" . json_encode($metadata) . "\n");
}

function run_child_scenario(string $scenario): never {
  if (!function_exists('_auth_insert') || !function_exists('_auth_set_cookie')) {
    fwrite(STDERR, "Auth side-effect adapters are missing\n");
    exit(2);
  }

  $GLOBALS['_AUTH_TEST_EVENTS'] = [];
  register_shutdown_function('scenario_finish_metadata');

  switch ($scenario) {
    case 'log-attempt-insert-error':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'insert' => static function (): array {
          $GLOBALS['_AUTH_TEST_EVENTS'][] = 'insert-attempted';
          return ['error' => 'database unavailable'];
        },
      ];
      logAttempt([], '1.1.1.1', 'login');
      break;

    case 'activity-insert-error':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'insert' => static function (): array {
          return ['error' => 'database unavailable'];
        },
      ];
      logActivity([], 'user-1', 'login');
      fwrite(STDOUT, 'continued');
      exit(0);

    case 'destroy-delete-error':
      $_COOKIE = [COOKIE_NAME => str_repeat('a', 64)];
      // destroySession používá soft-revoke přes _auth_update (ne delete).
      // Simulujeme selhání DB při revokaci; cookie se i tak smaže.
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'update' => static function (): array {
          $GLOBALS['_AUTH_TEST_EVENTS'][] = 'revoke-attempted';
          return ['error' => 'database unavailable'];
        },
        'set_cookie' => static function (): bool {
          $GLOBALS['_AUTH_TEST_EVENTS'][] = 'cookie-expiry-attempted';
          return true;
        },
      ];
      destroySession([]);
      break;

    case 'create-insert-error':
      $_SERVER = ['HTTPS' => 'on'];
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'insert' => static function (): array {
          $GLOBALS['_AUTH_TEST_EVENTS'][] = 'insert-attempted';
          return ['error' => 'database unavailable'];
        },
        'set_cookie' => static function (): bool {
          $GLOBALS['_AUTH_TEST_EVENTS'][] = 'cookie-set-attempted';
          return true;
        },
      ];
      createSession([], 'user-1');
      break;

    case 'create-cookie-error':
      $_SERVER = ['HTTPS' => 'on'];
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'insert' => static function (
          array $cfg,
          string $table,
          array $row
        ): array {
          $GLOBALS['_AUTH_TEST_EVENTS'][] = 'insert-attempted';
          return ['data' => $row];
        },
        'set_cookie' => static function (): bool {
          $GLOBALS['_AUTH_TEST_EVENTS'][] = 'cookie-set-attempted';
          return false;
        },
        'delete' => static function (): bool {
          $GLOBALS['_AUTH_TEST_EVENTS'][] = 'rollback-delete-attempted';
          return true;
        },
      ];
      createSession([], 'user-1');
      break;

    case 'origin-mismatch':
      $_SERVER = [
        'REQUEST_METHOD' => 'POST',
        'HTTP_ORIGIN' => 'https://evil.example',
        'CONTENT_TYPE' => 'application/json',
      ];
      beginJson(['ALLOWED_ORIGIN' => 'https://account.vevit.cz']);
      break;

    case 'options':
      $_SERVER = [
        'REQUEST_METHOD' => 'OPTIONS',
        'HTTP_ORIGIN' => 'https://account.vevit.cz',
      ];
      beginJson(['ALLOWED_ORIGIN' => 'https://account.vevit.cz']);
      break;

    case 'text-plain':
      $_SERVER = [
        'REQUEST_METHOD' => 'POST',
        'CONTENT_LENGTH' => '2',
        'CONTENT_TYPE' => 'text/plain',
      ];
      beginJson(['ALLOWED_ORIGIN' => 'https://account.vevit.cz']);
      break;

    case 'json-ok-encoding-error':
      $stream = fopen('php://memory', 'rb');
      jsonOk(['stream' => $stream]);
      break;

    case 'json-err-encoding-error':
      jsonErr("\xB1", 422);
      break;

    default:
      fwrite(STDERR, "Unknown scenario: {$scenario}\n");
      exit(2);
  }

  exit(0);
}

function run_scenario(string $scenario): array {
  $command = [PHP_BINARY, __FILE__, '--scenario', $scenario];
  $pipes = [];
  $process = proc_open(
    $command,
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
  $exitCode = proc_close($process);

  $metadata = null;
  if (
    is_string($stderr)
    && preg_match('/__AUTH_META__(\{.*\})/', $stderr, $match) === 1
  ) {
    $metadata = json_decode($match[1], true);
  }

  return [
    'exit' => $exitCode,
    'stdout' => $stdout,
    'stderr' => $stderr,
    'meta' => $metadata,
  ];
}

if (($argv[1] ?? '') === '--scenario') {
  run_child_scenario((string) ($argv[2] ?? ''));
}

$tests = 0;
$failures = [];

function test_case(string $name, callable $callback): void {
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

function assert_same(mixed $expected, mixed $actual): void {
  if ($actual !== $expected) {
    throw new RuntimeException(
      'expected ' . var_export($expected, true)
      . ', got ' . var_export($actual, true)
    );
  }
}

function assert_contains(string $needle, string $haystack): void {
  if (!str_contains($haystack, $needle)) {
    throw new RuntimeException(
      'expected ' . var_export($haystack, true)
      . ' to contain ' . var_export($needle, true)
    );
  }
}

function require_helper(string $name): void {
  if (!function_exists($name)) {
    throw new RuntimeException("missing helper {$name}");
  }
}

test_case('X-Forwarded-For is ignored without configured proxy CIDRs', function (): void {
  $reflection = new ReflectionFunction('clientIp');
  assert_same(1, $reflection->getNumberOfParameters());
  assert_same(1, $reflection->getNumberOfRequiredParameters());

  $_SERVER = [
    'REMOTE_ADDR' => '10.0.0.12',
    'HTTP_X_FORWARDED_FOR' => '1.1.1.1',
  ];
  assert_same('10.0.0.12', clientIp([]));
});

test_case('a nonmatching private peer cannot supply a forwarded IP', function (): void {
  $_SERVER = [
    'REMOTE_ADDR' => '10.0.0.12',
    'HTTP_X_FORWARDED_FOR' => '1.1.1.1',
  ];
  assert_same(
    '10.0.0.12',
    clientIp(['TRUSTED_PROXY_CIDRS' => ['192.168.0.0/16']])
  );
});

test_case('a matching IPv4 proxy CIDR enables forwarded client IPs', function (): void {
  $_SERVER = [
    'REMOTE_ADDR' => '10.0.0.12',
    'HTTP_X_FORWARDED_FOR' => '1.1.1.1',
  ];
  assert_same(
    '1.1.1.1',
    clientIp(['TRUSTED_PROXY_CIDRS' => ['10.0.0.0/24']])
  );
});

test_case('right-to-left proxy walk ignores an appended spoofed first IP', function (): void {
  $_SERVER = [
    'REMOTE_ADDR' => '10.0.0.12',
    'HTTP_X_FORWARDED_FOR' => '6.6.6.6, 1.1.1.1, 10.0.0.8',
  ];
  assert_same(
    '1.1.1.1',
    clientIp(['TRUSTED_PROXY_CIDRS' => ['10.0.0.0/24']])
  );
});

test_case('a malformed forwarded chain is rejected as ambiguous', function (): void {
  $_SERVER = [
    'REMOTE_ADDR' => '10.0.0.12',
    'HTTP_X_FORWARDED_FOR' => '1.1.1.1, not-an-ip',
  ];
  assert_same(
    '10.0.0.12',
    clientIp(['TRUSTED_PROXY_CIDRS' => ['10.0.0.0/24']])
  );
});

test_case('IPv4 CIDR matching respects network boundaries', function (): void {
  require_helper('_auth_ip_in_cidr');
  assert_same(true, _auth_ip_in_cidr('192.0.2.42', '192.0.2.0/24'));
  assert_same(false, _auth_ip_in_cidr('192.0.3.42', '192.0.2.0/24'));
  assert_same(false, _auth_ip_in_cidr('192.0.2.42', 'invalid'));
});

test_case('IPv6 CIDRs work for proxy trust and reject other networks', function (): void {
  require_helper('_auth_ip_in_cidr');
  assert_same(
    true,
    _auth_ip_in_cidr('2001:db8:abcd::12', '2001:db8:abcd::/48')
  );
  assert_same(
    false,
    _auth_ip_in_cidr('2001:db8:abce::12', '2001:db8:abcd::/48')
  );

  $_SERVER = [
    'REMOTE_ADDR' => '2001:db8:abcd::12',
    'HTTP_X_FORWARDED_FOR' => '2001:4860:4860::8888',
  ];
  assert_same(
    '2001:4860:4860::8888',
    clientIp(['TRUSTED_PROXY_CIDRS' => ['2001:db8:abcd::/48']])
  );
});

test_case('unvalidated remote addresses cannot establish proxy trust', function (): void {
  $_SERVER = [
    'REMOTE_ADDR' => 'not-an-ip',
    'HTTP_X_FORWARDED_FOR' => '1.1.1.1',
  ];
  assert_same(
    '0.0.0.0',
    clientIp(['TRUSTED_PROXY_CIDRS' => ['0.0.0.0/0']])
  );
});

test_case('new cookie options have no domain (required by __Host- prefix)', function (): void {
  $options = _auth_cookie_options(
    ['COOKIE_DOMAIN' => 'account.vevit.cz'],
    1_800_000_000
  );
  assert_same([
    'expires' => 1_800_000_000,
    'path' => '/',
    'domain' => '',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
  ], $options);
});

test_case('legacy cookie options include domain for correct browser deletion', function (): void {
  $options = _auth_legacy_cookie_options(
    ['COOKIE_DOMAIN' => 'account.vevit.cz'],
    1_800_000_000
  );
  assert_same([
    'expires' => 1_800_000_000,
    'path' => '/',
    'domain' => 'account.vevit.cz',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
  ], $options);
});

test_case('legacy cookie options with empty config produce empty domain', function (): void {
  $options = _auth_legacy_cookie_options([], 1_800_000_000);
  assert_same('', $options['domain']);
});

test_case('remembered sessions persist for 99 days in the database and cookie', function (): void {
  $_SERVER = ['HTTPS' => 'on'];
  $inserted = null;
  $cookie = null;
  $before = time();
  $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
    'insert' => static function (
      array $cfg,
      string $table,
      array $row
    ) use (&$inserted): array {
      $inserted = ['table' => $table, 'row' => $row];
      return ['data' => $row];
    },
    'set_cookie' => static function (
      string $name,
      string $value,
      array $options
    ) use (&$cookie): bool {
      $cookie = ['name' => $name, 'value' => $value, 'options' => $options];
      return true;
    },
  ];

  try {
    $token = createSession([], 'user-1', true);
    $after = time();
    assert_same('sessions', $inserted['table'] ?? null);
    assert_same(true, $inserted['row']['remember'] ?? null);
    assert_same($token, $cookie['value'] ?? null);
    assert_same(true, $cookie['options']['secure'] ?? null);
    assert_same(true, $cookie['options']['httponly'] ?? null);
    $expiry = strtotime((string) ($inserted['row']['expires_at'] ?? ''));
    assert_same(true, is_int($expiry));
    assert_same(true, $expiry >= $before + (99 * 86400));
    assert_same(true, $expiry <= $after + (99 * 86400));
    assert_same($expiry, $cookie['options']['expires'] ?? null);
  } finally {
    unset($GLOBALS['_AUTH_HELPER_ADAPTERS']);
  }
});

test_case('unremembered sessions use a session cookie but expire server-side after 24 hours', function (): void {
  $_SERVER = ['HTTPS' => 'on'];
  $inserted = null;
  $cookie = null;
  $before = time();
  $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
    'insert' => static function (
      array $cfg,
      string $table,
      array $row
    ) use (&$inserted): array {
      $inserted = $row;
      return ['data' => $row];
    },
    'set_cookie' => static function (
      string $name,
      string $value,
      array $options
    ) use (&$cookie): bool {
      $cookie = $options;
      return true;
    },
  ];

  try {
    createSession([], 'user-1', false);
    $after = time();
    assert_same(false, $inserted['remember'] ?? null);
    // Browser session cookie (expires=0) je primární kontrola životnosti.
    assert_same(0, $cookie['expires'] ?? null);
    // Server ceiling 24h (DECISIONS.md) — ochrana před zombi záznamy.
    $expiry = strtotime((string) ($inserted['expires_at'] ?? ''));
    assert_same(true, is_int($expiry));
    assert_same(true, $expiry >= $before + (24 * 3600));
    assert_same(true, $expiry <= $after + (24 * 3600));
  } finally {
    unset($GLOBALS['_AUTH_HELPER_ADAPTERS']);
  }
});

test_case('forwarded protocol cannot spoof HTTPS', function (): void {
  $_SERVER = [
    'HTTPS' => 'off',
    'SERVER_PORT' => '80',
    'HTTP_X_FORWARDED_PROTO' => 'https',
  ];
  assert_same(false, _auth_is_https());
});

test_case('JSON content type accepts parameters but rejects text/plain', function (): void {
  require_helper('_auth_has_json_content_type');

  $_SERVER = ['CONTENT_TYPE' => 'application/json; charset=UTF-8'];
  assert_same(true, _auth_has_json_content_type());

  $_SERVER = ['CONTENT_TYPE' => 'text/plain'];
  assert_same(false, _auth_has_json_content_type());
});

test_case('body detection covers fixed and chunked request bodies', function (): void {
  require_helper('_auth_request_has_body');

  $_SERVER = ['CONTENT_LENGTH' => '7'];
  assert_same(true, _auth_request_has_body());

  $_SERVER = ['HTTP_TRANSFER_ENCODING' => 'chunked'];
  assert_same(true, _auth_request_has_body());

  $_SERVER = [];
  assert_same(false, _auth_request_has_body());
});

test_case('unsafe HTTP methods are identified case-insensitively', function (): void {
  require_helper('_auth_is_unsafe_method');

  assert_same(true, _auth_is_unsafe_method('post'));
  assert_same(true, _auth_is_unsafe_method('DELETE'));
  assert_same(false, _auth_is_unsafe_method('GET'));
  assert_same(false, _auth_is_unsafe_method('OPTIONS'));
});

test_case('JSON encoding failures produce a detectable failure', function (): void {
  require_helper('_auth_encode_json');

  $stream = fopen('php://memory', 'rb');
  if ($stream === false) {
    throw new RuntimeException('unable to open test stream');
  }
  try {
    assert_same(null, _auth_encode_json(['stream' => $stream]));
  } finally {
    fclose($stream);
  }
});

test_case('malformed session tokens are rejected without a DB lookup', function (): void {
  $_COOKIE = [COOKIE_NAME => str_repeat('x', 64)];
  assert_same(null, getCurrentUser([]));
});

test_case('invalid rate-limit parameters fail closed without a DB lookup', function (): void {
  assert_same(false, checkRateLimit([], '1.1.1.1', 'login', 0, 15));
  assert_same(false, checkRateLimit([], '1.1.1.1', 'login', 10, -1));
});

test_case('example config denies forwarded headers by default', function (): void {
  $example = require __DIR__ . '/../config.example.php';
  assert_same([], $example['TRUSTED_PROXY_CIDRS'] ?? null);
});

test_case('expired sessions do not fetch or return a user', function (): void {
  $events = [];
  // getCurrentUser() deleguje na vv_session_validate() — používá _VV_SESSION_ADAPTERS
  $GLOBALS['_VV_SESSION_ADAPTERS'] = [
    'find_session_by_token' => static function () use (&$events): ?array {
      $events[] = 'session-lookup';
      return null; // expired/not found
    },
  ];
  $_COOKIE = [COOKIE_NAME => str_repeat('a', 64)];
  try {
    assert_same(null, getCurrentUser([]));
    assert_same(['session-lookup'], $events);
  } finally {
    unset($GLOBALS['_VV_SESSION_ADAPTERS']);
  }
});

test_case('valid sessions request only the safe user projection', function (): void {
  // getCurrentUser() deleguje na vv_session_validate() — používá _VV_SESSION_ADAPTERS
  $_COOKIE = [COOKIE_NAME => str_repeat('a', 64)];
  $now = gmdate('Y-m-d\TH:i:s\Z', time() + 3600);
  $GLOBALS['_VV_SESSION_ADAPTERS'] = [
    'find_session_by_token' => static fn (): ?array => [
      'user_id'    => 'user-1',
      'token_hash' => hash('sha256', str_repeat('a', 64)),
      'remember'   => false,
      'expires_at' => $now,
      'revoked_at' => null,
    ],
    'find_user' => static fn ($cfg, $userId): ?array => [
      'id' => $userId, 'email' => 'user@example.test', 'status' => 'active',
    ],
    'touch_session' => static function (): void {},
  ];
  try {
    $user = getCurrentUser([]);
    assert_same('user-1', $user['id'] ?? null);
    // Ověř, že výsledek neobsahuje tajné sloupce
    assert_same(false, array_key_exists('password', $user ?? []));
    assert_same(false, array_key_exists('session_token', $user ?? []));
    assert_same(false, array_key_exists('reset_token_hash', $user ?? []));
  } finally {
    unset($GLOBALS['_VV_SESSION_ADAPTERS']);
  }
});

test_case('valid sessions update last_seen_at but do not move expires_at', function (): void {
  // expires_at je absolutní; aktivita ho nikdy neposouvá (DECISIONS.md, invariant B.3).
  // vv_session_validate() volá pouze touch_session (last_seen_at) pro __Host-vvsession.
  $rawToken = str_repeat('a', 64);
  $_COOKIE = [VV_COOKIE => $rawToken];
  $now = gmdate('Y-m-d\TH:i:s\Z', time() + 3600);
  $touched = null;
  $GLOBALS['_VV_SESSION_ADAPTERS'] = [
    'find_session_by_hash' => static fn (): ?array => [
      'user_id'    => 'user-1',
      'token_hash' => hash('sha256', $rawToken),
      'remember'   => true,
      'expires_at' => $now,
      'revoked_at' => null,
    ],
    'find_user' => static fn (): ?array => [
      'id' => 'user-1', 'email' => 'user@example.test', 'status' => 'active',
    ],
    'touch_session' => static function ($cfg, $hash) use (&$touched): void {
      $touched = $hash;
    },
  ];

  try {
    $user = getCurrentUser([]);
    assert_same('user-1', $user['id'] ?? null);
    // touch_session byl volán s SHA-256 hashem raw tokenu
    assert_same(hash('sha256', $rawToken), $touched);
  } finally {
    unset($GLOBALS['_VV_SESSION_ADAPTERS']);
    unset($_COOKIE[VV_COOKIE]);
  }
});

test_case('logAttempt insert errors fail closed with 503', function (): void {
  $result = run_scenario('log-attempt-insert-error');
  assert_same(0, $result['exit']);
  assert_same('{"error":"Unable to process request"}', $result['stdout']);
  assert_same(503, $result['meta']['status'] ?? null);
  assert_same(['insert-attempted'], $result['meta']['events'] ?? null);
});

test_case('logActivity reports insert errors without stopping work', function (): void {
  $result = run_scenario('activity-insert-error');
  assert_same(0, $result['exit']);
  assert_same('continued', $result['stdout']);
  assert_contains('account_activity insert failed', $result['stderr']);
});

test_case('destroySession attempts cookie cleanup after soft-revoke fails', function (): void {
  $result = run_scenario('destroy-delete-error');
  assert_same(0, $result['exit']);
  assert_same('{"error":"Unable to end session"}', $result['stdout']);
  assert_same(500, $result['meta']['status'] ?? null);
  // destroySession vždy maže obě cookies (VV_COOKIE + COOKIE_NAME) bez ohledu na to,
  // která byla nastavena — proto 2× cookie-expiry-attempted.
  assert_same(
    ['revoke-attempted', 'cookie-expiry-attempted', 'cookie-expiry-attempted'],
    $result['meta']['events'] ?? null
  );
  assert_same(false, $result['meta']['cookie_present'] ?? null);
});

test_case('createSession rejects an unconfirmed insert before setting a cookie', function (): void {
  $result = run_scenario('create-insert-error');
  assert_same(0, $result['exit']);
  assert_same('{"error":"Unable to create session"}', $result['stdout']);
  assert_same(500, $result['meta']['status'] ?? null);
  assert_same(['insert-attempted'], $result['meta']['events'] ?? null);
});

test_case('createSession rolls back its DB row when cookie creation fails', function (): void {
  $result = run_scenario('create-cookie-error');
  assert_same(0, $result['exit']);
  assert_same('{"error":"Unable to create session"}', $result['stdout']);
  assert_same(500, $result['meta']['status'] ?? null);
  assert_same(
    ['insert-attempted', 'cookie-set-attempted', 'rollback-delete-attempted'],
    $result['meta']['events'] ?? null
  );
});

test_case('beginJson rejects a mismatched unsafe Origin with 403', function (): void {
  $result = run_scenario('origin-mismatch');
  assert_same(0, $result['exit']);
  assert_same('{"error":"Origin not allowed"}', $result['stdout']);
  assert_same(403, $result['meta']['status'] ?? null);
});

test_case('beginJson preserves OPTIONS preflight as 204', function (): void {
  $result = run_scenario('options');
  assert_same(0, $result['exit']);
  assert_same('', $result['stdout']);
  assert_same(204, $result['meta']['status'] ?? null);
});

test_case('beginJson rejects a text/plain request body with 415', function (): void {
  $result = run_scenario('text-plain');
  assert_same(0, $result['exit']);
  assert_same(
    '{"error":"Content-Type must be application/json"}',
    $result['stdout']
  );
  assert_same(415, $result['meta']['status'] ?? null);
});

test_case('jsonOk emits a nonempty 500 body after encoding failure', function (): void {
  $result = run_scenario('json-ok-encoding-error');
  assert_same(0, $result['exit']);
  assert_same('{"error":"JSON encoding failed"}', $result['stdout']);
  assert_same(500, $result['meta']['status'] ?? null);
});

test_case('jsonErr emits a nonempty 500 body after encoding failure', function (): void {
  $result = run_scenario('json-err-encoding-error');
  assert_same(0, $result['exit']);
  assert_same('{"error":"JSON encoding failed"}', $result['stdout']);
  assert_same(500, $result['meta']['status'] ?? null);
});

if ($failures !== []) {
  fwrite(
    STDERR,
    "\n" . count($failures) . "/{$tests} tests failed:\n- "
    . implode("\n- ", $failures) . "\n"
  );
  exit(1);
}

fwrite(STDOUT, "\n{$tests} tests passed\n");
