<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/auth/ActorContext.php';
require_once __DIR__ . '/../../lib/admin/LegacyAdminActor.php';

$sessionA = [];
$sessionB = [];
LegacyAdminActor::establish($sessionA, 1000);
LegacyAdminActor::establish($sessionB, 1000);
$actorA = LegacyAdminActor::fromSession($sessionA);
$actorB = LegacyAdminActor::fromSession($sessionB);

test_assert_same('legacy_shared_admin', $actorA->type(), 'legacy admin actor type is explicit');
test_assert_same(null, $actorA->userId(), 'legacy admin actor has no fabricated user id');
test_assert_true($actorA->sessionIdHash() !== null && strlen($actorA->sessionIdHash()) === 64, 'legacy admin stores a session hash');
test_assert_true($actorA->sessionIdHash() !== $actorB->sessionIdHash(), 'admin sessions have distinct audit ids');
test_assert_same(false, LegacyAdminActor::isRecentlyAuthenticated($sessionA, 1301, 300), 'recent authentication expires');
LegacyAdminActor::destroy($sessionA);
try {
    LegacyAdminActor::fromSession($sessionA);
    test_assert_true(false, 'logout invalidates the audit actor session');
} catch (RuntimeException) {
}

test_complete('legacy-admin-actor-test');
