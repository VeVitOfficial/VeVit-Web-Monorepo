<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

$dsn = getenv('VEVIT_STORE_TEST_DSN');
$dbUser = getenv('VEVIT_STORE_TEST_DB_USER');
$dbPass = getenv('VEVIT_STORE_TEST_DB_PASS');
if ($dsn === false || $dbUser === false || $dbPass === false) {
    fwrite(STDOUT, "SKIP: migrations-postgres-test requires PostgreSQL test environment\n");
    exit(77);
}
if (!str_starts_with($dsn, 'pgsql:') || !preg_match('/(?:dbname=|\/)[^;\/]*test/i', $dsn)) {
    fwrite(STDERR, "REFUSE: integration DSN must name a test database.\n");
    exit(1);
}
if (!extension_loaded('pdo_pgsql')) {
    fwrite(STDERR, "REFUSE: pdo_pgsql is required for migration integration tests.\n");
    exit(1);
}

$pdo = new PDO($dsn, $dbUser, $dbPass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);
$pdo->exec((string) file_get_contents(__DIR__ . '/task-0-4-base-schema.sql'));

$migrationDirectory = __DIR__ . '/../../migrations/';
$upMigrations = [
    '202607290001_checkout_snapshot_up.sql',
    '202607290002_order_access_and_download_grants_up.sql',
    '2026072900025_order_status_enum_up.sql',
    '202607290003_payments_and_inventory_up.sql',
];
foreach ($upMigrations as $migration) {
    $pdo->exec((string) file_get_contents($migrationDirectory . $migration));
}
// The Release 0 migrations are intentionally safe to re-run during a guarded
// deployment. This validates their SQL and idempotent guards against the actual
// PostgreSQL engine rather than a mock.
foreach ($upMigrations as $migration) {
    $pdo->exec((string) file_get_contents($migrationDirectory . $migration));
}

$predicate = $pdo->query(
    "SELECT pg_get_expr(i.indpred, i.indrelid)
       FROM pg_index i
       JOIN pg_class c ON c.oid = i.indexrelid
      WHERE c.relname = 'uq_checkout_snapshots_active_idempotency'"
)->fetchColumn();
test_assert_true(
    is_string($predicate) && str_contains($predicate, 'consumed'),
    'snapshot idempotency remains unique after consumption'
);

$historicalPaymentStatus = $pdo->query(
    "SELECT column_default
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'store_orders'
        AND column_name = 'payment_status'"
)->fetchColumn();
test_assert_true(
    is_string($historicalPaymentStatus) && str_contains($historicalPaymentStatus, 'legacy_unknown'),
    'historical orders are not implicitly marked paid'
);

$pdo->exec((string) file_get_contents($migrationDirectory . '202607290003_preflight_report.sql'));

foreach ([
    '202607290003_payments_and_inventory_down.sql',
    '202607290002_order_access_and_download_grants_down.sql',
    '202607290001_checkout_snapshot_down.sql',
] as $migration) {
    $pdo->exec((string) file_get_contents($migrationDirectory . $migration));
}

test_assert_same(null, $pdo->query("SELECT to_regclass('public.store_checkout_snapshots')")->fetchColumn(), 'snapshot table is removed by pre-transaction rollback');
test_assert_same(null, $pdo->query("SELECT to_regclass('public.store_payment_events')")->fetchColumn(), 'payment ledger is removed by pre-transaction rollback');
test_assert_same(null, $pdo->query("SELECT to_regclass('public.store_security_rate_limits')")->fetchColumn(), 'rate limit table is removed by pre-transaction rollback');
$cancelledColumn = $pdo->query(
    "SELECT COUNT(*)
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'store_order_items'
        AND column_name = 'cancelled_at'"
)->fetchColumn();
test_assert_same(0, (int) $cancelledColumn, 'Task 0.3 rollback removes cancelled_at');

test_complete('migrations-postgres-test');
