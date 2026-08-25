<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/auth/ActorContext.php';
require_once __DIR__ . '/../../lib/audit/AuditActor.php';

$actor = AuditActor::fromContext(new ActorContext('legacy_shared_admin', null, str_repeat('a', 64), 'legacy_admin_session'));
test_assert_same('legacy_shared_admin', $actor->type, 'audit actor preserves type');
test_assert_same(null, $actor->userId, 'audit actor does not invent user id');
test_assert_same(str_repeat('a', 64), $actor->sessionId, 'audit actor preserves opaque session hash');
test_assert_same('legacy_admin_session', $actor->authSource, 'audit actor preserves verified source');
try {
    new ActorContext('customer_account', null, null, 'mock');
    test_assert_true(false, 'account actor requires stable user id');
} catch (InvalidArgumentException) {
}
try {
    new ActorContext('customer_guest', 'client-user', null, 'guest_order_grant');
    test_assert_true(false, 'guest actor cannot carry a client user id');
} catch (InvalidArgumentException) {
}

test_complete('audit-actor-test');
