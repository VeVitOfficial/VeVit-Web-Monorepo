<?php
declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/orders/CheckoutService.php';
require_once __DIR__ . '/../../lib/orders/PaymentOrderService.php';
require_once __DIR__ . '/../../lib/orders/OrderStateMachine.php';
require_once __DIR__ . '/../../lib/payments/StripePaymentProcessor.php';
require_once __DIR__ . '/../../lib/payments/StripeCheckoutService.php';

$dsn = getenv('VEVIT_STORE_TEST_DSN');
$dbUser = getenv('VEVIT_STORE_TEST_DB_USER');
$dbPass = getenv('VEVIT_STORE_TEST_DB_PASS');
if ($dsn === false || $dbUser === false || $dbPass === false) {
    fwrite(STDOUT, "SKIP: payment-flow-postgres-test requires PostgreSQL test environment\n");
    exit(77);
}
if (!str_starts_with($dsn, 'pgsql:') || !preg_match('/(?:dbname=|\/)[^;\/]*test/i', $dsn)) {
    fwrite(STDERR, "REFUSE: integration DSN must name a test database.\n");
    exit(1);
}
if (!extension_loaded('pdo_pgsql') || !function_exists('pcntl_fork')) {
    fwrite(STDERR, "REFUSE: pdo_pgsql and pcntl are required for real PostgreSQL concurrency tests.\n");
    exit(1);
}

function task04_pdo(): PDO
{
    return new PDO(
        (string) getenv('VEVIT_STORE_TEST_DSN'),
        (string) getenv('VEVIT_STORE_TEST_DB_USER'),
        (string) getenv('VEVIT_STORE_TEST_DB_PASS'),
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
    );
}

function task04_bool(mixed $value): bool
{
    return $value === true || $value === 1 || $value === '1' || $value === 't';
}

/** @return array{snapshot:array<string,mixed>,grant:string,reused:bool} */
function task04_snapshot(PDO $pdo, string $storage, array $items, string $suffix, ?DateTimeImmutable $now = null): array
{
    $service = new CheckoutService(new PdoCheckoutRepository($pdo), $now ?? new DateTimeImmutable('2026-07-29T12:00:00+00:00'), $storage);
    $result = $service->createSnapshot([
        'items' => $items,
        'email' => "buyer-{$suffix}@example.test",
        'name' => "Buyer {$suffix}",
        'shipping' => ['street' => 'Test 1', 'city' => 'Praha', 'zip' => '11000', 'country' => 'CZ'],
        'notes' => '',
        'idempotency_key' => 'idem_' . str_pad($suffix, 20, 'x'),
    ], null, 'session-' . $suffix);
    return ['snapshot' => $result['snapshot'], 'grant' => $result['grant'], 'reused' => $result['reused']];
}

/** @return array<string,mixed> */
function task04_order(PDO $pdo, string $storage, array $snapshot): array
{
    return (new PaymentOrderService($pdo, new DateTimeImmutable('2026-07-29T12:05:00+00:00'), $storage))
        ->createFromSnapshot($snapshot['snapshot']['public_id'], null, $snapshot['grant'])['order'];
}

/** @param array<string,mixed> $order @return array<string,mixed> */
function task04_event(array $order, string $eventId, ?int $amount = null, string $currency = 'czk', string $type = 'checkout.session.completed'): array
{
    return [
        'id' => $eventId,
        'type' => $type,
        'livemode' => false,
        'data' => ['object' => [
            'id' => $order['stripe_session_id'],
            'status' => $type === 'checkout.session.completed' ? 'complete' : 'expired',
            'payment_status' => $type === 'checkout.session.completed' ? 'paid' : 'unpaid',
            'amount_total' => $amount ?? (int) $order['total_minor'],
            'currency' => $currency,
            'payment_intent' => 'pi_test_' . substr($eventId, 4),
            'metadata' => ['order_public_id' => $order['public_id'], 'schema_version' => '1'],
        ]],
    ];
}

function task04_attach_stripe(PDO $pdo, int $orderId, string $suffix): array
{
    $query = $pdo->prepare(
        "UPDATE store_orders SET stripe_session_id = ?, stripe_checkout_url = ?,
         stripe_session_status = 'open', status = 'awaiting_payment', payment_status = 'awaiting_payment'
         WHERE id = ? RETURNING *"
    );
    $query->execute(["cs_test_{$suffix}", "https://checkout.stripe.com/c/pay/{$suffix}", $orderId]);
    return $query->fetch();
}

