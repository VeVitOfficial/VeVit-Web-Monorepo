<?php

declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../lib/orders/OrderAccessService.php';

store_require_method(['POST']);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
store_require_csrf('download');
if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') store_emit_json_error(415, 'content_type_invalid', 'Požadavek musí používat JSON.');
$body = file_get_contents('php://input', false, null, 0, 4097);
if ($body === false || strlen($body) > 4096) store_emit_json_error(413, 'request_too_large', 'Požadavek je příliš velký.');
try { $input = json_decode($body, true, 16, JSON_THROW_ON_ERROR); } catch (JsonException) { store_emit_json_error(400, 'json_invalid', 'Požadavek není platný.'); }
if (!is_array($input)) store_emit_json_error(400, 'json_invalid', 'Požadavek není platný.');
$publicId = $input['order'] ?? '';
$itemId = $input['item_id'] ?? null;
if (!is_string($publicId) || !preg_match('/^[a-f0-9]{32}$/', $publicId) || !is_int($itemId) || $itemId < 1) store_emit_json_error(404, 'download_unavailable', 'Stažení není k dispozici.');

try {
    $orderStatement = $pdo->prepare('SELECT * FROM store_orders WHERE public_id = ? LIMIT 1');
    $orderStatement->execute([$publicId]);
    $order = $orderStatement->fetch();
    $user = getCurrentUser();
    $access = new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC')));
    if (!$order || !$access->canAccess($order, $user, OrderAccessService::sessionGrant($publicId), !empty($_SESSION['admin']), $publicId)) throw new RuntimeException('unauthorized');
    $itemStatement = $pdo->prepare(
        "SELECT oi.id, oi.product_type, oi.cancelled_at, o.status, o.payment_status,
                e.id AS entitlement_id, e.revoked_at AS entitlement_revoked_at
         FROM store_order_items oi
         JOIN store_orders o ON o.id = oi.order_id
         JOIN store_download_entitlements e ON e.order_item_id = oi.id AND e.order_id = o.id
         WHERE oi.id = ? AND oi.order_id = ?"
    );
    $itemStatement->execute([$itemId, $order['id']]);
    $item = $itemStatement->fetch();
    if (!$item || $item['product_type'] !== 'digital' || $item['cancelled_at'] !== null
        || $item['entitlement_revoked_at'] !== null || $item['payment_status'] !== 'paid'
        || !in_array($item['status'], ['paid','processing','shipped','delivered'], true)) {
        throw new RuntimeException('unavailable');
    }
    $rawToken = bin2hex(random_bytes(32));
    $grant = $pdo->prepare("INSERT INTO store_download_grants (order_id, order_item_id, user_id, token_hash, expires_at, max_downloads, allow_inactive_access, audit_metadata) VALUES (?, ?, ?, ?, NOW() + INTERVAL '5 minutes', 1, TRUE, ?::jsonb)");
    $grant->execute([$order['id'], $itemId, $user['id'] ?? null, hash('sha256', $rawToken), json_encode([
        'issued_via' => 'authorized_request',
        'entitlement_id' => (int) $item['entitlement_id'],
        'allow_inactive_access' => true,
    ], JSON_THROW_ON_ERROR)]);
    echo json_encode(['download' => ['token' => $rawToken]], JSON_UNESCAPED_SLASHES);
} catch (Throwable $exception) {
    store_log_security_event('download_grant_rejected', ['reason' => $exception::class]);
    store_emit_json_error(404, 'download_unavailable', 'Stažení není k dispozici.');
}
