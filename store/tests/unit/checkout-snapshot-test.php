<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

test_assert_true(is_file(__DIR__ . '/../../lib/orders/CheckoutService.php'), 'checkout service must exist');
require_once __DIR__ . '/../../lib/orders/CheckoutService.php';

final class InMemoryCheckoutRepository implements CheckoutRepository
{
    /** @var array<int, array<string, mixed>> */
    public array $products;
    /** @var array<string, array<string, mixed>> */
    public array $snapshots = [];
    public bool $inTransaction = false;
    public bool $failSave = false;

    /** @param array<int, array<string, mixed>> $products */
    public function __construct(array $products)
    {
        $this->products = $products;
    }

    public function begin(): void { $this->inTransaction = true; }
    public function commit(): void { $this->inTransaction = false; }
    public function rollBack(): void { $this->inTransaction = false; }
    public function isInTransaction(): bool { return $this->inTransaction; }
    public function lockIdempotency(string $scopeHash, string $keyHash): void {}
    public function expireSnapshot(array $snapshot): void { unset($this->snapshots[$snapshot['idempotency_scope_hash'] . ':' . $snapshot['idempotency_key_hash']]); }

    public function findExisting(string $scopeHash, string $keyHash): ?array
    {
        return $this->snapshots[$scopeHash . ':' . $keyHash] ?? null;
    }

    public function findProductsForCheckout(array $productIds): array
    {
        return array_filter($this->products, static fn (array $product): bool => in_array($product['id'], $productIds, true));
    }

    public function saveSnapshot(array $snapshot): void
    {
        if ($this->failSave) {
            throw new RuntimeException('simulated persistence failure');
        }
        $this->snapshots[$snapshot['idempotency_scope_hash'] . ':' . $snapshot['idempotency_key_hash']] = $snapshot;
    }
}

/** @return array<int, array<string, mixed>> */
function checkout_test_products(): array
{
    return [
        1 => ['id' => 1, 'name' => 'Fyzický produkt', 'sku' => 'PHYSICAL-1', 'price' => '100.00', 'sale_price' => null, 'type' => 'physical', 'stock' => 3, 'is_active' => true, 'is_sellable' => true, 'allow_backorder' => false, 'currency' => 'czk', 'download_file' => null],
        2 => ['id' => 2, 'name' => 'Digitální produkt', 'sku' => 'DIGITAL-1', 'price' => '50.50', 'sale_price' => '40.25', 'type' => 'digital', 'stock' => null, 'is_active' => true, 'is_sellable' => true, 'allow_backorder' => false, 'currency' => 'czk', 'download_file' => 'downloads/digital-1.zip'],
        3 => ['id' => 3, 'name' => 'Neaktivní digitální', 'sku' => 'DIGITAL-2', 'price' => '10.00', 'sale_price' => null, 'type' => 'digital', 'stock' => null, 'is_active' => false, 'is_sellable' => true, 'allow_backorder' => false, 'currency' => 'czk', 'download_file' => 'downloads/digital-2.zip'],
        4 => ['id' => 4, 'name' => 'Backorder', 'sku' => 'BACKORDER-1', 'price' => '20.00', 'sale_price' => null, 'type' => 'physical', 'stock' => 0, 'is_active' => true, 'is_sellable' => true, 'allow_backorder' => true, 'currency' => 'czk', 'download_file' => null],
        5 => ['id' => 5, 'name' => 'Bez ceny', 'sku' => 'PRICE-0', 'price' => '0.00', 'sale_price' => null, 'type' => 'physical', 'stock' => 1, 'is_active' => true, 'is_sellable' => true, 'allow_backorder' => false, 'currency' => 'czk', 'download_file' => null],
        6 => ['id' => 6, 'name' => 'Chybná měna', 'sku' => 'EUR-1', 'price' => '10.00', 'sale_price' => null, 'type' => 'physical', 'stock' => 1, 'is_active' => true, 'is_sellable' => true, 'allow_backorder' => false, 'currency' => 'eur', 'download_file' => null],
        7 => ['id' => 7, 'name' => 'Chybějící digitální obsah', 'sku' => 'DIGITAL-3', 'price' => '10.00', 'sale_price' => null, 'type' => 'digital', 'stock' => null, 'is_active' => true, 'is_sellable' => true, 'allow_backorder' => false, 'currency' => 'czk', 'download_file' => 'https://example.test/file.zip'],
    ];
}

/** @return array<string, mixed> */
function checkout_input(array $items, string $key = 'checkout-key-000000000000000000000001'): array
{
    return [
        'items' => $items,
        'email' => 'zakaznik@example.test',
        'name' => 'Zákazník',
        'shipping' => ['street' => 'Hlavní 1', 'city' => 'Praha', 'zip' => '11000', 'country' => 'CZ'],
        'notes' => '',
        'idempotency_key' => $key,
    ];
}

