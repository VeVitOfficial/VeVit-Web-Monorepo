<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

test_assert_true(is_file(__DIR__ . '/../../lib/orders/OrderAccessService.php'), 'order access service must exist');
require_once __DIR__ . '/../../lib/orders/OrderAccessService.php';

$order = ['public_id' => 'aabbccddeeff00112233445566778899', 'user_id' => 'owner-1', 'guest_grant_hash' => hash('sha256', 'guest-grant'), 'guest_grant_expires_at' => '2026-08-01T00:00:00+00:00'];
$service = new OrderAccessService(new DateTimeImmutable('2026-07-29T12:00:00+00:00'));

test_assert_true($service->canAccess($order, ['id' => 'owner-1'], null, false), 'authenticated owner must access order');
test_assert_true(!$service->canAccess($order, ['id' => 'other-user'], null, false), 'other authenticated user must not access order');
test_assert_true($service->canAccess($order, null, 'guest-grant', false), 'valid guest grant must access its order');
test_assert_true(!$service->canAccess($order, null, 'wrong-grant', false), 'invalid guest grant must not access order');
test_assert_true(!$service->canAccess($order, null, null, false), 'missing guest grant must not access order');
test_assert_true($service->canAccess($order, ['id' => 'other-user'], null, true), 'admin must access order');
test_assert_true(!$service->canAccess($order, ['id' => 'owner-1'], null, false, '00000000000000000000000000000000'), 'public id mismatch must not access order');

$expired = $order;
$expired['guest_grant_expires_at'] = '2026-07-28T00:00:00+00:00';
test_assert_true(!$service->canAccess($expired, null, 'guest-grant', false), 'expired guest grant must not access order');

test_complete('order-access-test');
