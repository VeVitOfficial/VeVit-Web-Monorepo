<?php
declare(strict_types=1);

/**
 * Regression tests for the anti-bot gate (honeypot + timing) and the
 * per-identifier progressive backoff added to login/register/forgot-password.
 *
 * Run from the repository root:
 *   php tests/login-security-test.php
 */

define('LOGIN_ENDPOINT_NO_MAIN', true);
define('REGISTER_ENDPOINT_NO_MAIN', true);
define('FORGOT_PASSWORD_ENDPOINT_NO_MAIN', true);
require_once __DIR__ . '/../api/login.php';
require_once __DIR__ . '/../api/register.php';
require_once __DIR__ . '/../api/forgot-password.php';

function sec_scenario_metadata(): void {
  $status = http_response_code();
  fwrite(STDERR, "\n__SEC_META__" . json_encode([
    'status' => $status === false ? 200 : $status,
    'events' => $GLOBALS['_SEC_TEST_EVENTS'] ?? [],
  ]) . "\n");
}

/** Body that passes the honeypot/timing gate unless a case overrides it. */
function sec_body(array $fields): string {
  $fields += [
    'hp_confirm' => '',
    'hp_ts' => (int) round(microtime(true) * 1000) - 5000,
  ];
  return (string) json_encode($fields);
}

/** identifier_hash-scoped rows aged $secondsAgo seconds, oldest call wins ties. */
function sec_attempt_row(int $secondsAgo): array {
  return ['attempt_time' => gmdate('Y-m-d\TH:i:s\Z', time() - $secondsAgo)];
}

function sec_insert_logger(): callable {
  return static function (array $cfg, string $table, array $row): array {
    $GLOBALS['_SEC_TEST_EVENTS'][] = ['insert', $table, $row];
    return ['data' => $row];
  };
}

/** filtered_get: empty for IP-scoped (ip_address) queries, $rows for identifier-scoped ones. */
function sec_filtered_get_with_identifier_rows(array $rows): callable {
  return static function (array $cfg, string $table, array $filters) use ($rows): array {
    foreach ($filters as $filter) {
      if (($filter[0] ?? null) === 'identifier_hash') {
        return ['data' => $rows];
      }
    }
    return ['data' => []];
  };
}

