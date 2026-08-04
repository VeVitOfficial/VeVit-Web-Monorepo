<?php
declare(strict_types=1);
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../lib/customer-agenda.php';
agenda_prepare_http(['GET'],$storeConfig);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
try {
    $orderPublic = (string) ($_GET['order'] ?? '');
    $orders = new CustomerOrderService($pdo, new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC'))));
    $order = $orders->rawOrderForAuthorizedDelivery($orderPublic);
    if (!$order) throw new DomainException('Delivery unavailable.');
    $identity = agenda_actor_for_order($orderPublic, $storeConfig);
    $service = new DeliveryService($pdo, new DeliveryRepository($pdo), new DeliveryStateMachine(), new TrackingUrlPolicy($storeConfig['tracking_carriers'] ?? []), new AuditService($pdo));
    echo json_encode(['deliveries' => $service->customerDetail($orderPublic, $order, $identity['actor'], $identity['grant'], new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC'))))], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable) {
    store_emit_json_error(404, 'delivery_unavailable', 'Doručení není k dispozici.');
}