function task04_process(PDO $pdo, array $event): array
{
    return (new StripePaymentProcessor($pdo, new OrderStateMachine(), false))
        ->process($event, hash('sha256', json_encode($event, JSON_THROW_ON_ERROR)));
}

/** @param list<Closure():void> $jobs */
function task04_concurrent(array $jobs): void
{
    $pids = [];
    foreach ($jobs as $job) {
        $pid = pcntl_fork();
        if ($pid === -1) throw new RuntimeException('fork failed');
        if ($pid === 0) {
            try {
                $job();
                exit(0);
            } catch (Throwable $error) {
                $detail = $error instanceof PaymentOrderException ? $error->errorCode : $error->getMessage();
                fwrite(STDERR, "CHILD FAIL: {$detail}\n");
                exit(1);
            }
        }
        $pids[] = $pid;
    }
    foreach ($pids as $pid) {
        pcntl_waitpid($pid, $status);
        test_assert_same(0, pcntl_wexitstatus($status), 'concurrent child must succeed');
    }
}

$pdo = task04_pdo();
$pdo->exec((string) file_get_contents(__DIR__ . '/task-0-4-base-schema.sql'));
foreach ([
    '202607290001_checkout_snapshot_up.sql',
    '202607290002_order_access_and_download_grants_up.sql',
    '2026072900025_order_status_enum_up.sql',
    '202607290003_payments_and_inventory_up.sql',
] as $migration) {
    $pdo->exec((string) file_get_contents(__DIR__ . '/../../migrations/' . $migration));
}

$storage = sys_get_temp_dir() . '/vevit-task-0-4-' . bin2hex(random_bytes(6));
mkdir($storage . '/downloads', 0700, true);
file_put_contents($storage . '/downloads/paid.txt', 'paid');

$insertProduct = $pdo->prepare(
    "INSERT INTO store_products
        (name, slug, price, sale_price, type, stock, download_file, is_active, is_sellable, allow_backorder, currency, sku)
     VALUES (?, ?, ?, NULL, ?, ?, ?, TRUE, TRUE, ?, 'czk', ?) RETURNING id"
);
$insertProduct->execute(['Physical', 'physical', '100.00', 'physical', 20, null, 'false', 'PHYS']);
$physicalId = (int) $insertProduct->fetchColumn();
$insertProduct->execute(['Digital', 'digital', '50.00', 'digital', null, 'downloads/paid.txt', 'false', 'DIGI']);
$digitalId = (int) $insertProduct->fetchColumn();
$insertProduct->execute(['Last unit', 'last-unit', '75.00', 'physical', 1, null, 'false', 'LAST']);
$lastId = (int) $insertProduct->fetchColumn();
$insertProduct->execute(['Backorder', 'backorder', '25.00', 'physical', 0, null, 'true', 'BACK']);
$backorderId = (int) $insertProduct->fetchColumn();

// Snapshot conversion is atomic and idempotent under concurrent requests.
$same = task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 1]], 'same-snapshot');
$snapshotPublic = $same['snapshot']['public_id'];
$snapshotGrant = $same['grant'];
task04_concurrent([
    static function () use ($snapshotPublic, $snapshotGrant, $storage): void {
        (new PaymentOrderService(task04_pdo(), new DateTimeImmutable('2026-07-29T12:05:00+00:00'), $storage))
            ->createFromSnapshot($snapshotPublic, null, $snapshotGrant);
    },
    static function () use ($snapshotPublic, $snapshotGrant, $storage): void {
        (new PaymentOrderService(task04_pdo(), new DateTimeImmutable('2026-07-29T12:05:00+00:00'), $storage))
            ->createFromSnapshot($snapshotPublic, null, $snapshotGrant);
    },
]);
$pdo = task04_pdo(); // forked children inherit sockets; parent must reconnect.
$count = $pdo->prepare('SELECT COUNT(*) FROM store_orders o JOIN store_checkout_snapshots s ON s.id = o.checkout_snapshot_id WHERE s.public_id = ?');
$count->execute([$snapshotPublic]);
test_assert_same(1, (int) $count->fetchColumn(), 'two concurrent conversions create one order');
$retry = (new PaymentOrderService($pdo, new DateTimeImmutable('2026-07-29T12:05:00+00:00'), $storage))
    ->createFromSnapshot($snapshotPublic, null, $snapshotGrant);
