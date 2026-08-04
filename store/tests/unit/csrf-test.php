<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/http.php';

$_SESSION = [];
$token = store_csrf_token('checkout');
test_assert_same(64, strlen($token), 'CSRF token must be cryptographically sized');
test_assert_true(store_verify_csrf_token('checkout', $token), 'issued CSRF token must validate');
test_assert_true(!store_verify_csrf_token('checkout', str_repeat('0', 64)), 'different CSRF token must fail');
test_assert_true(!store_verify_csrf_token('other', $token), 'CSRF token must be scope bound');

test_complete('csrf-test');
