<?php
// Regression test: verifies that the full migration chain applies cleanly on a
// database where store_orders.status is a real PostgreSQL enum (order_status)
// with only the original 7 values — simulating the production schema that
// triggered ERROR 22P02 when 202607290003 tried to add pending_checkout to a
// CHECK constraint before the enum was extended.

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

$dsn = getenv('VEVIT_STORE_TEST_DSN');
$dbUser = getenv('VEVIT_STORE_TEST_DB_USER');
$dbPass = getenv('VEVIT_STORE_TEST_DB_PASS');
if ($dsn === false || $dbUser === false || $dbPass === false) {
    fwrite(STDOUT, "SKIP: enum-extension-postgres-test requires PostgreSQL test environment\n");
    exit(77);
}
if (!str_starts_with($dsn, 'pgsql:') || !preg_match('/(?:dbname=|\/)[^;\/]*test/i', $dsn)) {
    fwrite(STDERR, "REFUSE: integration DSN must name a test database.\n");
    exit(1);
}
if (!extension_loaded('pdo_pgsql')) {
    fwrite(STDERR, "REFUSE: pdo_pgsql is required.\n");
    exit(1);
}

$pdo = new PDO($dsn, $dbUser, $dbPass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

// Build a minimal schema using the original order_status enum (7 values only),
// without pending_checkout / awaiting_payment / manual_review.
// This reproduces the pre-migration production state that caused ERROR 22P02.
$pdo->exec(<<<'SQL'
    DROP TABLE  IF EXISTS store_order_items, store_orders, store_products CASCADE;
    DROP TYPE   IF EXISTS order_status;

    CREATE TYPE order_status AS ENUM (
        'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
    );

    CREATE TABLE store_products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        short_desc VARCHAR(255),
        price DECIMAL(10,2) NOT NULL,
        sale_price DECIMAL(10,2) NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('physical','digital')),
        stock INT NULL,
        images TEXT,
        download_file VARCHAR(500) NULL,
        stripe_price_id VARCHAR(100) NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE store_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(20) NOT NULL UNIQUE,
        user_id TEXT NULL,
        status order_status NOT NULL DEFAULT 'pending',
        total DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'czk',
        stripe_session_id VARCHAR(255) NULL,
        stripe_payment_intent VARCHAR(255) NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        shipping_address TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE store_order_items (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES store_products(id) ON DELETE RESTRICT,
        product_name VARCHAR(255) NOT NULL,
        product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('physical','digital')),
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        download_token VARCHAR(64) NULL,
        download_expires_at TIMESTAMP NULL,
        download_count INT NOT NULL DEFAULT 0
    );
SQL);

// Verify the baseline: new values must NOT be in the enum yet.
$initialLabels = $pdo->query(
    "SELECT array_agg(enumlabel ORDER BY enumsortorder) FROM pg_enum e
     JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'order_status'"
)->fetchColumn();
test_assert_true(
    is_string($initialLabels) && !str_contains($initialLabels, 'pending_checkout'),
    'baseline enum must not contain pending_checkout before migration'
);

// Trying to insert pending_checkout before the enum migration must fail.
$threw = false;
try {
    $pdo->exec("INSERT INTO store_orders (order_number, status, total, customer_email, customer_name)
                VALUES ('REG-0001', 'pending_checkout', 1.00, 'x@example.test', 'X')");
} catch (PDOException $e) {
    $threw = true;
}
test_assert_true($threw, 'pending_checkout must be rejected by pre-migration enum');

// Apply enum extension migration (no transaction wrapper — each ADD VALUE auto-commits).
$migrationDir = __DIR__ . '/../../migrations/';
$pdo->exec((string) file_get_contents($migrationDir . '2026072900025_order_status_enum_up.sql'));

// After enum extension, all three new values must be present.
$labelsAfter = $pdo->query(
    "SELECT array_agg(enumlabel ORDER BY enumsortorder) FROM pg_enum e
     JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'order_status'"
)->fetchColumn();
test_assert_true(
    is_string($labelsAfter) && str_contains($labelsAfter, 'pending_checkout'),
    'enum must contain pending_checkout after extension'
);
test_assert_true(
    is_string($labelsAfter) && str_contains($labelsAfter, 'awaiting_payment'),
    'enum must contain awaiting_payment after extension'
);
test_assert_true(
    is_string($labelsAfter) && str_contains($labelsAfter, 'manual_review'),
    'enum must contain manual_review after extension'
);
// Original values must survive.
foreach (['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as $original) {
    test_assert_true(
        is_string($labelsAfter) && str_contains($labelsAfter, $original),
        "original enum value '{$original}' must survive extension"
    );
}

// Now pending_checkout must be insertable.
$pdo->exec("INSERT INTO store_orders (order_number, status, total, customer_email, customer_name)
            VALUES ('REG-0002', 'pending_checkout', 1.00, 'x@example.test', 'X')");
$insertedStatus = $pdo->query("SELECT status FROM store_orders WHERE order_number = 'REG-0002'")->fetchColumn();
test_assert_same('pending_checkout', $insertedStatus, 'pending_checkout can be stored after enum extension');

// Also load the remaining prerequisite migrations (checkout_snapshot, grants) so
// that the main payments/inventory migration has all foreign key targets.
foreach ([
    '202607290001_checkout_snapshot_up.sql',
    '202607290002_order_access_and_download_grants_up.sql',
] as $m) {
    $pdo->exec((string) file_get_contents($migrationDir . $m));
}

// Apply the main migration. This previously failed with 22P02 on enum databases.
$pdo->exec((string) file_get_contents($migrationDir . '202607290003_payments_and_inventory_up.sql'));

// The CHECK constraint must now reference all valid enum values.
$constraint = $pdo->query(
    "SELECT pg_get_constraintdef(c.oid)
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
      WHERE c.conname = 'store_orders_status_check' AND t.relname = 'store_orders'"
)->fetchColumn();
test_assert_true(
    is_string($constraint) && str_contains($constraint, 'pending_checkout'),
    'post-migration status CHECK must include pending_checkout'
);
test_assert_true(
    is_string($constraint) && str_contains($constraint, 'manual_review'),
    'post-migration status CHECK must include manual_review'
);

// All three new statuses must be insertable on an actual order row.
foreach (['awaiting_payment', 'manual_review'] as $newStatus) {
    $pdo->exec("UPDATE store_orders SET status = '{$newStatus}' WHERE order_number = 'REG-0002'");
    $got = $pdo->query("SELECT status FROM store_orders WHERE order_number = 'REG-0002'")->fetchColumn();
    test_assert_same($newStatus, $got, "status '{$newStatus}' must be storable after full migration chain");
}

// Idempotency: applying enum migration a second time must not error.
$pdo->exec((string) file_get_contents($migrationDir . '2026072900025_order_status_enum_up.sql'));

test_complete('enum-extension-postgres-test');