test_assert_true($retry['reused'], 'identical retry returns existing order');
$fullRetry = task04_snapshot(
    $pdo,
    $storage,
    [['product_id' => $physicalId, 'quantity' => 1]],
    'same-snapshot',
    new DateTimeImmutable('2026-07-29T13:00:00+00:00')
);
test_assert_true($fullRetry['reused'], 'full checkout retry reuses a consumed snapshot even after snapshot TTL');
$count->execute([$snapshotPublic]);
test_assert_same(1, (int) $count->fetchColumn(), 'full retry cannot create a second snapshot/order chain');

// A Stripe session is server-created and safely reused.
final class Task04StripeClient implements StripeCheckoutClient {
    public int $calls = 0;
    public function __construct(private readonly bool $expectShipping = true) {}
    public function createCheckoutSession(array $parameters, string $idempotencyKey): array {
        $this->calls++;
        test_assert_true(str_starts_with($idempotencyKey, 'vevit-store:checkout:v1:'), 'Stripe idempotency key is server namespaced');
        test_assert_true(!array_key_exists('metadata[guest_grant]', $parameters), 'guest grant is absent from Stripe');
        $total = 0;
        for ($i = 0; isset($parameters["line_items[{$i}][quantity]"]); $i++) {
            $total += $parameters["line_items[{$i}][price_data][unit_amount]"] * $parameters["line_items[{$i}][quantity]"];
        }
        if ($this->expectShipping) {
            test_assert_same(9900, $parameters['line_items[1][price_data][unit_amount]'], 'paid shipping is a server-owned Stripe line item');
        } else {
            test_assert_true(!isset($parameters['line_items[1][quantity]']), 'free shipping creates no artificial Stripe charge');
        }
        return [
            'id' => 'cs_test_' . $parameters['client_reference_id'],
            'url' => 'https://checkout.stripe.com/c/pay/' . $parameters['client_reference_id'],
            'expires_at' => time() + 86400,
            'mode' => 'payment',
            'status' => 'open',
            'payment_status' => 'unpaid',
            'livemode' => false,
            'client_reference_id' => $parameters['client_reference_id'],
            'metadata' => ['order_public_id' => $parameters['metadata[order_public_id]'], 'schema_version' => '1'],
            'amount_total' => $total,
            'currency' => 'czk',
        ];
    }
}
$client = new Task04StripeClient();
$service = new StripeCheckoutService($pdo, $client, 'https://store.example.test', false);
$sessionOne = $service->createOrReuse((int) $retry['order']['id']);
$sessionTwo = $service->createOrReuse((int) $retry['order']['id']);
test_assert_same($sessionOne['url'], $sessionTwo['url'], 'Stripe session retry returns same URL');
test_assert_same(1, $client->calls, 'stored Stripe session avoids a second API side effect');
$pdo->prepare("UPDATE store_orders SET stripe_session_expires_at = NOW() - INTERVAL '1 minute' WHERE id = ?")->execute([$retry['order']['id']]);
$service->createOrReuse((int) $retry['order']['id']);
test_assert_same(2, $client->calls, 'expired Stripe session is recreated with a new server attempt');
$attempt = $pdo->prepare('SELECT stripe_session_attempt FROM store_orders WHERE id = ?');
$attempt->execute([$retry['order']['id']]);
test_assert_same(1, (int) $attempt->fetchColumn(), 'expired session increments namespaced idempotency attempt');
$freeShippingSnapshot = task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 10]], 'free-shipping');
$freeShippingOrder = task04_order($pdo, $storage, $freeShippingSnapshot);
$freeClient = new Task04StripeClient(false);
(new StripeCheckoutService($pdo, $freeClient, 'https://store.example.test', false))->createOrReuse((int) $freeShippingOrder['id']);
test_assert_same(1, $freeClient->calls, 'free-shipping order creates one exact Stripe session');
final class Task04FailingStripeClient implements StripeCheckoutClient {
    public function createCheckoutSession(array $parameters, string $idempotencyKey): array {
        throw new RuntimeException('injected Stripe outage');
    }
}
final class Task04WrongStripeClient implements StripeCheckoutClient {
    public function createCheckoutSession(array $parameters, string $idempotencyKey): array {
        return [
            'id' => 'cs_test_wrongamount', 'url' => 'https://checkout.stripe.com/c/pay/wrong',
            'expires_at' => 1785340800, 'mode' => 'payment', 'status' => 'open',
            'payment_status' => 'unpaid', 'client_reference_id' => $parameters['client_reference_id'],
            'livemode' => false,
            'metadata' => ['order_public_id' => $parameters['metadata[order_public_id]'], 'schema_version' => '1'],
            'amount_total' => 1, 'currency' => 'czk',
        ];
    }
}
$stripeFailureSnapshot = task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 1]], 'stripe-failure');
$stripeFailureOrder = task04_order($pdo, $storage, $stripeFailureSnapshot);
try {
    (new StripeCheckoutService($pdo, new Task04FailingStripeClient(), 'https://store.example.test', false))
        ->createOrReuse((int) $stripeFailureOrder['id']);
    test_assert_true(false, 'Stripe API failure must propagate');
} catch (RuntimeException) {
}
$stripeFailureRetry = task04_order($pdo, $storage, $stripeFailureSnapshot);
test_assert_same((int) $stripeFailureOrder['id'], (int) $stripeFailureRetry['id'], 'Stripe API retry reuses the same order');
$movementCountFailure = $pdo->prepare('SELECT COUNT(*) FROM store_inventory_movements WHERE order_id = ?');
$movementCountFailure->execute([$stripeFailureOrder['id']]);
test_assert_same(0, (int) $movementCountFailure->fetchColumn(), 'Stripe API failure changes no stock');
$wrongSessionSnapshot = task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 1]], 'wrong-session');
$wrongSessionOrder = task04_order($pdo, $storage, $wrongSessionSnapshot);
try {
    (new StripeCheckoutService($pdo, new Task04WrongStripeClient(), 'https://store.example.test', false))
        ->createOrReuse((int) $wrongSessionOrder['id']);
    test_assert_true(false, 'mismatched Stripe session response must fail closed');
} catch (RuntimeException) {
}
$sessionStored = $pdo->prepare('SELECT stripe_session_id FROM store_orders WHERE id = ?');
$sessionStored->execute([$wrongSessionOrder['id']]);
test_assert_same(null, $sessionStored->fetchColumn(), 'mismatched Stripe session is never persisted');