function run_security_child(string $scenario): never {
  $GLOBALS['_SEC_TEST_EVENTS'] = [];
  register_shutdown_function('sec_scenario_metadata');

  $_SERVER = [
    'REQUEST_METHOD' => 'POST',
    'REMOTE_ADDR' => '198.51.100.5',
    'CONTENT_TYPE' => 'application/json',
    'HTTPS' => 'on',
  ];

  $findOneThrows = static function (): array {
    throw new RuntimeException('users-table lookup must not run');
  };

  switch ($scenario) {

    // ---- honeypot / timing: login ----------------------------------------

    case 'login:honeypot-filled':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => sec_insert_logger(),
        'find_one' => $findOneThrows,
      ];
      _login_run([], sec_body([
        'identifier' => 'someone@example.test',
        'password' => 'secret',
        'hp_confirm' => 'I am a bot',
      ]));
      break;

    case 'login:timing-too-fast':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => sec_insert_logger(),
        'find_one' => $findOneThrows,
      ];
      _login_run([], sec_body([
        'identifier' => 'someone@example.test',
        'password' => 'secret',
        'hp_ts' => (int) round(microtime(true) * 1000) - 100,
      ]));
      break;

    case 'login:timing-missing':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => sec_insert_logger(),
        'find_one' => $findOneThrows,
      ];
      $body = json_decode(sec_body(['identifier' => 'someone@example.test', 'password' => 'secret']), true);
      unset($body['hp_ts']);
      _login_run([], (string) json_encode($body));
      break;

    // ---- per-identifier backoff: login -------------------------------------

    case 'login:identifier-backoff-real-account':
    case 'login:identifier-backoff-fake-account':
      // Two attempts already logged for THIS identifier in the last minute —
      // tier [1 min, 2] trips regardless of whether the account is real.
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => sec_filtered_get_with_identifier_rows([
          sec_attempt_row(10),
          sec_attempt_row(20),
        ]),
        'insert' => sec_insert_logger(),
        'find_one' => $findOneThrows,
      ];
      $identifier = $scenario === 'login:identifier-backoff-real-account'
        ? 'real.account@example.test'
        : 'no-such-account@example.test';
      _login_run([], sec_body(['identifier' => $identifier, 'password' => 'whatever']));
      break;

    case 'login:identifier-backoff-under-threshold-proceeds':
      // Only one prior attempt in every window — no tier trips, so the
      // request must reach the users-table lookup (which then errors out,
      // proving it was actually reached rather than blocked earlier).
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => sec_filtered_get_with_identifier_rows([
          sec_attempt_row(10),
        ]),
        'insert' => sec_insert_logger(),
        'find_one' => static fn (): array => ['error' => 'database unavailable'],
      ];
      _login_run([], sec_body(['identifier' => 'someone@example.test', 'password' => 'whatever']));
      break;

    case 'login:identifier-backoff-sustained-window-blocks':
      // Short windows stay under their thresholds; only the 60-minute tier
      // (limit 12) accumulates enough rows — proves escalation is graduated
      // across tiers, not a single flat threshold.
      $rows = [
        sec_attempt_row(30),           // within 1/5/15/60 min
        sec_attempt_row(3 * 60),       // within 5/15/60 min
        sec_attempt_row(10 * 60),      // within 15/60 min
      ];
      for ($i = 0; $i < 9; $i++) {
        $rows[] = sec_attempt_row(45 * 60); // within 60 min only
      }
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => sec_filtered_get_with_identifier_rows($rows),
        'insert' => sec_insert_logger(),
        'find_one' => $findOneThrows,
      ];
      _login_run([], sec_body(['identifier' => 'someone@example.test', 'password' => 'whatever']));
      break;

    // ---- honeypot / timing: register ---------------------------------------

    case 'register:honeypot-filled':
      // register.php's final user-creation insert calls sb_insert()
      // directly (not the _auth_* DI layer) — only the IP attempt log
      // (logAttempt -> _auth_insert) and checkRateLimit's filtered_get are
      // mockable here. That's sufficient: if the anti-bot gate failed to
      // block, execution would fall through to a real (failing) Supabase
      // call and return a different error, which the assertions below catch.
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => sec_insert_logger(),
      ];
      _register_run([], sec_body([
        'email' => 'new@example.test',
        'nickname' => 'newperson',
        'full_name' => 'New Person',
        'password' => 'Valid12!',
        'password_confirmation' => 'Valid12!',
        'hp_confirm' => 'filled-by-a-bot',
      ]));
      break;

    case 'register:timing-too-fast':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => sec_insert_logger(),
      ];
      _register_run([], sec_body([
        'email' => 'new@example.test',
        'nickname' => 'newperson',
        'full_name' => 'New Person',
        'password' => 'Valid12!',
        'password_confirmation' => 'Valid12!',
        'hp_ts' => (int) round(microtime(true) * 1000) - 50,
      ]));
      break;

    // ---- honeypot / timing + identifier backoff: forgot-password -----------

    case 'forgot:honeypot-filled':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => sec_insert_logger(),
        'find_one' => $findOneThrows,
      ];
      _forgot_password_run([], sec_body([
        'email' => 'victim@example.test',
        'hp_confirm' => 'filled-by-a-bot',
      ]));
      break;

    case 'forgot:identifier-backoff-real-email':
    case 'forgot:identifier-backoff-fake-email':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => sec_filtered_get_with_identifier_rows([
          sec_attempt_row(10),
          sec_attempt_row(20),
        ]),
        'insert' => sec_insert_logger(),
        'find_one' => $findOneThrows,
      ];
      $email = $scenario === 'forgot:identifier-backoff-real-email'
        ? 'real.victim@example.test'
        : 'no-such-inbox@example.test';
      _forgot_password_run([], sec_body(['email' => $email]));
      break;

    default:
      fwrite(STDERR, "Unknown scenario: {$scenario}\n");
      exit(2);
  }

  exit(0);
}

