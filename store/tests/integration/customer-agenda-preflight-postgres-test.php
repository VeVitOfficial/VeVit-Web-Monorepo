<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

$report = __DIR__ . '/../../migrations/202607300001_customer_agenda_preflight.sql';
test_assert_true(is_file($report), 'customer agenda preflight report exists');

$sql = (string) file_get_contents($report);
test_assert_true(trim($sql) !== '', 'customer agenda preflight report is non-empty');
test_assert_true(
    preg_match('/\b(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|GRANT|REVOKE|TRUNCATE)\b/i', $sql) !== 1,
    'customer agenda preflight report is read-only'
);

$dsn = getenv('VEVIT_STORE_TEST_DSN');
$dbUser = getenv('VEVIT_STORE_TEST_DB_USER');
$dbPass = getenv('VEVIT_STORE_TEST_DB_PASS');
if ($dsn === false || $dbUser === false || $dbPass === false) {
    fwrite(STDOUT, "SKIP: customer-agenda-preflight-postgres-test requires PostgreSQL test environment\n");
    exit(77);
}
if (!str_starts_with($dsn, 'pgsql:') || !preg_match('/(?:dbname=|\/)[^;\/]*test/i', $dsn)) {
    fwrite(STDERR, "REFUSE: integration DSN must name a test database.\n");
    exit(1);
}

$pdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('DROP TABLE IF EXISTS store_schema_migrations,store_case_attachments,store_delivery_events,store_delivery_items,store_deliveries,store_return_events,store_return_items,store_returns,store_claim_events,store_claim_items,store_claims,store_product_favorites,store_audit_events CASCADE');
$pdo->exec((string) file_get_contents(__DIR__ . '/task-0-4-base-schema.sql'));
foreach (['202607290001_checkout_snapshot_up.sql', '202607290002_order_access_and_download_grants_up.sql', '202607290003_payments_and_inventory_up.sql'] as $name) {
    $pdo->exec((string) file_get_contents(__DIR__ . '/../../migrations/' . $name));
}
$before = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")->fetchColumn();
$pdo->exec($sql);
$after = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")->fetchColumn();
test_assert_same((int) $before, (int) $after, 'preflight report does not mutate table count');

test_complete('customer-agenda-preflight-postgres-test');