// Revalidation rejects expired, foreign, repriced, deactivated and out-of-stock snapshots.
$expired = task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 1]], 'expired');
$pdo->prepare("UPDATE store_checkout_snapshots SET expires_at = '2026-07-29 11:59:00' WHERE public_id = ?")->execute([$expired['snapshot']['public_id']]);
try {
    task04_order($pdo, $storage, $expired);
    test_assert_true(false, 'expired snapshot must fail');
} catch (PaymentOrderException $error) {
    test_assert_same('snapshot_expired', $error->errorCode, 'expired snapshot is explicit');
}
$foreign = task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 1]], 'foreign');
try {
    (new PaymentOrderService($pdo, new DateTimeImmutable('2026-07-29T12:05:00+00:00'), $storage))
        ->createFromSnapshot($foreign['snapshot']['public_id'], null, str_repeat('a', 64));
    test_assert_true(false, 'foreign snapshot grant must fail');
} catch (PaymentOrderException $error) {
    test_assert_same('snapshot_unavailable', $error->errorCode, 'foreign snapshot does not enumerate ownership');
}
$repriced = task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 1]], 'repriced');
$pdo->prepare("UPDATE store_products SET price = '101.00' WHERE id = ?")->execute([$physicalId]);
try {
    task04_order($pdo, $storage, $repriced);
    test_assert_true(false, 'repriced product must require a new snapshot');
} catch (PaymentOrderException $error) {
    test_assert_same('price_changed', $error->errorCode, 'price change is never hidden in Stripe');
}
$pdo->prepare("UPDATE store_products SET price = '100.00' WHERE id = ?")->execute([$physicalId]);
$deactivated = task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 1]], 'deactivated');
$pdo->prepare('UPDATE store_products SET is_active = FALSE WHERE id = ?')->execute([$physicalId]);
try {
    task04_order($pdo, $storage, $deactivated);
    test_assert_true(false, 'deactivated product must fail conversion');
} catch (PaymentOrderException $error) {
    test_assert_same('product_unavailable', $error->errorCode, 'deactivated product is not ordered');
}
$pdo->prepare('UPDATE store_products SET is_active = TRUE WHERE id = ?')->execute([$physicalId]);

