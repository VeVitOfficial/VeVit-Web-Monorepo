<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../lib/customer-agenda.php';
agenda_prepare_http(['GET'],$storeConfig);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
try {
    $id = (string) ($_GET['id'] ?? '');
    $service = new ClaimService($pdo, new ClaimRepository($pdo), new CaseQuantityAvailability($pdo), new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC'))), new AuditService($pdo));
    $identity = agenda_actor_for_order($service->guestOrderPublicId($id), $storeConfig);
    echo json_encode(['claim' => $service->detailPayload($id, $identity['actor'], $identity['grant'])], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable) {
    store_emit_json_error(404, 'claim_unavailable', 'Reklamace není k dispozici.');
}
