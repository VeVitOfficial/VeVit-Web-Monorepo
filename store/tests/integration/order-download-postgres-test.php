<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

$dsn = getenv('VEVIT_STORE_TEST_DSN');
if ($dsn === false || getenv('VEVIT_STORE_TEST_DB_USER') === false || getenv('VEVIT_STORE_TEST_DB_PASS') === false) {
    fwrite(STDOUT, "SKIP: order-download-postgres-test requires VEVIT_STORE_TEST_DSN, VEVIT_STORE_TEST_DB_USER and VEVIT_STORE_TEST_DB_PASS\n");
    exit(77);
}
if (!str_starts_with($dsn, 'pgsql:') || !preg_match('/(?:dbname=|\/)[^;\/]*test/i', $dsn)) {
    fwrite(STDERR, "REFUSE: integration DSN must point to an explicitly named test database.\n");
    exit(1);
}
$pdo = new PDO($dsn, getenv('VEVIT_STORE_TEST_DB_USER'), getenv('VEVIT_STORE_TEST_DB_PASS'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec((string) file_get_contents(__DIR__ . '/../../migrations/202607290002_order_access_and_download_grants_up.sql'));
$columns = $pdo->query("SELECT column_name FROM information_schema.columns WHERE table_name IN ('store_orders','store_download_grants')")->fetchAll(PDO::FETCH_COLUMN);
test_assert_true(in_array('public_id', $columns, true), 'order access migration must create public_id');
test_assert_true(in_array('token_hash', $columns, true), 'download migration must create token hash');
test_complete('order-download-postgres-test');