// Mixed order: same webhook concurrently produces one movement and one entitlement.
$mixed = task04_snapshot($pdo, $storage, [
    ['product_id' => $physicalId, 'quantity' => 2],
    ['product_id' => $digitalId, 'quantity' => 1],
], 'mixed');
$mixedOrder = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, $mixed)['id'], 'mixed');
$mixedEvent = task04_event($mixedOrder, 'evt_mixed_concurrent');
task04_concurrent([
    static fn () => task04_process(task04_pdo(), $mixedEvent),
    static fn () => task04_process(task04_pdo(), $mixedEvent),
]);
$pdo = task04_pdo();
$movementCount = $pdo->prepare('SELECT COUNT(*) FROM store_inventory_movements WHERE order_id = ?');
$movementCount->execute([$mixedOrder['id']]);
test_assert_same(1, (int) $movementCount->fetchColumn(), 'same concurrent event creates one physical movement');
$entitlementCount = $pdo->prepare('SELECT COUNT(*) FROM store_download_entitlements WHERE order_id = ?');
$entitlementCount->execute([$mixedOrder['id']]);
test_assert_same(1, (int) $entitlementCount->fetchColumn(), 'same concurrent event creates one digital entitlement');
$stock = $pdo->prepare('SELECT stock FROM store_products WHERE id = ?');
$stock->execute([$physicalId]);
test_assert_same(18, (int) $stock->fetchColumn(), 'physical stock is deducted exactly once');

// Pure digital payment creates an entitlement and no inventory movement.
$digitalOnly = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, task04_snapshot($pdo, $storage, [['product_id' => $digitalId, 'quantity' => 1]], 'digital-only'))['id'], 'digitalonly');
test_assert_same('paid', task04_process($pdo, task04_event($digitalOnly, 'evt_digital_only'))['result'], 'pure digital order is paid');
$movementCount->execute([$digitalOnly['id']]);
test_assert_same(0, (int) $movementCount->fetchColumn(), 'pure digital order has no stock movement');
$entitlementCount->execute([$digitalOnly['id']]);
test_assert_same(1, (int) $entitlementCount->fetchColumn(), 'pure digital order has one entitlement');

// Deactivation before payment preserves payment evidence but creates no entitlement.
$inactiveDigital = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, task04_snapshot($pdo, $storage, [['product_id' => $digitalId, 'quantity' => 1]], 'inactive-digital'))['id'], 'inactivedigital');
$pdo->prepare('UPDATE store_products SET is_active = FALSE WHERE id = ?')->execute([$digitalId]);
test_assert_same('paid_manual_review', task04_process($pdo, task04_event($inactiveDigital, 'evt_inactive_digital'))['result'], 'deactivated digital item requires review after paid evidence');
$entitlementCount->execute([$inactiveDigital['id']]);
test_assert_same(0, (int) $entitlementCount->fetchColumn(), 'deactivated-before-payment item receives no entitlement');
$pdo->prepare('UPDATE store_products SET is_active = TRUE WHERE id = ?')->execute([$digitalId]);

// Different successful event for the same payment and lost-response retry are no-ops.
$secondEvent = task04_event($mixedOrder, 'evt_mixed_second');
$secondEvent['data']['object']['payment_intent'] = $mixedEvent['data']['object']['payment_intent'];
task04_process($pdo, $secondEvent);
task04_process($pdo, $mixedEvent);
$movementCount->execute([$mixedOrder['id']]);
test_assert_same(1, (int) $movementCount->fetchColumn(), 'different success events and HTTP retries do not repeat movement');
$entitlementCount->execute([$mixedOrder['id']]);
test_assert_same(1, (int) $entitlementCount->fetchColumn(), 'different success events do not repeat entitlement');

// A late failure/expiry event cannot regress a paid order.
$late = task04_event($mixedOrder, 'evt_mixed_late', null, 'czk', 'checkout.session.expired');
task04_process($pdo, $late);
$payment = $pdo->prepare('SELECT payment_status FROM store_orders WHERE id = ?');
$payment->execute([$mixedOrder['id']]);
test_assert_same('paid', $payment->fetchColumn(), 'late expiry does not overwrite paid');

