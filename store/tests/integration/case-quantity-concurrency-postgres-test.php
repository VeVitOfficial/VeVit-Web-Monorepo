<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
foreach ([
    'auth/ActorContext','orders/OrderAccessService','orders/CaseQuantityAvailability','database/Transactional',
    'audit/AuditActor','audit/AuditService','claims/ClaimRepository','claims/ClaimService',
    'returns/ReturnRepository','returns/ReturnService',
] as $file) require_once __DIR__ . '/../../lib/' . $file . '.php';

$dsn=getenv('VEVIT_STORE_TEST_DSN');$user=getenv('VEVIT_STORE_TEST_DB_USER');$pass=getenv('VEVIT_STORE_TEST_DB_PASS');
if($dsn===false||$user===false||$pass===false)exit(77);if(!preg_match('/test/i',$dsn))exit(1);
$connect=static fn()=>new PDO($dsn,$user,$pass,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$pdo=$connect();
$pdo->exec('DROP TABLE IF EXISTS store_case_attachments,store_delivery_events,store_delivery_items,store_deliveries,store_return_events,store_return_items,store_returns,store_claim_events,store_claim_items,store_claims,store_product_favorites,store_audit_events CASCADE');
$pdo->exec((string)file_get_contents(__DIR__.'/task-0-4-base-schema.sql'));
foreach(['202607290001_checkout_snapshot_up.sql','202607290002_order_access_and_download_grants_up.sql','202607290003_payments_and_inventory_up.sql','202607300002_customer_agenda_up.sql']as$m)$pdo->exec((string)file_get_contents(__DIR__.'/../../migrations/'.$m));
$grant='one-unit';$pdo->exec("INSERT INTO store_products(id,name,slug,price,type,stock)VALUES(1,'A','a',10,'physical',2)");
$s=$pdo->prepare("INSERT INTO store_orders(id,order_number,public_id,guest_grant_hash,guest_grant_expires_at,status,total,currency,customer_email,customer_name)VALUES(1,'O1',?,?,NOW()+INTERVAL '1 day','delivered',10,'czk','g@example.test','G')");$s->execute([str_repeat('a',32),hash('sha256',$grant)]);
$pdo->exec("INSERT INTO store_order_items(id,order_id,product_id,product_name,product_type,quantity,unit_price)VALUES(1,1,1,'A','physical',1,10)");

$resultDir=sys_get_temp_dir().'/vevit-quantity-'.bin2hex(random_bytes(8));mkdir($resultDir,0700);
$children=[];
foreach(['claim','return']as$type){
 $pid=pcntl_fork();if($pid===0){$db=$connect();$access=new OrderAccessService(new DateTimeImmutable('now',new DateTimeZone('UTC')));$availability=new CaseQuantityAvailability($db);$audit=new AuditService($db);$actor=new ActorContext('customer_guest',null,null,'guest_order_grant');try{if($type==='claim'){$service=new ClaimService($db,new ClaimRepository($db),$availability,$access,$audit);$service->create(str_repeat('a',32),$actor,$grant,'concurrent-claim',['reason_code'=>'damaged','problem_description'=>'x','requested_resolution'=>'repair','items'=>[['order_item_id'=>1,'quantity'=>1]]]);}else{$service=new ReturnService($db,new ReturnRepository($db),$availability,$access,$audit);$service->create(str_repeat('a',32),$actor,$grant,'concurrent-return',['reason_code'=>'unwanted','items'=>[['order_item_id'=>1,'quantity'=>1]]]);}file_put_contents($resultDir.'/'.$type,'ok');}catch(DomainException){file_put_contents($resultDir.'/'.$type,'rejected');}exit(0);}if($pid<0)throw new RuntimeException('fork failed');$children[]=$pid;
}
foreach($children as$pid)pcntl_waitpid($pid,$status);
$results=[trim((string)file_get_contents($resultDir.'/claim')),trim((string)file_get_contents($resultDir.'/return'))];
test_assert_same(1,count(array_filter($results,static fn($x)=>$x==='ok')),'only one concurrent claim/return reserves the last unit');
test_assert_same(1,count(array_filter($results,static fn($x)=>$x==='rejected')),'the colliding operation is rejected');
unlink($resultDir.'/claim');unlink($resultDir.'/return');rmdir($resultDir);
test_complete('case-quantity-concurrency-postgres-test');
