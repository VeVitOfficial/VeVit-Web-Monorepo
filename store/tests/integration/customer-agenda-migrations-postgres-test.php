<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

$migration = __DIR__ . '/../../migrations/202607300002_customer_agenda_up.sql';
test_assert_true(is_file($migration), 'customer agenda up migration exists');
$sql = (string) file_get_contents($migration);
test_assert_true(str_starts_with(ltrim($sql), 'BEGIN;'), 'customer agenda up migration is transactional');

$dsn = getenv('VEVIT_STORE_TEST_DSN');
$dbUser = getenv('VEVIT_STORE_TEST_DB_USER');
$dbPass = getenv('VEVIT_STORE_TEST_DB_PASS');
if ($dsn === false || $dbUser === false || $dbPass === false) {
    fwrite(STDOUT, "SKIP: customer-agenda-migrations-postgres-test requires PostgreSQL test environment\n");
    exit(77);
}
if (!str_starts_with($dsn, 'pgsql:') || !preg_match('/(?:dbname=|\/)[^;\/]*test/i', $dsn)) {
    fwrite(STDERR, "REFUSE: integration DSN must name a test database.\n");
    exit(1);
}
$pdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec("DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$");
$pdo->exec('DROP TABLE IF EXISTS store_case_attachments, store_delivery_events, store_delivery_items, store_deliveries, store_return_events, store_return_items, store_returns, store_claim_events, store_claim_items, store_claims, store_product_favorites, store_audit_events CASCADE');
$pdo->exec((string) file_get_contents(__DIR__ . '/task-0-4-base-schema.sql'));
foreach (['202607290001_checkout_snapshot_up.sql', '202607290002_order_access_and_download_grants_up.sql', '202607290003_payments_and_inventory_up.sql'] as $name) {
    $pdo->exec((string) file_get_contents(__DIR__ . '/../../migrations/' . $name));
}
$pdo->exec($sql);
foreach (['store_claims', 'store_returns', 'store_deliveries', 'store_case_attachments', 'store_product_favorites', 'store_audit_events'] as $table) {
    test_assert_true($pdo->query("SELECT to_regclass('public." . $table . "')")->fetchColumn() !== null, $table . ' exists');
}
test_assert_same('public.store_return_events_id_seq',(string)$pdo->query("SELECT pg_get_serial_sequence('store_return_events','id')")->fetchColumn(),'return event ledger owns a dedicated sequence');
test_assert_same('public.store_delivery_events_id_seq',(string)$pdo->query("SELECT pg_get_serial_sequence('store_delivery_events','id')")->fetchColumn(),'delivery event ledger owns a dedicated sequence');

