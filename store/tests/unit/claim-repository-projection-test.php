<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/claims/ClaimRepository.php';
$sql = ClaimRepository::customerDetailSql();
test_assert_true(!str_contains(strtolower($sql), 'internal_note'), 'customer claim projection never selects internal note');
test_assert_true(str_contains($sql, 'public_message'), 'customer claim projection includes public messages');
test_complete('claim-repository-projection-test');
