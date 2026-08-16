<?php
declare(strict_types=1);

/**
 * Dependency-free tests for api/login.php.
 *
 * Run from the repository root:
 *   php tests/login-test.php
 */

define('LOGIN_ENDPOINT_NO_MAIN', true);
require_once __DIR__ . '/../api/login.php';

function login_scenario_metadata(): void {
  $status = http_response_code();
  fwrite(STDERR, "\n__LOGIN_META__" . json_encode([
    'status' => $status === false ? 200 : $status,
    'events' => $GLOBALS['_LOGIN_TEST_EVENTS'] ?? [],
  ]) . "\n");
}

function run_login_child(string $scenario): never {
  $GLOBALS['_LOGIN_TEST_EVENTS'] = [];
  register_shutdown_function('login_scenario_metadata');

  $_SERVER = [
    'REQUEST_METHOD' => 'POST',
    'REMOTE_ADDR' => '192.0.2.20',
    'CONTENT_TYPE' => 'application/json',
    'HTTPS' => 'on',
  ];

  $attemptInsert = static function (
    array $cfg,
    string $table,
    array $row
  ): array {
    $GLOBALS['_LOGIN_TEST_EVENTS'][] = ['insert', $table, $row];
    return ['data' => $row];
  };

  switch ($scenario) {
    case 'method':
      $_SERVER['REQUEST_METHOD'] = 'GET';
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static function (): array {
          throw new RuntimeException('rate limit must not run');
        },
      ];
      _login_run([], '{}');
      break;

    case 'empty':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static function (
          array $cfg,
          string $table,
          array $filters,
          string $select,
          ?int $limit
        ): array {
          $GLOBALS['_LOGIN_TEST_EVENTS'][] = [
            'rate-limit',
            $table,
            $filters,
            $select,
            $limit,
          ];
          return ['data' => []];
        },
        'insert' => $attemptInsert,
      ];
      _login_run([], '{"email":"  ","password":"  "}');
      break;

    case 'limited':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static function (): array {
          return ['data' => array_fill(0, 10, ['id' => 'attempt'])];
        },
        'insert' => $attemptInsert,
        'find_one' => static function (): array {
          throw new RuntimeException('user lookup must not run');
        },
      ];
      _login_run([], '{"email":"user@example.test","password":"secret"}');
      break;

    case 'lookup-error':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => $attemptInsert,
        'find_one' => static function (
          array $cfg,
          string $table,
          array $eq,
          string $select
        ): array {
          $GLOBALS['_LOGIN_TEST_EVENTS'][] = [
            'find-one',
            $table,
            $eq,
            $select,
          ];
          return ['error' => 'database unavailable'];
        },
      ];
      _login_run([], '{"email":" USER@Example.Test ","password":"secret"}');
      break;

    case 'bad-password':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => $attemptInsert,
        'find_one' => static fn (): array => ['data' => [
          'id' => 'user-1',
          'email' => 'user@example.test',
          'password' => password_hash('right-password', PASSWORD_BCRYPT),
        ]],
      ];
      _login_run(
        [],
        '{"email":"user@example.test","password":"wrong-password"}'
      );
      break;

    case 'padded-password':
      $lookups = 0;
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => $attemptInsert,
        'set_cookie' => static fn (): bool => true,
        'find_one' => static function () use (&$lookups): array {
          $lookups++;
          if ($lookups === 1) {
            return ['data' => [
              'id' => 'user-1',
              'email' => 'user@example.test',
              'password' => password_hash('secret', PASSWORD_BCRYPT),
            ]];
          }
          return ['data' => [
            'id' => 'user-1',
            'email' => 'user@example.test',
          ]];
        },
      ];
      _login_run([], '{"email":"user@example.test","password":" secret "}');
      break;

    case 'invalid-remember':
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => $attemptInsert,
        'find_one' => static function (): array {
          throw new RuntimeException('user lookup must not run');
        },
      ];
      _login_run([], '{"email":"user@example.test","password":"secret","remember":"true"}');
      break;

    case 'final-fetch-error':
      $lookups = 0;
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => $attemptInsert,
        'set_cookie' => static function (
          string $name,
          string $value,
          array $options
        ): bool {
          $GLOBALS['_LOGIN_TEST_EVENTS'][] = [
            'cookie',
            $name,
            strlen($value),
            $options,
          ];
          return true;
        },
        'find_one' => static function (
          array $cfg,
          string $table,
          array $eq,
          string $select
        ) use (&$lookups): array {
          $lookups++;
          $GLOBALS['_LOGIN_TEST_EVENTS'][] = [
            'find-one',
            $table,
            $eq,
            $select,
          ];
          if ($lookups === 1) {
            return ['data' => [
              'id' => 'user-1',
              'email' => 'user@example.test',
              'password' => password_hash('secret', PASSWORD_BCRYPT),
            ]];
          }

          return ['error' => 'database unavailable'];
        },
      ];
      _login_run([], '{"email":"user@example.test","password":"secret"}');
      break;

    case 'success':
      $lookups = 0;
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static fn (): array => ['data' => []],
        'insert' => $attemptInsert,
        'set_cookie' => static fn (): bool => true,
        'find_one' => static function (
          array $cfg,
          string $table,
          array $eq,
          string $select
        ) use (&$lookups): array {
          $lookups++;
          $GLOBALS['_LOGIN_TEST_EVENTS'][] = [
            'find-one',
            $table,
            $eq,
            $select,
          ];
          if ($lookups === 1) {
            return ['data' => [
              'id' => 'user-1',
              'email' => 'user@example.test',
              'password' => password_hash('secret', PASSWORD_BCRYPT),
            ]];
          }

          return ['data' => [
            'id' => 'user-1',
            'email' => 'user@example.test',
            'nickname' => 'Vevit',
            'role' => 'user',
            'password' => 'must-not-leak',
            'reset_token' => 'must-not-leak',
          ]];
        },
      ];
      _login_run([], '{"email":"USER@example.test","password":"secret","remember":true}');
      break;

    case 'twofa':
      $filtered = 0;
      $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'filtered_get' => static function () use (&$filtered): array {
          $filtered++;
          return $filtered === 1 ? ['data' => []] : ['data' => [['user_id' => 'user-1']]];
        },
        'insert' => $attemptInsert,
        'find_one' => static fn (): array => ['data' => [
          'id' => 'user-1',
          'email' => 'user@example.test',
          'password' => password_hash('secret', PASSWORD_BCRYPT),
        ]],
      ];
      _login_run([], '{"email":"user@example.test","password":"secret","remember":true}');
      break;

    default:
      fwrite(STDERR, "Unknown scenario: {$scenario}\n");
      exit(2);
  }

  exit(0);
}

