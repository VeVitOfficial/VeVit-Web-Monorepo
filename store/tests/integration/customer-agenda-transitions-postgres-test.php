<?php
declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
foreach ([
    'auth/ActorContext',
    'orders/OrderAccessService',
    'orders/CaseQuantityAvailability',
    'database/Transactional',
    'audit/AuditActor',
    'audit/AuditService',
    'claims/ClaimStateMachine',
    'claims/ClaimRepository',
    'claims/ClaimService',
    'returns/ReturnStateMachine',
    'returns/ReturnRepository',
    'returns/ReturnService',
    'delivery/DeliveryStateMachine',
    'delivery/TrackingUrlPolicy',
    'delivery/DeliveryRepository',
    'delivery/DeliveryService',
] as $file) {
    require_once __DIR__ . '/../../lib/' . $file . '.php';
}

$dsn = getenv('VEVIT_STORE_TEST_DSN');
$user = getenv('VEVIT_STORE_TEST_DB_USER');
$pass = getenv('VEVIT_STORE_TEST_DB_PASS');
if ($dsn === false || $user === false || $pass === false) {
    fwrite(STDOUT, "SKIP: PostgreSQL test environment required\n");
    exit(77);
}
if (!str_starts_with($dsn, 'pgsql:') || !preg_match('/(?:dbname=|\/)[^;\/]*test/i', $dsn)) {
    fwrite(STDERR, "REFUSE: explicit test database required\n");
    exit(1);
}

$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
$pdo->exec('DROP TABLE IF EXISTS store_case_attachments,store_delivery_events,store_delivery_items,store_deliveries,store_return_events,store_return_items,store_returns,store_claim_events,store_claim_items,store_claims,store_product_favorites,store_audit_events CASCADE');
$pdo->exec((string) file_get_contents(__DIR__ . '/task-0-4-base-schema.sql'));
foreach ([
    '202607290001_checkout_snapshot_up.sql',
    '202607290002_order_access_and_download_grants_up.sql',
    '202607290003_payments_and_inventory_up.sql',
    '202607300002_customer_agenda_up.sql',
] as $migration) {
    $pdo->exec((string) file_get_contents(__DIR__ . '/../../migrations/' . $migration));
}

$pdo->exec("INSERT INTO store_products(id,name,slug,price,type,stock) VALUES(1,'A','a',10,'physical',5)");
$pdo->exec("INSERT INTO store_orders(id,order_number,public_id,status,total,currency,customer_email,customer_name) VALUES(1,'O1','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','delivered',20,'czk','a@example.test','A'),(2,'O2','eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee','delivered',10,'czk','b@example.test','B')");
$pdo->exec("INSERT INTO store_order_items(id,order_id,product_id,product_name,product_type,quantity,unit_price) VALUES(1,1,1,'A','physical',2,10),(2,2,1,'A','physical',1,10)");
$pdo->exec("INSERT INTO store_claims(id,public_id,order_id,owner_type,reason_code,problem_description,requested_resolution,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES(1,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',1,'guest','damaged','Broken','replacement',repeat('1',64),repeat('2',64),repeat('3',64))");
$pdo->exec("INSERT INTO store_claim_items(claim_id,order_id,order_item_id,requested_quantity) VALUES(1,1,1,1)");
$pdo->exec("INSERT INTO store_returns(id,public_id,order_id,owner_type,reason_code,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES(1,'cccccccccccccccccccccccccccccccc',1,'guest','unwanted',repeat('4',64),repeat('5',64),repeat('6',64))");
$pdo->exec("INSERT INTO store_return_items(return_id,order_id,order_item_id,requested_quantity) VALUES(1,1,1,1)");
$pdo->exec("INSERT INTO store_returns(id,public_id,order_id,owner_type,reason_code,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES(2,'ffffffffffffffffffffffffffffffff',2,'guest','unwanted',repeat('a',64),repeat('b',64),repeat('c',64));INSERT INTO store_return_items(return_id,order_id,order_item_id,requested_quantity)VALUES(2,2,2,1)");
$pdo->exec("INSERT INTO store_deliveries(id,public_id,order_id,carrier_code,tracking_number,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES(1,'dddddddddddddddddddddddddddddddd',1,'ppl','X',repeat('7',64),repeat('8',64),repeat('9',64))");
$pdo->exec("INSERT INTO store_delivery_items(delivery_id,order_id,order_item_id,shipped_quantity) VALUES(1,1,1,2)");

