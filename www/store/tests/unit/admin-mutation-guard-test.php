<?php
declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/auth/ActorContext.php';
require_once __DIR__ . '/../../lib/admin/LegacyAdminActor.php';
require_once __DIR__ . '/../../lib/admin/AdminMutationGuard.php';

$session = [];
try {
    AdminMutationGuard::actor($session);
    test_assert_true(false, 'missing admin session fails closed');
} catch (DomainException) {
}

$session['admin'] = true;
LegacyAdminActor::establish($session, 1000);
$actor = AdminMutationGuard::actor($session);
test_assert_same('legacy_shared_admin', $actor->type(), 'legacy actor is explicit');
test_assert_true(AdminMutationGuard::recent($session, 1100, 300), 'recent authentication accepted');
test_assert_true(!AdminMutationGuard::recent($session, 1400, 300), 'expired authentication rejected');
test_assert_true(AdminMutationGuard::requiresRecentAuthentication('claim', 'rejected'), 'claim rejection is sensitive');
test_assert_true(AdminMutationGuard::requiresRecentAuthentication('delivery', 'delivered'), 'manual delivered override is sensitive');
test_assert_true(AdminMutationGuard::requiresRecentAuthentication('return', 'completed'), 'return completion is sensitive');

test_complete('admin-mutation-guard-test');
