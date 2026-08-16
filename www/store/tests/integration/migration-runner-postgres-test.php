<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/database/MigrationRunner.php';

$dsn = getenv('VEVIT_STORE_TEST_DSN');
$user = getenv('VEVIT_STORE_TEST_DB_USER');
$pass = getenv('VEVIT_STORE_TEST_DB_PASS');
if ($dsn === false || $user === false || $pass === false) exit(77);
if (!preg_match('/test/i', $dsn)) exit(1);
$pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('DROP TABLE IF EXISTS store_schema_migrations, migration_runner_probe');
$runner = new MigrationRunner($pdo);
$sql = 'CREATE TABLE migration_runner_probe(id INT PRIMARY KEY);';
test_assert_same('applied', $runner->apply('209901010001_probe.sql', $sql), 'first migration run applies');
test_assert_same('skipped', $runner->apply('209901010001_probe.sql', $sql), 'same version and checksum skips');
try {
    $runner->apply('209901010001_probe.sql', $sql . ' ');
    test_assert_true(false, 'changed checksum must fail');
} catch (RuntimeException) {
}
test_assert_same(1, (int) $pdo->query('SELECT COUNT(*) FROM store_schema_migrations')->fetchColumn(), 'ledger stores one version');
test_complete('migration-runner-postgres-test');
