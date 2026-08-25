<?php
declare(strict_types=1);
require_once __DIR__.'/../testlib.php';require_once __DIR__.'/../../lib/attachments/AttachmentRepository.php';
$sql=AttachmentRepository::customerListSql('claim');test_assert_true(!str_contains($sql,'storage_key'),'customer attachment query excludes storage key');test_assert_true(!str_contains($sql,'audit_metadata'),'customer attachment query excludes audit metadata');test_complete('attachment-repository-projection-test');