function run_security_scenario(string $scenario): array {
  $process = proc_open(
    [PHP_BINARY, __FILE__, '--scenario', $scenario],
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
    && preg_match('/__SEC_META__(\{.*\})/', $stderr, $match) === 1
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
  run_security_child((string) ($argv[2] ?? ''));
}

$tests = 0;
$failures = [];

function sec_test(string $name, callable $callback): void {
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

function sec_assert_same(mixed $expected, mixed $actual): void {
  if ($actual !== $expected) {
    throw new RuntimeException(
      'expected ' . var_export($expected, true)
      . ', got ' . var_export($actual, true)
    );
  }
}

sec_test('login rejects a filled honeypot field with the generic throttle response', function (): void {
  $result = run_security_scenario('login:honeypot-filled');
  sec_assert_same(429, $result['meta']['status'] ?? null);
  sec_assert_same('{"error":"Příliš mnoho pokusů. Zkuste to za chvíli."}', $result['stdout']);
});

sec_test('login rejects a near-instant submit as bot timing', function (): void {
  $result = run_security_scenario('login:timing-too-fast');
  sec_assert_same(429, $result['meta']['status'] ?? null);
  sec_assert_same('{"error":"Příliš mnoho pokusů. Zkuste to za chvíli."}', $result['stdout']);
});

sec_test('login rejects a request missing the timing field', function (): void {
  $result = run_security_scenario('login:timing-missing');
  sec_assert_same(429, $result['meta']['status'] ?? null);
  sec_assert_same('{"error":"Příliš mnoho pokusů. Zkuste to za chvíli."}', $result['stdout']);
});

sec_test('login per-identifier backoff blocks identically for a real and a made-up account', function (): void {
  $real = run_security_scenario('login:identifier-backoff-real-account');
  $fake = run_security_scenario('login:identifier-backoff-fake-account');

  sec_assert_same(429, $real['meta']['status'] ?? null);
  sec_assert_same(429, $fake['meta']['status'] ?? null);
  // Byte-identical response: nothing distinguishes the two identifiers.
  sec_assert_same($real['stdout'], $fake['stdout']);
  sec_assert_same(
    '{"error":"Neplatné přihlašovací údaje."}',
    $real['stdout']
  );
});

sec_test('login per-identifier backoff still allows through under its threshold', function (): void {
  $result = run_security_scenario('login:identifier-backoff-under-threshold-proceeds');
  // Reaches the (mocked, failing) users-table lookup rather than being
  // blocked — proves the backoff is graduated, not a flat first-attempt cap.
  sec_assert_same(401, $result['meta']['status'] ?? null);
  sec_assert_same('{"error":"Neplatné přihlašovací údaje."}', $result['stdout']);
});

sec_test('login per-identifier backoff escalates on a sustained window even under short-window thresholds', function (): void {
  $result = run_security_scenario('login:identifier-backoff-sustained-window-blocks');
  sec_assert_same(429, $result['meta']['status'] ?? null);
  sec_assert_same('{"error":"Neplatné přihlašovací údaje."}', $result['stdout']);
});

sec_test('register rejects a filled honeypot field before writing a row', function (): void {
  $result = run_security_scenario('register:honeypot-filled');
  sec_assert_same(429, $result['meta']['status'] ?? null);
  sec_assert_same('{"error":"Příliš mnoho pokusů. Zkuste to za chvíli."}', $result['stdout']);
});

sec_test('register rejects a near-instant submit as bot timing', function (): void {
  $result = run_security_scenario('register:timing-too-fast');
  sec_assert_same(429, $result['meta']['status'] ?? null);
  sec_assert_same('{"error":"Příliš mnoho pokusů. Zkuste to za chvíli."}', $result['stdout']);
});

sec_test('forgot-password rejects a filled honeypot field', function (): void {
  $result = run_security_scenario('forgot:honeypot-filled');
  sec_assert_same(429, $result['meta']['status'] ?? null);
  sec_assert_same('{"error":"Příliš mnoho pokusů. Zkuste to za chvíli."}', $result['stdout']);
});

sec_test('forgot-password per-identifier backoff blocks identically for a real and a made-up email', function (): void {
  $real = run_security_scenario('forgot:identifier-backoff-real-email');
  $fake = run_security_scenario('forgot:identifier-backoff-fake-email');

  sec_assert_same(429, $real['meta']['status'] ?? null);
  sec_assert_same(429, $fake['meta']['status'] ?? null);
  sec_assert_same($real['stdout'], $fake['stdout']);
  sec_assert_same(
    '{"error":"Příliš mnoho pokusů. Zkuste to za hodinu."}',
    $real['stdout']
  );
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