function checkout_service(InMemoryCheckoutRepository $repository): CheckoutService
{
    static $storagePath = null;
    if ($storagePath === null) {
        $storagePath = sys_get_temp_dir() . '/vevit-checkout-unit-storage';
        if (!is_dir($storagePath . '/downloads')) mkdir($storagePath . '/downloads', 0700, true);
        file_put_contents($storagePath . '/downloads/digital-1.zip', 'test');
    }
    return new CheckoutService($repository, new DateTimeImmutable('2026-07-29T12:00:00+00:00'), $storagePath);
}

$repository = new InMemoryCheckoutRepository(checkout_test_products());
$result = checkout_service($repository)->createSnapshot(checkout_input([
    ['product_id' => 1, 'quantity' => 2, 'price' => 1, 'name' => 'Útočníkem změněný název'],
]), null, 'session-a');
test_assert_same(false, $result['reused'], 'first valid physical snapshot must be new');
test_assert_same(10000, $result['snapshot']['items'][0]['unit_amount_minor'], 'server price must ignore client price');
test_assert_same('Fyzický produkt', $result['snapshot']['items'][0]['name'], 'server name must ignore client name');
test_assert_same(20000, $result['snapshot']['subtotal_minor'], 'physical subtotal must be in haléře');
test_assert_same(9900, $result['snapshot']['shipping_minor'], 'physical shipping must be calculated server-side');
test_assert_same(29900, $result['snapshot']['total_minor'], 'physical total must be server-side');

$pdoBooleanProducts = checkout_test_products();
$pdoBooleanProducts[1]['is_active'] = 'f';
try {
    checkout_service(new InMemoryCheckoutRepository($pdoBooleanProducts))->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]]), null, 'session-a');
    test_assert_true(false, 'PostgreSQL false product flag must not be truthy in PHP');
} catch (CheckoutValidationException $exception) {
    test_assert_same('product_unavailable', $exception->errorCode, 'PostgreSQL false product flag must be rejected');
}
$pdoBooleanProducts = checkout_test_products();
$pdoBooleanProducts[1]['stock'] = '0';
$pdoBooleanProducts[1]['allow_backorder'] = 'f';
try {
    checkout_service(new InMemoryCheckoutRepository($pdoBooleanProducts))->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]]), null, 'session-a');
    test_assert_true(false, 'PostgreSQL false backorder flag must not be truthy in PHP');
} catch (CheckoutValidationException $exception) {
    test_assert_same('insufficient_stock', $exception->errorCode, 'PostgreSQL false backorder flag must be rejected');
}
$unknownStockProducts = checkout_test_products();
$unknownStockProducts[1]['stock'] = null;
try {
    checkout_service(new InMemoryCheckoutRepository($unknownStockProducts))->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]]), null, 'session-a');
    test_assert_true(false, 'physical product with unknown stock must fail closed');
} catch (CheckoutValidationException $exception) {
    test_assert_same('product_unavailable', $exception->errorCode, 'unknown stock must be rejected without explicit backorder');
}

$repository = new InMemoryCheckoutRepository(checkout_test_products());
$digital = checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 2, 'quantity' => 1]]), null, 'session-a');
test_assert_same(4025, $digital['snapshot']['items'][0]['unit_amount_minor'], 'sale price must be represented exactly in haléře');
test_assert_same(0, $digital['snapshot']['shipping_minor'], 'digital items must not add shipping');
test_assert_true(!isset($digital['snapshot']['items'][0]['download_file']), 'snapshot must not reveal digital storage path');

$repository = new InMemoryCheckoutRepository(checkout_test_products());
$combined = checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1], ['product_id' => 2, 'quantity' => 1]]), null, 'session-a');
test_assert_same(23925, $combined['snapshot']['total_minor'], 'combined order must use verified physical and digital data');

$invalidCases = [
    'unknown product' => [checkout_input([['product_id' => 999, 'quantity' => 1]]), 'product_unavailable'],
    'inactive product' => [checkout_input([['product_id' => 3, 'quantity' => 1]]), 'product_unavailable'],
    'invalid variant' => [checkout_input([['product_id' => 1, 'variant_id' => 9, 'quantity' => 1]]), 'variants_not_supported'],
    'zero quantity' => [checkout_input([['product_id' => 1, 'quantity' => 0]]), 'invalid_quantity'],
    'negative quantity' => [checkout_input([['product_id' => 1, 'quantity' => -1]]), 'invalid_quantity'],
    'decimal quantity' => [checkout_input([['product_id' => 1, 'quantity' => 1.5]]), 'invalid_quantity'],
    'excessive quantity' => [checkout_input([['product_id' => 1, 'quantity' => 101]]), 'quantity_limit'],
    'invalid price' => [checkout_input([['product_id' => 5, 'quantity' => 1]]), 'invalid_price'],
    'invalid currency' => [checkout_input([['product_id' => 6, 'quantity' => 1]]), 'unsupported_currency'],
    'unbound digital content' => [checkout_input([['product_id' => 7, 'quantity' => 1]]), 'digital_content_unavailable'],
    'insufficient stock' => [checkout_input([['product_id' => 1, 'quantity' => 4]]), 'insufficient_stock'],
    'unknown input field' => [checkout_input([['product_id' => 1, 'quantity' => 1]]) + ['admin' => true], 'unexpected_field'],
];
foreach ($invalidCases as $label => [$input, $code]) {
    try {
        checkout_service(new InMemoryCheckoutRepository(checkout_test_products()))->createSnapshot($input, null, 'session-a');
        test_assert_true(false, $label . ' must be rejected');
    } catch (CheckoutValidationException $exception) {
        test_assert_same($code, $exception->errorCode, $label . ' must use stable error code');
    }
}

