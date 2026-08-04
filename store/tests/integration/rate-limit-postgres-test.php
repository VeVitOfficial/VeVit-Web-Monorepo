<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/RateLimiter.php';

$dsn = getenv('VEVIT_STORE_TEST_DSN');
$dbUser = getenv('VEVIT_STORE_TEST_DB_USER');
$dbPass = getenv('VEVIT_STORE_TEST_DB_PASS');
if ($dsn === false || $dbUser === false || $dbPass === false) {
    fwrite(STDOUT, "SKIP: rate-limit-postgres-test requires PostgreSQL test environment\n");
    exit(77);
}
if (!str_starts_with($dsn, 'pgsql:') || !preg_match('/(?:dbname=|\/)[^;\/]*test/i', $dsn)) {
    fwrite(STDERR, "REFUSE: integration DSN must name a test database.\n");
    exit(1);
}
if (!extension_loaded('pdo_pgsql')) {
    fwrite(STDERR, "REFUSE: pdo_pgsql is required for rate limit integration tests.\n");
    exit(1);
}

$pdo = new PDO($dsn, $dbUser, $dbPass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);
$pdo->exec((string) file_get_contents(__DIR__ . '/task-0-4-base-schema.sql'));
$pdo->exec((string) file_get_contents(__DIR__ . '/../../migrations/202607290001_checkout_snapshot_up.sql'));

$limiter = new StoreRateLimiter($pdo);
$limiter->consume('checkout_snapshot_session', 'session-a', 2, 60);
$limiter->consume('checkout_snapshot_session', 'session-a', 2, 60);
try {
    $limiter->consume('checkout_snapshot_session', 'session-a', 2, 60);
    test_assert_true(false, 'third request must be rejected');
} catch (StoreRateLimitExceeded $exception) {
    test_assert_true($exception->retryAfter >= 1 && $exception->retryAfter <= 60, 'rate limit returns a bounded retry time');
}
$limiter->consume('checkout_snapshot_session', 'session-b', 2, 60);

$rows = $pdo->query('SELECT key_hash, scope FROM store_security_rate_limits ORDER BY key_hash')->fetchAll();
test_assert_same(2, count($rows), 'separate identities use separate rate buckets');
foreach ($rows as $row) {
    test_assert_true(preg_match('/^[a-f0-9]{64}$/', (string) $row['key_hash']) === 1, 'rate limiter stores only identity hashes');
}

test_complete('rate-limit-postgres-test');