function run_login_scenario(string $scenario): array {
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
    && preg_match('/__LOGIN_META__(\{.*\})/', $stderr, $match) === 1
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
  run_login_child((string) ($argv[2] ?? ''));
}

$tests = 0;
$failures = [];

function login_test(string $name, callable $callback): void {
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

function login_assert_same(mixed $expected, mixed $actual): void {
  if ($actual !== $expected) {
    throw new RuntimeException(
      'expected ' . var_export($expected, true)
      . ', got ' . var_export($actual, true)
    );
  }
}

function login_assert_not_contains(string $needle, string $haystack): void {
  if (str_contains($haystack, $needle)) {
    throw new RuntimeException(
      'expected ' . var_export($haystack, true)
      . ' not to contain ' . var_export($needle, true)
    );
  }
}

login_test('missing users select a valid dummy bcrypt hash', function (): void {
  $hash = _login_password_hash(null);
  $info = password_get_info($hash);
  login_assert_same('bcrypt', $info['algoName'] ?? null);
  login_assert_same($hash, _login_password_hash(['password' => 'invalid']));
  login_assert_same(false, _login_credentials_match(null, 'anything'));
});

login_test('provider-only accounts are detected without accepting a password', function (): void {
  login_assert_same(true, _login_is_provider_only_account(['id' => 'user-1', 'password' => null]));
  login_assert_same(true, _login_is_provider_only_account(['id' => 'user-1']));
  login_assert_same(false, _login_is_provider_only_account(['id' => 'user-1', 'password' => password_hash('secret', PASSWORD_BCRYPT)]));
});

login_test('safe response projection excludes authentication secrets', function (): void {
  $projection = _login_safe_user_columns();
  login_assert_same(
    'id,email,nickname,full_name,tier,tier_expires,role,avatar_url,'
    . 'level,xp,language,two_factor_enabled',
    $projection
  );
  login_assert_not_contains('password', $projection);
  login_assert_not_contains('reset', $projection);
});

login_test('non-POST requests receive 405 before rate limiting', function (): void {
  $result = run_login_scenario('method');
  login_assert_same(0, $result['exit']);
  login_assert_same(405, $result['meta']['status'] ?? null);
  login_assert_same([], $result['meta']['events'] ?? null);
});

login_test('empty trimmed credentials are rejected after recording an attempt', function (): void {
  $result = run_login_scenario('empty');
  login_assert_same(400, $result['meta']['status'] ?? null);
  login_assert_same(
    '{"error":"Vyplňte e-mail a heslo."}',
    $result['stdout']
  );
  login_assert_same('rate-limit', $result['meta']['events'][0][0] ?? null);
  login_assert_same(10, $result['meta']['events'][0][4] ?? null);
  login_assert_same('login_attempts', $result['meta']['events'][1][1] ?? null);
});

login_test('blocked requests are recorded and return the Czech 429 message', function (): void {
  $result = run_login_scenario('limited');
  login_assert_same(429, $result['meta']['status'] ?? null);
  login_assert_same(
    '{"error":"Příliš mnoho pokusů. Zkuste to za chvíli."}',
    $result['stdout']
  );
  login_assert_same('login_attempts', $result['meta']['events'][0][1] ?? null);
});

login_test('lookup errors stay generic and use the credential projection', function (): void {
  $result = run_login_scenario('lookup-error');
  login_assert_same(500, $result['meta']['status'] ?? null);
  login_assert_same('{"error":"Chyba serveru."}', $result['stdout']);
  login_assert_same(
    ['email' => 'user@example.test'],
    $result['meta']['events'][1][2] ?? null
  );
  login_assert_same(
    'id,password,email',
    $result['meta']['events'][1][3] ?? null
  );
});

login_test('bad passwords return the generic credential error', function (): void {
  $result = run_login_scenario('bad-password');
  login_assert_same(401, $result['meta']['status'] ?? null);
  login_assert_same(
    '{"error":"Nesprávný e-mail nebo heslo."}',
    $result['stdout']
  );
});

login_test('whitespace around a password remains significant', function (): void {
  $result = run_login_scenario('padded-password');
  login_assert_same(401, $result['meta']['status'] ?? null);
  login_assert_same(
    '{"error":"Nesprávný e-mail nebo heslo."}',
    $result['stdout']
  );
});

login_test('remember accepts only a JSON boolean', function (): void {
  $result = run_login_scenario('invalid-remember');
  login_assert_same(400, $result['meta']['status'] ?? null);
  login_assert_same(
    '{"error":"Neplatná volba zapamatování."}',
    $result['stdout']
  );
});

login_test('final profile lookup errors never return a null user', function (): void {
  $result = run_login_scenario('final-fetch-error');
  login_assert_same(500, $result['meta']['status'] ?? null);
  login_assert_same('{"error":"Chyba serveru."}', $result['stdout']);
  login_assert_not_contains('"user":null', $result['stdout']);
});

login_test('successful login creates a session, logs IP, and returns safe user data', function (): void {
  $result = run_login_scenario('success');
  login_assert_same(200, $result['meta']['status'] ?? null);
  $body = json_decode($result['stdout'], true);
  login_assert_same('user-1', $body['user']['id'] ?? null);
  login_assert_same(false, array_key_exists('password', $body['user'] ?? []));
  login_assert_same(false, array_key_exists('reset_token', $body['user'] ?? []));

  $events = $result['meta']['events'] ?? [];
  $activity = null;
  $finalLookup = null;
  $session = null;
  foreach ($events as $event) {
    if (($event[0] ?? null) === 'insert' && ($event[1] ?? null) === 'account_activity') {
      $activity = $event[2] ?? null;
    }
    if (($event[0] ?? null) === 'find-one' && ($event[3] ?? '') !== 'id,password,email') {
      $finalLookup = $event;
    }
    if (($event[0] ?? null) === 'insert' && ($event[1] ?? null) === 'sessions') {
      $session = $event[2] ?? null;
    }
  }

  login_assert_same('login', $activity['kind'] ?? null);
  login_assert_same('192.0.2.20', $activity['detail'] ?? null);
  login_assert_same(true, $session['remember'] ?? null);
  login_assert_same(_login_safe_user_columns(), $finalLookup[3] ?? null);
});

login_test('active 2FA creates only a short challenge before verification', function (): void {
  $result = run_login_scenario('twofa');
  login_assert_same(200, $result['meta']['status'] ?? null);
  $body = json_decode($result['stdout'], true);
  login_assert_same(true, $body['requires_2fa'] ?? null);
  $sessions = array_filter($result['meta']['events'] ?? [], static fn(array $event): bool => ($event[1] ?? null) === 'sessions');
  login_assert_same([], array_values($sessions));
  $challenges = array_values(array_filter($result['meta']['events'] ?? [], static fn(array $event): bool => ($event[1] ?? null) === 'auth_challenges'));
  login_assert_same('login_totp', $challenges[0][2]['kind'] ?? null);
  login_assert_same(true, $challenges[0][2]['payload']['remember'] ?? null);
});

login_test('login has a closed email phone or nickname identifier contract', function (): void {
  $source = file_get_contents(__DIR__ . '/../api/login.php');
  login_assert_same(true, is_string($source) && str_contains($source, 'classifyLoginIdentifier'));
  login_assert_same(true, str_contains($source, "['phone_e164' => \$identifier['value']]"));
  login_assert_same(true, str_contains($source, 'phone_verified_at'));
  login_assert_same(true, str_contains($source, 'Neplatné přihlašovací údaje.'));
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
