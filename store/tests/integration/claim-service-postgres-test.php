<?php
declare(strict_types=1);
require_once __DIR__.'/../testlib.php';
require_once __DIR__.'/../../lib/auth/ActorContext.php';
require_once __DIR__.'/../../lib/orders/OrderAccessService.php';
require_once __DIR__.'/../../lib/orders/CaseQuantityAvailability.php';
require_once __DIR__.'/../../lib/database/Transactional.php';
require_once __DIR__.'/../../lib/audit/AuditActor.php';
require_once __DIR__.'/../../lib/audit/AuditService.php';
require_once __DIR__.'/../../lib/claims/ClaimRepository.php';
require_once __DIR__.'/../../lib/claims/ClaimService.php';

$dsn=getenv('VEVIT_STORE_TEST_DSN');$user=getenv('VEVIT_STORE_TEST_DB_USER');$pass=getenv('VEVIT_STORE_TEST_DB_PASS');
if($dsn===false||$user===false||$pass===false){fwrite(STDOUT,"SKIP: claim-service-postgres-test requires PostgreSQL test environment\n");exit(77);}
if(!str_starts_with($dsn,'pgsql:')||!preg_match('/(?:dbname=|\/)[^;\/]*test/i',$dsn)){fwrite(STDERR,"REFUSE: test database required\n");exit(1);}
$pdo=new PDO($dsn,$user,$pass,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$pdo->exec('DROP TABLE IF EXISTS store_case_attachments,store_delivery_events,store_delivery_items,store_deliveries,store_return_events,store_return_items,store_returns,store_claim_events,store_claim_items,store_claims,store_product_favorites,store_audit_events CASCADE');
$pdo->exec((string)file_get_contents(__DIR__.'/task-0-4-base-schema.sql'));
foreach(['202607290001_checkout_snapshot_up.sql','202607290002_order_access_and_download_grants_up.sql','202607290003_payments_and_inventory_up.sql','202607300002_customer_agenda_up.sql'] as $m)$pdo->exec((string)file_get_contents(__DIR__.'/../../migrations/'.$m));
$pdo->exec("INSERT INTO store_products(id,name,slug,price,type,stock) VALUES(1,'A','a',10,'physical',5),(2,'B','b',20,'physical',5)");
$grant='guest-secret';$grantHash=hash('sha256',$grant);
$pdo->prepare("INSERT INTO store_orders(id,order_number,public_id,user_id,guest_grant_hash,guest_grant_expires_at,status,total,currency,customer_email,customer_name) VALUES(1,'O1',?,NULL,?,NOW()+INTERVAL '1 day','paid',30,'czk','g@example.test','Guest')")->execute([str_repeat('a',32),$grantHash]);
$pdo->exec("INSERT INTO store_order_items(id,order_id,product_id,product_name,product_type,quantity,unit_price) VALUES(1,1,1,'A','physical',1,10),(2,1,2,'B','physical',2,20)");
$service=new ClaimService($pdo,new ClaimRepository($pdo),new CaseQuantityAvailability($pdo),new OrderAccessService(new DateTimeImmutable('now',new DateTimeZone('UTC'))),new AuditService($pdo));
$actor=new ActorContext('customer_guest',null,null,'guest_order_grant');
$input=['reason_code'=>'damaged','problem_description'=>'Broken','requested_resolution'=>'replacement','items'=>[['order_item_id'=>1,'quantity'=>1],['order_item_id'=>2,'quantity'=>2]]];
$pdo->exec("UPDATE store_orders SET status='pending' WHERE id=1");
try{$service->create(str_repeat('a',32),$actor,$grant,'idem-unpaid',$input);test_assert_true(false,'unpaid order cannot be claimed');}catch(DomainException){}
$pdo->exec("UPDATE store_orders SET status='paid' WHERE id=1");
$first=$service->create(str_repeat('a',32),$actor,$grant,'idem-1',$input);
$replay=$service->create(str_repeat('a',32),$actor,$grant,'idem-1',$input);
test_assert_same($first['public_id'],$replay['public_id'],'idempotent replay returns original claim');
try{$service->create(str_repeat('a',32),$actor,$grant,'idem-1',array_merge($input,['problem_description'=>'Different']));test_assert_true(false,'same create key with different payload conflicts');}catch(DomainException){}
test_assert_same(2,(int)$pdo->query('SELECT COUNT(*) FROM store_claim_items')->fetchColumn(),'multi-item claim commits all items');
test_assert_same(1,(int)$pdo->query('SELECT COUNT(*) FROM store_claim_events')->fetchColumn(),'claim create writes domain event');
test_assert_same(1,(int)$pdo->query('SELECT COUNT(*) FROM store_audit_events')->fetchColumn(),'claim create writes technical audit');
$message=$service->addCustomerMessage((string)$first['public_id'],$actor,$grant,'Doplňující informace','message-1');$messageReplay=$service->addCustomerMessage((string)$first['public_id'],$actor,$grant,'Doplňující informace','message-1');test_assert_same($message['public_id'],$messageReplay['public_id'],'customer message replay is idempotent');
$admin=new ActorContext('legacy_shared_admin',null,str_repeat('a',64),'legacy_admin_session');$service->transition((string)$first['public_id'],$admin,1,'under_review',[],'partial-t1');$service->transition((string)$first['public_id'],$admin,2,'accepted',[],'partial-t2');$service->transition((string)$first['public_id'],$admin,3,'resolved',['resolution_outcome'=>'replacement','approved_items'=>[1=>1]],'partial-t3');
test_assert_same(1,(int)$pdo->query('SELECT consumed_quantity FROM store_claim_items WHERE claim_id=1 AND order_item_id=1')->fetchColumn(),'partial claim consumes approved quantity');
test_assert_same(0,(int)$pdo->query('SELECT consumed_quantity FROM store_claim_items WHERE claim_id=1 AND order_item_id=2')->fetchColumn(),'partial claim releases unapproved quantity without consuming it');
$released=$service->create(str_repeat('a',32),$actor,$grant,'released-remainder',['reason_code'=>'damaged','problem_description'=>'Still affected','requested_resolution'=>'repair','items'=>[['order_item_id'=>2,'quantity'=>2]]]);test_assert_true(isset($released['public_id']),'unapproved remainder is eligible for a later claim');
try{$service->create(str_repeat('a',32),$actor,$grant,'idem-2',['reason_code'=>'x','problem_description'=>'x','requested_resolution'=>'repair','items'=>[['order_item_id'=>1,'quantity'=>1]]]);test_assert_true(false,'reserved item cannot be claimed twice');}catch(DomainException){}
try{$service->create(str_repeat('a',32),$actor,'wrong-grant','idem-3',$input);test_assert_true(false,'invalid guest grant fails closed');}catch(DomainException){}
try{$service->create(str_repeat('a',32),$actor,$grant,'idem-4',['reason_code'=>'x','problem_description'=>'x','requested_resolution'=>'repair','items'=>[['order_item_id'=>999,'quantity'=>1]]]);test_assert_true(false,'nonexistent order item fails closed');}catch(DomainException){}
$pdo->prepare("INSERT INTO store_orders(id,order_number,public_id,guest_grant_hash,guest_grant_expires_at,status,total,currency,customer_email,customer_name)VALUES(2,'O2',?,?,NOW()+INTERVAL '1 day','paid',10,'czk','g2@example.test','Guest 2')")->execute([str_repeat('d',32),$grantHash]);$pdo->exec("INSERT INTO store_order_items(id,order_id,product_id,product_name,product_type,quantity,unit_price)VALUES(3,2,1,'A','physical',1,10)");
$pdo->exec("CREATE OR REPLACE FUNCTION reject_claim_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test audit failure'; END $$;CREATE TRIGGER reject_claim_audit BEFORE INSERT ON store_audit_events FOR EACH ROW EXECUTE FUNCTION reject_claim_audit()");
try{$service->create(str_repeat('d',32),$actor,$grant,'audit-failure',['reason_code'=>'damaged','problem_description'=>'Broken','requested_resolution'=>'repair','items'=>[['order_item_id'=>3,'quantity'=>1]]]);test_assert_true(false,'audit failure must roll back entire claim');}catch(PDOException){}
$pdo->exec('DROP TRIGGER reject_claim_audit ON store_audit_events;DROP FUNCTION reject_claim_audit()');
test_assert_same(0,(int)$pdo->query("SELECT COUNT(*) FROM store_claims WHERE order_id=2")->fetchColumn(),'audit failure rolls back claim row, items and domain event');
test_complete('claim-service-postgres-test');