$repository = new InMemoryCheckoutRepository(checkout_test_products());
$backorder = checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 4, 'quantity' => 5]]), null, 'session-a');
test_assert_same(true, $backorder['snapshot']['items'][0]['backorder'], 'permitted backorder must remain purchasable');

$repository = new InMemoryCheckoutRepository(checkout_test_products());
$deduplicated = checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1], ['product_id' => 1, 'quantity' => 2]]), null, 'session-a');
test_assert_same(1, count($deduplicated['snapshot']['items']), 'duplicate cart lines must be normalized into one item');
test_assert_same(3, $deduplicated['snapshot']['items'][0]['quantity'], 'duplicate quantities must be summed safely');

$repository = new InMemoryCheckoutRepository(checkout_test_products());
$first = checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]], 'duplicate-key-000000000000000000000001'), null, 'session-a');
$second = checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]], 'duplicate-key-000000000000000000000001'), null, 'session-a');
test_assert_same(true, $second['reused'], 'same scoped idempotency key must reuse snapshot');
test_assert_same($first['snapshot']['public_id'], $second['snapshot']['public_id'], 'idempotent requests must return the same public id');
try {
    checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]], 'too-short'), null, 'session-a');
    test_assert_true(false, 'short idempotency key must be rejected');
} catch (CheckoutValidationException $exception) {
    test_assert_same('invalid_idempotency_key', $exception->errorCode, 'invalid idempotency key must be stable');
}

$repository = new InMemoryCheckoutRepository(checkout_test_products());
$sameKey = 'scope-check-000000000000000000000001';
$fromSessionA = checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]], $sameKey), null, 'session-a');
$fromSessionB = checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]], $sameKey), null, 'session-b');
test_assert_same(false, $fromSessionB['reused'], 'idempotency key from another guest session must not expose or reuse a snapshot');
test_assert_true($fromSessionA['snapshot']['public_id'] !== $fromSessionB['snapshot']['public_id'], 'guest snapshots must be session scoped');

$repository = new InMemoryCheckoutRepository(checkout_test_products());
$expiredKey = 'expired-key-000000000000000000000001';
$expired = checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]], $expiredKey), null, 'session-a');
$expired['snapshot']['expires_at'] = '2026-07-29T11:59:59+00:00';
$scope = hash('sha256', 'session:session-a');
$repository->snapshots[$scope . ':' . hash('sha256', $expiredKey)] = $expired['snapshot'];
try {
    $renewed = checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]], $expiredKey), null, 'session-a');
    test_assert_same(false, $renewed['reused'], 'expired snapshot must be invalidated and recreated');
} catch (CheckoutValidationException $exception) {
    test_assert_true(false, 'expired snapshot must not block a safe retry: ' . $exception->errorCode);
}

$repository = new InMemoryCheckoutRepository(checkout_test_products());
$key = 'changed-request-000000000000000000000001';
checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]], $key), null, 'session-a');
try {
    checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 2]], $key), null, 'session-a');
    test_assert_true(false, 'idempotency key with changed cart must be rejected');
} catch (CheckoutValidationException $exception) {
    test_assert_same('idempotency_conflict', $exception->errorCode, 'changed idempotent request must be conflict');
}

$repository = new InMemoryCheckoutRepository(checkout_test_products());
$repository->failSave = true;
try {
    checkout_service($repository)->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 1]]), null, 'session-a');
    test_assert_true(false, 'persistence failure must be surfaced');
} catch (RuntimeException) {
    test_assert_same(false, $repository->isInTransaction(), 'persistence failure must roll back transaction');
}

$overflowProducts = checkout_test_products();
$overflowProducts[1]['price'] = '99999999.99';
$overflowProducts[1]['stock'] = 100;
try {
    checkout_service(new InMemoryCheckoutRepository($overflowProducts))->createSnapshot(checkout_input([['product_id' => 1, 'quantity' => 100]]), null, 'session-a');
    test_assert_true(false, 'order total above bounded minor range must be rejected');
} catch (CheckoutValidationException $exception) {
    test_assert_same('order_total_limit', $exception->errorCode, 'overflowing order total must use stable error code');
}

test_complete('checkout-snapshot-test');
