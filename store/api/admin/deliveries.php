<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';
$input = agenda_admin_input('delivery');
try {
    $result = agenda_admin_mutation_service($pdo, $storeConfig)->transition('delivery', (string) ($input['id'] ?? ''), $adminActor, (int) ($input['expected_version'] ?? 0), (string) ($input['target_status'] ?? ''), is_array($input['data'] ?? null) ? $input['data'] : [], (string) ($_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? ''));
    echo json_encode(['delivery' => ['id' => $result['public_id'], 'status' => $result['status'], 'version' => $result['version']]], JSON_UNESCAPED_UNICODE);
} catch (DomainException) {
    store_emit_json_error(409, 'delivery_transition_rejected', 'Změnu doručení nelze provést.');
}
