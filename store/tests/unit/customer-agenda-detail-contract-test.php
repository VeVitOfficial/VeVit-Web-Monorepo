<?php
declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/claims/ClaimRepository.php';
require_once __DIR__ . '/../../lib/returns/ReturnRepository.php';

$claimRepository = (string) file_get_contents(__DIR__ . '/../../lib/claims/ClaimRepository.php');
$returnRepository = (string) file_get_contents(__DIR__ . '/../../lib/returns/ReturnRepository.php');
$attachmentEndpoint = (string) file_get_contents(__DIR__ . '/../../case-attachment.php');

test_assert_true(str_contains($claimRepository, 'function parentOrder'), 'claim repository exposes parent order lookup');
test_assert_true(str_contains($returnRepository, 'function parentOrder'), 'return repository exposes parent order lookup');
test_assert_true(str_contains($returnRepository, 'function customerDetail'), 'return repository has a customer projection');
test_assert_true(!str_contains(ClaimRepository::customerDetailSql(), 'internal_note'), 'claim customer projection excludes internal notes');
test_assert_true(!str_contains(ReturnRepository::customerDetailSql(), 'internal_note'), 'return customer projection excludes internal notes');
test_assert_true(str_contains(ClaimRepository::customerItemsSql(), 'requested_quantity'), 'claim customer projection includes claimed items');
test_assert_true(str_contains(ReturnRepository::customerItemsSql(), 'requested_quantity'), 'return customer projection includes returned items');
test_assert_true(!str_contains(ClaimRepository::customerItemsSql(), 'internal_note'), 'claim item projection excludes internal notes');
test_assert_true(!str_contains(ReturnRepository::customerItemsSql(), 'internal_note'), 'return item projection excludes internal notes');
test_assert_true(!str_contains($attachmentEndpoint, 'authorizedMetadata('), 'download controller does not query attachment metadata directly');

test_complete('customer-agenda-detail-contract-test');