// Amount/currency/session correlation mismatches have no side effects.
foreach ([
    ['amount', 1, 'czk', 'evt_bad_amount'],
    ['currency', null, 'eur', 'evt_bad_currency'],
] as [$kind, $amount, $currency, $eventId]) {
    $snapshot = task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 1]], $kind);
    $order = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, $snapshot)['id'], $kind);
    $event = task04_event($order, $eventId, $amount, $currency);
    $result = task04_process($pdo, $event);
    test_assert_same('manual_review', $result['result'], "{$kind} mismatch requires review");
    $movementCount->execute([$order['id']]);
    test_assert_same(0, (int) $movementCount->fetchColumn(), "{$kind} mismatch has no movement");
}
$correlation = task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 1]], 'correlation');
$correlationOrder = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, $correlation)['id'], 'correlation');
$badCorrelation = task04_event($correlationOrder, 'evt_bad_correlation');
$badCorrelation['data']['object']['id'] = 'cs_test_someone_else';
test_assert_same('manual_review', task04_process($pdo, $badCorrelation)['result'], 'Stripe object for another order is rejected');

// Reusing an event ID with a changed payload is permanently flagged.
$payloadOrder = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, task04_snapshot($pdo, $storage, [['product_id' => $physicalId, 'quantity' => 1]], 'payload'))['id'], 'payload');
$payloadEvent = task04_event($payloadOrder, 'evt_payload_reuse', 1);
task04_process($pdo, $payloadEvent);
$payloadEvent['data']['object']['amount_total'] = 2;
test_assert_same('manual_review', task04_process($pdo, $payloadEvent)['result'], 'changed payload for same event ID cannot execute');
$ledgerResult = $pdo->query("SELECT result FROM store_payment_events WHERE stripe_event_id = 'evt_payload_reuse'")->fetchColumn();
test_assert_same('event_id_payload_mismatch', $ledgerResult, 'payload mismatch remains in audit ledger');

// Two buyers of the final unit: one fulfills, one remains paid/manual-review; no partial effects.
$lastA = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, task04_snapshot($pdo, $storage, [['product_id' => $lastId, 'quantity' => 1]], 'last-a'))['id'], 'lasta');
$lastB = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, task04_snapshot($pdo, $storage, [['product_id' => $lastId, 'quantity' => 1]], 'last-b'))['id'], 'lastb');
$lastEventA = task04_event($lastA, 'evt_last_a');
$lastEventB = task04_event($lastB, 'evt_last_b');
task04_concurrent([
    static fn () => task04_process(task04_pdo(), $lastEventA),
    static fn () => task04_process(task04_pdo(), $lastEventB),
]);
$pdo = task04_pdo();
$stock = $pdo->prepare('SELECT stock FROM store_products WHERE id = ?');
$movementCount = $pdo->prepare('SELECT COUNT(*) FROM store_inventory_movements WHERE order_id = ?');
$entitlementCount = $pdo->prepare('SELECT COUNT(*) FROM store_download_entitlements WHERE order_id = ?');
$payment = $pdo->prepare('SELECT payment_status FROM store_orders WHERE id = ?');
$stock->execute([$lastId]);
test_assert_same(0, (int) $stock->fetchColumn(), 'last unit never becomes negative');
$statuses = $pdo->query("SELECT payment_status, fulfillment_status FROM store_orders WHERE id IN ({$lastA['id']}, {$lastB['id']}) ORDER BY fulfillment_status")->fetchAll();
test_assert_true($statuses[0]['payment_status'] === 'paid' && $statuses[1]['payment_status'] === 'paid', 'both verified payments remain recorded');
test_assert_same(['manual_review', 'ready'], array_column($statuses, 'fulfillment_status'), 'one last-unit order is ready and one needs review');

// Backorder may deduct below zero, as explicitly permitted by product data.
$back = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, task04_snapshot($pdo, $storage, [['product_id' => $backorderId, 'quantity' => 2]], 'backorder'))['id'], 'backorder');
test_assert_same('paid', task04_process($pdo, task04_event($back, 'evt_backorder'))['result'], 'backorder payment fulfills');
$stock->execute([$backorderId]);
test_assert_same(-2, (int) $stock->fetchColumn(), 'explicit backorder permits negative accounting stock');

