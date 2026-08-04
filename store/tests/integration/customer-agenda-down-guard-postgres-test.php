<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
$dsn=getenv('VEVIT_STORE_TEST_DSN');$user=getenv('VEVIT_STORE_TEST_DB_USER');$pass=getenv('VEVIT_STORE_TEST_DB_PASS');
if($dsn===false||$user===false||$pass===false)exit(77);if(!preg_match('/test/i',$dsn))exit(1);
$pdo=new PDO($dsn,$user,$pass,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$pdo->exec('DROP TABLE IF EXISTS store_schema_migrations,store_case_attachments,store_delivery_events,store_delivery_items,store_deliveries,store_return_events,store_return_items,store_returns,store_claim_events,store_claim_items,store_claims,store_product_favorites,store_audit_events CASCADE');
$pdo->exec((string)file_get_contents(__DIR__.'/task-0-4-base-schema.sql'));foreach(['202607290001_checkout_snapshot_up.sql','202607290002_order_access_and_download_grants_up.sql','202607290003_payments_and_inventory_up.sql','202607300002_customer_agenda_up.sql']as$m)$pdo->exec((string)file_get_contents(__DIR__.'/../../migrations/'.$m));
$pdo->exec("INSERT INTO store_audit_events(public_id,entity_type,entity_id,action,outcome,actor_type,auth_source,correlation_id)VALUES(repeat('a',32),'test',1,'test','success','system','test',repeat('b',32))");
try{$pdo->exec((string)file_get_contents(__DIR__.'/../../migrations/202607300002_customer_agenda_down.sql'));test_assert_true(false,'guarded down must refuse customer or audit data');}catch(PDOException){$pdo->exec('ROLLBACK');}
test_assert_true($pdo->query("SELECT to_regclass('public.store_audit_events')")->fetchColumn()!==null,'failed down leaves schema intact');
test_complete('customer-agenda-down-guard-postgres-test');
