<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/database/MigrationRunner.php';

$path = $argv[1] ?? '';
$dsn = getenv('VEVIT_STORE_MIGRATION_DSN');
$user = getenv('VEVIT_STORE_MIGRATION_DB_USER');
$pass = getenv('VEVIT_STORE_MIGRATION_DB_PASS');
if ($path === '' || !is_file($path) || $dsn === false || $user === false || $pass === false) {
    fwrite(STDERR, "Usage: VEVIT_STORE_MIGRATION_DSN=... VEVIT_STORE_MIGRATION_DB_USER=... VEVIT_STORE_MIGRATION_DB_PASS=... php bin/migrate.php migrations/<version>_up.sql\n");
    exit(2);
}
$pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$result = (new MigrationRunner($pdo))->apply(basename($path), (string) file_get_contents($path));
fwrite(STDOUT, strtoupper($result) . ': ' . basename($path) . PHP_EOL);
