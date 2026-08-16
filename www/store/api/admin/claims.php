<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';
$input = agenda_admin_input('claim');
try {
    $result = agenda_admin_mutation_service($pdo, $storeConfig)->transition('claim', (string) ($input['id'] ?? ''), $adminActor, (int) ($input['expected_version'] ?? 0), (string) ($input['target_status'] ?? ''), is_array($input['data'] ?? null) ? $input['data'] : [], (string) ($_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? ''));
    echo json_encode(['claim' => ['id' => $result['public_id'], 'status' => $result['status'], 'version' => $result['version']]], JSON_UNESCAPED_UNICODE);
} catch (DomainException) {
    store_emit_json_error(409, 'claim_transition_rejected', 'Změnu reklamace nelze provést.');
}
