<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../lib/customer-agenda.php';

agenda_prepare_http(['POST'],$storeConfig);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
store_require_csrf('admin_mutation');

try {
    agenda_rate_limit($pdo, 'admin_mutation', 30);
    $adminActor = AdminMutationGuard::actor($_SESSION);
} catch (StoreRateLimitExceeded $e) {
    header('Retry-After: ' . $e->retryAfter);
    store_emit_json_error(429, 'rate_limited', 'Příliš mnoho požadavků.');
} catch (DomainException) {
    store_emit_json_error(403, 'admin_required', 'Administrátorské ověření je vyžadováno.');
}

/** @return array<string,mixed> */
function agenda_admin_input(string $entity): array
{
    global $storeConfig;
    $input = agenda_json_input(16384);
    $target = (string) ($input['target_status'] ?? '');
    if (AdminMutationGuard::requiresRecentAuthentication($entity, $target)
        && !AdminMutationGuard::recent($_SESSION, time(), (int) ($storeConfig['admin_reauth_seconds'] ?? 300))) {
        store_emit_json_error(403, 'reauthentication_required', 'Tato citlivá akce vyžaduje nové přihlášení administrátora.');
    }
    return $input;
}
