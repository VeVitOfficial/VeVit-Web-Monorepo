<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/orders/CheckoutService.php';

$dsn = getenv('VEVIT_STORE_TEST_DSN');
$user = getenv('VEVIT_STORE_TEST_DB_USER');
$password = getenv('VEVIT_STORE_TEST_DB_PASS');
if ($dsn === false || $user === false || $password === false) {
    fwrite(STDOUT, "SKIP: checkout-snapshot-postgres-test requires VEVIT_STORE_TEST_DSN, VEVIT_STORE_TEST_DB_USER and VEVIT_STORE_TEST_DB_PASS\n");
    exit(77);
}
if (!str_starts_with($dsn, 'pgsql:') || !preg_match('/(?:dbname=|\/)[^;\/]*test/i', $dsn)) {
    fwrite(STDERR, "REFUSE: integration DSN must point to an explicitly named test database.\n");
    exit(1);
}

$pdo = new PDO($dsn, $user, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$migration = file_get_contents(__DIR__ . '/../../migrations/202607290001_checkout_snapshot_up.sql');
$pdo->exec($migration);

$suffix = bin2hex(random_bytes(6));
$slug = 'checkout-test-' . $suffix;
$pdo->prepare("INSERT INTO store_products (name, slug, price, sale_price, type, stock, is_active, is_sellable, allow_backorder, currency, download_file) VALUES (?, ?, '100.00', NULL, 'physical', 2, TRUE, TRUE, FALSE, 'czk', NULL)")
    ->execute(['Integration checkout product', $slug]);
$productId = (int) $pdo->lastInsertId('store_products_id_seq');

try {
    $service = new CheckoutService(new PdoCheckoutRepository($pdo), new DateTimeImmutable('now', new DateTimeZone('UTC')));
    $input = [
        'items' => [['product_id' => $productId, 'quantity' => 1, 'price' => '1.00']],
        'email' => 'integration@example.test',
        'name' => 'Integration Test',
        'shipping' => ['street' => 'Test 1', 'city' => 'Praha', 'zip' => '11000', 'country' => 'CZ'],
        'notes' => '',
        'idempotency_key' => 'postgres-integration-' . $suffix,
    ];
    $result = $service->createSnapshot($input, null, 'integration-session-' . $suffix);
    test_assert_same(false, $result['reused'], 'PostgreSQL must create a new snapshot');
    test_assert_same(19900, $result['snapshot']['total_minor'], 'PostgreSQL snapshot must use server price and shipping');

    $stored = $pdo->prepare('SELECT total_minor, snapshot_data, checkout_grant_hash FROM store_checkout_snapshots WHERE public_id = ?');
    $stored->execute([$result['snapshot']['public_id']]);
    $order = $stored->fetch();
    test_assert_true($order !== false, 'PostgreSQL snapshot order must be persisted');
    test_assert_same(19900, (int) $order['total_minor'], 'stored snapshot total must match server calculation');
    test_assert_true(!str_contains((string) $order['snapshot_data'], 'download_file'), 'snapshot must not store download paths');
    test_assert_same(64, strlen((string) $order['checkout_grant_hash']), 'checkout grant must be stored only as SHA-256 hash');
} finally {
    $pdo->prepare('DELETE FROM store_checkout_snapshots WHERE customer_email = ?')->execute(['integration@example.test']);
    $pdo->prepare('DELETE FROM store_products WHERE id = ?')->execute([$productId]);
}

test_complete('checkout-snapshot-postgres-test');
