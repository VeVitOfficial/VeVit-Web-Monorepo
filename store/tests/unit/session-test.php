<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

test_assert_true(is_file(__DIR__ . '/../../lib/session.php'), 'session library must exist');
require_once __DIR__ . '/../../lib/session.php';

$settings = store_session_cookie_settings([
    'name' => 'vevit_store_session',
    'path' => '/',
    'secure' => true,
    'same_site' => 'Lax',
]);

test_assert_same('vevit_store_session', $settings['name'], 'session name must be retained');
test_assert_same(true, $settings['cookie']['secure'], 'secure cookie setting must be retained');
test_assert_same(true, $settings['cookie']['httponly'], 'session cookies must always be HttpOnly');
test_assert_same('Lax', $settings['cookie']['samesite'], 'session cookies must use configured SameSite');

try {
    store_session_cookie_settings([
        'name' => 'bad session name',
        'path' => '/',
        'secure' => true,
        'same_site' => 'Lax',
    ]);
    test_assert_true(false, 'invalid session name must be rejected');
} catch (InvalidArgumentException) {
}

test_complete('session-test');
