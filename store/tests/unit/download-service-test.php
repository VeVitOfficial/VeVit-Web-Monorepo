<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

test_assert_true(is_file(__DIR__ . '/../../lib/downloads/DownloadService.php'), 'download service must exist');
require_once __DIR__ . '/../../lib/downloads/DownloadService.php';

$storage = sys_get_temp_dir() . '/vevit-download-unit-storage';
if (!is_dir($storage . '/downloads')) mkdir($storage . '/downloads', 0700, true);
file_put_contents($storage . '/downloads/paid-file.txt', 'paid content');

$service = new DownloadService(new DateTimeImmutable('2026-07-29T12:00:00+00:00'), $storage);
$grant = [
    'token_hash' => hash('sha256', 'download-token'), 'expires_at' => '2026-07-30T12:00:00+00:00', 'revoked_at' => null,
    'download_count' => 0, 'max_downloads' => 1, 'product_type' => 'digital', 'order_status' => 'paid',
    'download_file' => 'downloads/paid-file.txt', 'item_cancelled_at' => null, 'product_is_active' => true, 'allow_inactive_access' => true,
];
$authorized = $service->validateGrant($grant, 'download-token');
test_assert_same('paid-file.txt', $authorized['filename'], 'paid digital grant must resolve a safe file');
$inactivePurchased = $service->validateGrant(array_replace($grant, ['product_is_active' => false, 'allow_inactive_access' => true]), 'download-token');
test_assert_same('paid-file.txt', $inactivePurchased['filename'], 'explicit preserved grant may download an inactive purchased product');

$cases = [
    'unpaid' => ['order_status' => 'pending'],
    'physical' => ['product_type' => 'physical'],
    'revoked' => ['revoked_at' => '2026-07-28T00:00:00+00:00'],
    'expired' => ['expires_at' => '2026-07-28T00:00:00+00:00'],
    'limit' => ['download_count' => 1],
    'traversal' => ['download_file' => '../secret.txt'],
    'outside-url' => ['download_file' => 'https://example.test/file'],
    'missing' => ['download_file' => 'downloads/missing.txt'],
    'inactive-without-preservation' => ['product_is_active' => false, 'allow_inactive_access' => false],
];
foreach ($cases as $label => $change) {
    try {
        $service->validateGrant(array_replace($grant, $change), 'download-token');
        test_assert_true(false, $label . ' grant must be rejected');
    } catch (DownloadAccessException $exception) {
        test_assert_same('download_unavailable', $exception->errorCode, $label . ' must use generic public error');
    }
}
try {
    $service->validateGrant($grant, 'wrong-token');
    test_assert_true(false, 'wrong token must be rejected');
} catch (DownloadAccessException $exception) {
    test_assert_same('download_unavailable', $exception->errorCode, 'wrong token must use generic error');
}

test_complete('download-service-test');
