<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/database/MigrationRunner.php';
$dsn=getenv('VEVIT_STORE_TEST_DSN');$user=getenv('VEVIT_STORE_TEST_DB_USER');$pass=getenv('VEVIT_STORE_TEST_DB_PASS');
if($dsn===false||$user===false||$pass===false)exit(77);if(!preg_match('/test/i',$dsn))exit(1);
$pdo=new PDO($dsn,$user,$pass,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$pdo->exec('DROP TABLE IF EXISTS store_schema_migrations,store_case_attachments,store_delivery_events,store_delivery_items,store_deliveries,store_return_events,store_return_items,store_returns,store_claim_events,store_claim_items,store_claims,store_product_favorites,store_audit_events CASCADE');
$pdo->exec((string)file_get_contents(__DIR__.'/task-0-4-base-schema.sql'));foreach(['202607290001_checkout_snapshot_up.sql','202607290002_order_access_and_download_grants_up.sql','202607290003_payments_and_inventory_up.sql']as$m)$pdo->exec((string)file_get_contents(__DIR__.'/../../migrations/'.$m));
$sql=(string)file_get_contents(__DIR__.'/../../migrations/202607300002_customer_agenda_up.sql');$runner=new MigrationRunner($pdo);
test_assert_same('applied',$runner->apply('202607300002_customer_agenda_up.sql',$sql),'actual agenda migration is applied once');
test_assert_same('skipped',$runner->apply('202607300002_customer_agenda_up.sql',$sql),'runner skips exact second run');
try{$runner->apply('202607300002_customer_agenda_up.sql',$sql."\n-- changed");test_assert_true(false,'changed applied migration checksum fails');}catch(RuntimeException){}
test_complete('customer-agenda-migration-runner-postgres-test');
