<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/auth/AuthContext.php';
require_once __DIR__ . '/../../lib/favorites/FavoriteRepository.php';
require_once __DIR__ . '/../../lib/favorites/FavoriteService.php';

$dsn=getenv('VEVIT_STORE_TEST_DSN');$user=getenv('VEVIT_STORE_TEST_DB_USER');$pass=getenv('VEVIT_STORE_TEST_DB_PASS');
if($dsn===false||$user===false||$pass===false)exit(77);if(!preg_match('/test/i',$dsn))exit(1);
$pdo=new PDO($dsn,$user,$pass,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$pdo->exec('DROP TABLE IF EXISTS store_case_attachments,store_delivery_events,store_delivery_items,store_deliveries,store_return_events,store_return_items,store_returns,store_claim_events,store_claim_items,store_claims,store_product_favorites,store_audit_events CASCADE');
$pdo->exec((string)file_get_contents(__DIR__.'/task-0-4-base-schema.sql'));foreach(['202607290001_checkout_snapshot_up.sql','202607290002_order_access_and_download_grants_up.sql','202607290003_payments_and_inventory_up.sql','202607300002_customer_agenda_up.sql']as$m)$pdo->exec((string)file_get_contents(__DIR__.'/../../migrations/'.$m));
$pdo->exec("INSERT INTO store_products(id,name,slug,price,type,stock,is_active)VALUES(1,'A','a',10,'physical',1,TRUE),(2,'B','b',10,'physical',1,FALSE)");
$auth=new class implements AuthContext{public function isAuthenticated():bool{return true;}public function userId():?string{return'account-1';}public function verifiedEmail():?string{return'a@example.test';}public function hasRole(string$role):bool{return false;}public function source():string{return'mock_verified';}public function verifiedAt():?DateTimeImmutable{return new DateTimeImmutable();}};
$service=new FavoriteService($pdo);$service->add($auth,1);$service->add($auth,1);
test_assert_same(1,(int)$pdo->query('SELECT count(*) FROM store_product_favorites')->fetchColumn(),'favorite add is idempotent');
test_assert_same(1,count($service->list($auth)),'active favorite is listed');
try{$service->add($auth,2);test_assert_true(false,'inactive product cannot be added');}catch(DomainException){}
$service->remove($auth,1);test_assert_same(0,count($service->list($auth)),'favorite removal works');
test_complete('favorite-service-postgres-test');