// Triggered failure after first movement rolls back the entire payment transaction.
$rollbackSnapshot = task04_snapshot($pdo, $storage, [
    ['product_id' => $physicalId, 'quantity' => 1],
    ['product_id' => $backorderId, 'quantity' => 1],
], 'rollback-movement');
$rollbackOrder = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, $rollbackSnapshot)['id'], 'rollbackmovement');
$pdo->exec("CREATE OR REPLACE FUNCTION task04_fail_second_movement() RETURNS trigger AS $$
BEGIN
 IF (SELECT COUNT(*) FROM store_inventory_movements WHERE order_id = NEW.order_id) >= 1 THEN RAISE EXCEPTION 'injected movement failure'; END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql");
$pdo->exec('CREATE TRIGGER task04_fail_movement BEFORE INSERT ON store_inventory_movements FOR EACH ROW EXECUTE FUNCTION task04_fail_second_movement()');
try {
    task04_process($pdo, task04_event($rollbackOrder, 'evt_rollback_movement'));
    test_assert_true(false, 'injected movement error must propagate for Stripe retry');
} catch (Throwable) {
}
$pdo->exec('DROP TRIGGER task04_fail_movement ON store_inventory_movements');
$movementCount->execute([$rollbackOrder['id']]);
test_assert_same(0, (int) $movementCount->fetchColumn(), 'failure after first movement rolls back every movement');
$payment->execute([$rollbackOrder['id']]);
test_assert_same('awaiting_payment', $payment->fetchColumn(), 'movement rollback leaves payment retryable');

// Entitlement failure also rolls back stock and paid state.
$grantFailSnapshot = task04_snapshot($pdo, $storage, [
    ['product_id' => $physicalId, 'quantity' => 1],
    ['product_id' => $digitalId, 'quantity' => 1],
], 'rollback-grant');
$grantFailOrder = task04_attach_stripe($pdo, (int) task04_order($pdo, $storage, $grantFailSnapshot)['id'], 'rollbackgrant');
$pdo->exec("CREATE OR REPLACE FUNCTION task04_fail_entitlement() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'injected entitlement failure'; END; $$ LANGUAGE plpgsql");
$pdo->exec('CREATE TRIGGER task04_fail_entitlement BEFORE INSERT ON store_download_entitlements FOR EACH ROW EXECUTE FUNCTION task04_fail_entitlement()');
try {
    task04_process($pdo, task04_event($grantFailOrder, 'evt_rollback_grant'));
    test_assert_true(false, 'injected entitlement error must propagate for Stripe retry');
} catch (Throwable) {
}
$pdo->exec('DROP TRIGGER task04_fail_entitlement ON store_download_entitlements');
$movementCount->execute([$grantFailOrder['id']]);
test_assert_same(0, (int) $movementCount->fetchColumn(), 'entitlement failure rolls back inventory');
$payment->execute([$grantFailOrder['id']]);
test_assert_same('awaiting_payment', $payment->fetchColumn(), 'entitlement rollback leaves payment retryable');

// Schema-level uniqueness is independently verified.
try {
    $itemId = (int) $pdo->query("SELECT id FROM store_order_items WHERE order_id = {$mixedOrder['id']} AND product_type = 'physical'")->fetchColumn();
    $pdo->prepare("INSERT INTO store_inventory_movements(product_id,order_id,order_item_id,movement_type,quantity,source_key) VALUES (?,?,?,'sale',-1,?)")
        ->execute([$physicalId, $mixedOrder['id'], $itemId, 'duplicate-source-attempt']);
    test_assert_true(false, 'database must reject duplicate movement per item/type');
} catch (PDOException $exception) {
    test_assert_same('23505', $exception->getCode(), 'movement uniqueness uses PostgreSQL unique constraint');
}
try {
    $itemId = (int) $pdo->query("SELECT id FROM store_order_items WHERE order_id = {$mixedOrder['id']} AND product_type = 'digital'")->fetchColumn();
    $pdo->prepare('INSERT INTO store_download_entitlements(order_id,order_item_id) VALUES (?,?)')->execute([$mixedOrder['id'], $itemId]);
    test_assert_true(false, 'database must reject duplicate entitlement');
} catch (PDOException $exception) {
    test_assert_same('23505', $exception->getCode(), 'entitlement uniqueness uses PostgreSQL unique constraint');
}

test_complete('payment-flow-postgres-test');