$actor = new ActorContext('legacy_shared_admin', null, str_repeat('a', 64), 'legacy_admin_session');
$audit = new AuditService($pdo);
$claim = new ClaimService($pdo, new ClaimRepository($pdo), new CaseQuantityAvailability($pdo), new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC'))), $audit, new ClaimStateMachine());
$return = new ReturnService($pdo, new ReturnRepository($pdo), new CaseQuantityAvailability($pdo), new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC'))), $audit, new ReturnStateMachine());
$delivery = new DeliveryService($pdo, new DeliveryRepository($pdo), new DeliveryStateMachine(), new TrackingUrlPolicy(['ppl' => 'https://www.ppl.cz']), $audit);

$claimFirst = $claim->transition('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', $actor, 1, 'under_review', [], 'claim-t1');
$claimReplay = $claim->transition('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', $actor, 1, 'under_review', [], 'claim-t1');
test_assert_same($claimFirst['version'], $claimReplay['version'], 'transition retry after commit returns original version');
try {
    $claim->transition('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', $actor, 1, 'under_review', ['public_message' => 'different'], 'claim-t1');
    test_assert_true(false, 'same transition idempotency key with different payload conflicts');
} catch (DomainException) {
}
$claim->transition('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', $actor, 2, 'under_review', ['public_message'=>'Průběžná zpráva','internal_note'=>'Interní kontext'], 'claim-noop-message');
test_assert_same('Průběžná zpráva', (string) $pdo->query("SELECT public_message FROM store_claim_events WHERE action='state_noop'")->fetchColumn(), 'same-state admin mutation records public message');
test_assert_same('Interní kontext', (string) $pdo->query("SELECT internal_note FROM store_claim_events WHERE action='state_noop'")->fetchColumn(), 'same-state admin mutation records internal note separately');
$claim->transition('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', $actor, 2, 'accepted', [], 'claim-t2');
$claim->transition('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', $actor, 3, 'resolved', ['resolution_outcome'=>'replacement','approved_items'=>[1=>1]], 'claim-t3');
test_assert_same(1, (int) $pdo->query('SELECT consumed_quantity FROM store_claim_items WHERE claim_id=1')->fetchColumn(), 'claim consumption is server-derived from approved quantities');
test_assert_same(4, (int) $pdo->query('SELECT version FROM store_claims WHERE id=1')->fetchColumn(), 'claim version increments atomically for every mutation');
try {
    $claim->transition('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', $actor, 1, 'accepted', [], 'claim-stale');
    test_assert_true(false, 'stale claim update must conflict');
} catch (DomainException) {
}

$return->transition('cccccccccccccccccccccccccccccccc', $actor, 1, 'approved', [], 'return-t1');
$return->transition('cccccccccccccccccccccccccccccccc', $actor, 2, 'waiting_for_goods', [], 'return-t2');
$return->transition('cccccccccccccccccccccccccccccccc', $actor, 3, 'received', ['received_at'=>'2026-07-30T10:00:00+00:00','received_items'=>[1=>1]], 'return-t3');
$return->transition('cccccccccccccccccccccccccccccccc', $actor, 4, 'inspected', ['inspected_at'=>'2026-07-30T11:00:00+00:00','inspected_items'=>[1=>1],'decision'=>'refund'], 'return-t4');
$return->transition('cccccccccccccccccccccccccccccccc', $actor, 5, 'refund_pending', [], 'return-t5');
try{$return->transition('cccccccccccccccccccccccccccccccc',$actor,6,'completed',['completed_at'=>'2026-07-30T12:00:00+00:00'],'return-t6');test_assert_true(false,'refund completion without trusted stored evidence fails closed');}catch(DomainException){}
test_assert_same(6, (int) $pdo->query('SELECT version FROM store_returns WHERE id=1')->fetchColumn(), 'return version increments and failed refund completion does not mutate');
test_assert_same(0, (int) $pdo->query('SELECT consumed_quantity FROM store_return_items WHERE return_id=1')->fetchColumn(), 'failed refund completion cannot consume quantity');

$return->transition('ffffffffffffffffffffffffffffffff',$actor,1,'approved',[],'return2-t1');
$return->transition('ffffffffffffffffffffffffffffffff',$actor,2,'waiting_for_goods',[],'return2-t2');
$return->transition('ffffffffffffffffffffffffffffffff',$actor,3,'received',['received_at'=>'2026-07-30T10:00:00+00:00','received_items'=>[2=>1]],'return2-t3');
$return->transition('ffffffffffffffffffffffffffffffff',$actor,4,'inspected',['inspected_at'=>'2026-07-30T11:00:00+00:00','inspected_items'=>[2=>1],'decision'=>'replacement'],'return2-t4');
$return->transition('ffffffffffffffffffffffffffffffff',$actor,5,'completed',['completed_at'=>'2026-07-30T12:00:00+00:00','decision'=>'replacement'],'return2-t5');
test_assert_same(1,(int)$pdo->query('SELECT consumed_quantity FROM store_return_items WHERE return_id=2')->fetchColumn(),'non-refund completed return consumes only inspected quantity');

$delivery->transition('dddddddddddddddddddddddddddddddd', $actor, 1, 'prepared', [], 'delivery-t1');
test_assert_same(2, (int) $pdo->query('SELECT version FROM store_deliveries WHERE id=1')->fetchColumn(), 'delivery version increments');

test_assert_same(14, (int) $pdo->query("SELECT COUNT(*) FROM store_audit_events WHERE action='state_transition'")->fetchColumn(), 'every transition writes technical audit');
test_complete('customer-agenda-transitions-postgres-test');
