<?php
declare(strict_types=1);
require_once __DIR__.'/../testlib.php';require_once __DIR__.'/../../lib/attachments/LocalPrivateStorage.php';
$root=sys_get_temp_dir().'/vevit-attachment-test-'.bin2hex(random_bytes(4));mkdir($root,0700,true);$tmp=tempnam(sys_get_temp_dir(),'vv');file_put_contents($tmp,"\xFF\xD8\xFF\xE0".str_repeat('A',32));
$storage=new LocalPrivateStorage($root,['image/jpeg'],1024,null);
try{$storage->store($tmp,'photo.php.jpg');test_assert_true(false,'dangerous executable double extension must be rejected');}catch(DomainException){}
$stored=$storage->store($tmp,'photo.jpg');test_assert_same('image/jpeg',$stored['mime'],'MIME comes from finfo');test_assert_true(!str_contains($stored['key'],'photo'),'storage key excludes original name');test_assert_true(is_file($storage->resolve($stored['key'])),'stored file resolves inside root');
$pdf=tempnam(sys_get_temp_dir(),'vv');file_put_contents($pdf,"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");$pdfStorage=new LocalPrivateStorage($root,['application/pdf'],1024,null);$storedPdf=$pdfStorage->store($pdf,'evidence.pdf');test_assert_same('application/pdf',$storedPdf['mime'],'valid PDF is accepted from detected MIME');
try{$storage->resolve('../secret');test_assert_true(false,'traversal must fail');}catch(DomainException){}
$php=tempnam(sys_get_temp_dir(),'vv');file_put_contents($php,"<?php echo 'owned';");
try{$storage->store($php,'photo.jpg');test_assert_true(false,'renamed PHP must be rejected by detected MIME');}catch(DomainException){}
$large=tempnam(sys_get_temp_dir(),'vv');file_put_contents($large,"\xFF\xD8\xFF\xE0".str_repeat('A',2048));
try{$storage->store($large,'large.jpg');test_assert_true(false,'oversized file must be rejected');}catch(DomainException){}
$publicRoot=sys_get_temp_dir().'/vevit-public-storage-'.bin2hex(random_bytes(4));mkdir($publicRoot,0755,true);
try{new LocalPrivateStorage($publicRoot,['image/jpeg'],1024,null);test_assert_true(false,'group/world accessible storage root is rejected');}catch(RuntimeException){}
test_complete('local-private-storage-test');
