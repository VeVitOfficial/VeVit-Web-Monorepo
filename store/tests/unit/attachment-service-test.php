<?php
declare(strict_types=1);
require_once __DIR__.'/../testlib.php';require_once __DIR__.'/../../lib/attachments/AttachmentService.php';
$a=AttachmentService::requestHash('claim',str_repeat('a',32),'photo.jpg','image/jpeg',12,str_repeat('b',64));$b=AttachmentService::requestHash('claim',str_repeat('a',32),'photo.jpg','image/jpeg',12,str_repeat('b',64));test_assert_same($a,$b,'attachment request hash is stable');test_assert_true(strlen($a)===64,'attachment request hash is sha256 hex');test_complete('attachment-service-test');
