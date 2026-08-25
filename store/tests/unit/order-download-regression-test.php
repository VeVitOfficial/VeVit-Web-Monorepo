<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

$success = file_get_contents(__DIR__ . '/../../success.php');
$download = file_get_contents(__DIR__ . '/../../download.php');
test_assert_true(!str_contains($success, 'download_token'), 'success page must not expose raw download tokens');
test_assert_true(!str_contains($success, 'WHERE o.order_number'), 'success page must not authorize by order number');
test_assert_true(!str_contains($success, 'download.php?token='), 'success page must not expose token URLs');
test_assert_true(str_contains($success, 'Cache-Control: no-store, private'), 'success page must disable shared caching');
test_assert_true(str_contains($download, "store_require_method(['POST'])"), 'download endpoint must require POST');
test_assert_true(!str_contains($download, '__DIR__ . \'/\' . $item'), 'download endpoint must not resolve files from web root');
test_assert_true(str_contains($download, 'FOR UPDATE'), 'download grant must be locked before consumption');
test_assert_true(str_contains($download, 'download_count < max_downloads'), 'download count must be atomically bounded');
test_assert_true(str_contains($download, 'canAccess($grant'), 'download endpoint must bind grant to current authorization');

test_complete('order-download-regression-test');