$pdo->exec("INSERT INTO store_products(id,name,slug,price,type,stock) VALUES(1,'A','a',10,'physical',2)");
$pdo->exec("INSERT INTO store_orders(id,order_number,status,total,currency,customer_email,customer_name) VALUES(1,'O1','paid',10,'czk','a@example.test','A'),(2,'O2','paid',10,'czk','b@example.test','B')");
$pdo->exec("INSERT INTO store_order_items(id,order_id,product_id,product_name,product_type,quantity,unit_price) VALUES(1,1,1,'A','physical',1,10),(2,2,1,'A','physical',1,10)");
$pdo->exec("INSERT INTO store_claims(id,public_id,order_id,owner_type,reason_code,problem_description,requested_resolution,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES(1,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',1,'guest','x','x','repair',repeat('1',64),repeat('2',64),repeat('3',64))");
try {
    $pdo->exec("INSERT INTO store_claim_items(claim_id,order_id,order_item_id,requested_quantity) VALUES(1,1,2,1)");
    test_assert_true(false, 'cross-order claim item must be rejected');
} catch (PDOException) {
}
try {
    $pdo->exec("INSERT INTO store_claims(public_id,order_id,owner_type,reason_code,problem_description,requested_resolution,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',1,'account','x','x','repair',repeat('4',64),repeat('5',64),repeat('6',64))");
    test_assert_true(false, 'account owner without user id must be rejected');
} catch (PDOException) {
}
$pdo->exec("INSERT INTO store_returns(id,public_id,order_id,owner_type,reason_code,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES(1,'ffffffffffffffffffffffffffffffff',1,'guest','x',repeat('4',64),repeat('5',64),repeat('6',64))");
try {
    $pdo->exec("INSERT INTO store_return_events(public_id,action,actor_type,auth_source,correlation_id) VALUES(repeat('0',32),'invalid','system','test',repeat('1',32))");
    test_assert_true(false, 'return event without parent must be rejected');
} catch (PDOException) {
}
try {
    $pdo->exec("UPDATE store_returns SET refund_status='confirmed' WHERE id=1");
    test_assert_true(false, 'confirmed refund requires trusted evidence fields');
} catch (PDOException) {
}
try {
    $pdo->exec("INSERT INTO store_return_items(return_id,order_id,order_item_id,requested_quantity,received_quantity,inspected_quantity,consumed_quantity) VALUES(1,1,1,1,0,0,1)");
    test_assert_true(false, 'return consumed quantity cannot exceed received and inspected');
} catch (PDOException) {
}
$pdo->exec("INSERT INTO store_deliveries(id,public_id,order_id,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES(1,'11111111111111111111111111111111',1,repeat('7',64),repeat('8',64),repeat('9',64)),(2,'22222222222222222222222222222222',1,repeat('a',64),repeat('b',64),repeat('c',64))");
try {
    $pdo->exec("INSERT INTO store_delivery_events(public_id,action,actor_type,auth_source,correlation_id) VALUES(repeat('4',32),'invalid','system','test',repeat('5',32))");
    test_assert_true(false, 'delivery event without parent must be rejected');
} catch (PDOException) {
}
try {
    $pdo->exec("UPDATE store_deliveries SET status='delivered' WHERE id=1");
    test_assert_true(false, 'delivered status requires delivered timestamp');
} catch (PDOException) {
}
try {
    $pdo->exec("INSERT INTO store_delivery_items(delivery_id,order_id,order_item_id,shipped_quantity) VALUES(1,1,1,0)");
    test_assert_true(false, 'delivery shipped quantity must be positive');
} catch (PDOException) {
}
test_assert_same(2, (int) $pdo->query('SELECT count(*) FROM store_deliveries WHERE order_id=1')->fetchColumn(), 'one order can have multiple deliveries');
try {
    $pdo->exec("INSERT INTO store_case_attachments(public_id,claim_id,return_id,owner_type,storage_provider,storage_key,stored_filename,original_filename,detected_mime,byte_size,sha256,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES('33333333333333333333333333333333',1,1,'guest','local_private','case-attachments/aa/bb/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg','a.jpg','a.jpg','image/jpeg',1,repeat('1',64),repeat('2',64),repeat('3',64),repeat('4',64))");
    test_assert_true(false, 'attachment with two parents must be rejected');
} catch (PDOException) {
}
$policyCount = (int) $pdo->query("SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename IN('store_claims','store_returns','store_deliveries','store_case_attachments','store_product_favorites')")->fetchColumn();
test_assert_same(0, $policyCount, 'migration creates no public or misleading RLS policies');
try {
    $pdo->exec("INSERT INTO store_case_attachments(public_id,owner_type,storage_provider,storage_key,stored_filename,original_filename,detected_mime,byte_size,sha256,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','guest','local_private','aa/file.bin','file.bin','x.pdf','application/pdf',1,repeat('1',64),repeat('2',64),repeat('3',64),repeat('4',64))");
    test_assert_true(false, 'attachment without parent must be rejected');
} catch (PDOException) {
}
$pdo->exec("INSERT INTO store_audit_events(public_id,entity_type,entity_id,action,outcome,actor_type,auth_source,correlation_id) VALUES('cccccccccccccccccccccccccccccccc','test',1,'create','success','system','test','dddddddddddddddddddddddddddddddd')");
try {
    $pdo->exec("DELETE FROM store_audit_events");
    test_assert_true(false, 'technical audit must be append-only');
} catch (PDOException) {
}
$pdo->exec("SET ROLE anon");
try {
    $pdo->query('SELECT * FROM store_claims')->fetchAll();
    test_assert_true(false, 'anon role must not read claims');
} catch (PDOException) {
} finally {
    $pdo->exec('RESET ROLE');
}
test_assert_same(0,(int)$pdo->query("SELECT has_sequence_privilege('anon','store_claims_id_seq','USAGE')::int")->fetchColumn(),'anon role has no agenda sequence usage');
$pdo->exec("SET ROLE authenticated");
try {
    $pdo->query('SELECT * FROM store_returns')->fetchAll();
    test_assert_true(false, 'authenticated Data API role must not read returns');
} catch (PDOException) {
} finally {
    $pdo->exec('RESET ROLE');
}
$pdo->query('SELECT * FROM store_claims')->fetchAll();
test_assert_true(true, 'direct PDO owner role remains usable with RLS');
test_complete('customer-agenda-migrations-postgres-test');
