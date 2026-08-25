<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/downloads/DownloadService.php';
require_once __DIR__ . '/lib/orders/OrderAccessService.php';

store_require_method(['POST']);
header('Cache-Control: private, no-store');
header('Pragma: no-cache');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
store_require_csrf('download');

function download_fail(): never { http_response_code(404); exit('Stažení není k dispozici.'); }
$token = $_POST['token'] ?? '';
if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) download_fail();
try {
    $pdo->beginTransaction();
    $statement = $pdo->prepare(
        "SELECT g.*, o.public_id, o.user_id, o.guest_grant_hash, o.guest_grant_expires_at,
                o.status AS order_status, o.payment_status, oi.product_type,
                oi.cancelled_at AS item_cancelled_at, oi.digital_content_path AS download_file,
                p.is_active AS product_is_active, e.revoked_at AS entitlement_revoked_at
         FROM store_download_grants g
         JOIN store_orders o ON o.id = g.order_id
         JOIN store_order_items oi ON oi.id = g.order_item_id
         JOIN store_products p ON p.id = oi.product_id
         JOIN store_download_entitlements e ON e.order_item_id = oi.id AND e.order_id = o.id
         WHERE g.token_hash = ?
         FOR UPDATE OF g, e"
    );
    $statement->execute([hash('sha256', $token)]);
    $grant = $statement->fetch();
    if (!$grant) throw new DownloadAccessException();
    $user = getCurrentUser();
    $access = new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC')));
    if (!$access->canAccess($grant, $user, OrderAccessService::sessionGrant($grant['public_id']), !empty($_SESSION['admin']), $grant['public_id'])) throw new DownloadAccessException();
    $file = (new DownloadService(new DateTimeImmutable('now', new DateTimeZone('UTC')), $storeConfig['storage_path']))->validateGrant($grant, $token);
    $update = $pdo->prepare('UPDATE store_download_grants SET download_count = download_count + 1, last_downloaded_at = NOW() WHERE id = ? AND revoked_at IS NULL AND expires_at > NOW() AND download_count < max_downloads RETURNING download_count');
    $update->execute([$grant['id']]);
    if (!$update->fetch()) throw new DownloadAccessException();
    $pdo->commit();
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    store_log_security_event('download_rejected', ['reason' => $exception::class]);
    download_fail();
}
store_log_security_event('download_streamed', ['grant_id' => (int) $grant['id']]);
header('Content-Type: ' . $file['mime']);
header('Content-Disposition: attachment; filename="' . str_replace('"', '', $file['filename']) . '"');
header('Content-Length: ' . (string) filesize($file['path']));
$handle = fopen($file['path'], 'rb');
while (!feof($handle)) { echo fread($handle, 8192); flush(); }
fclose($handle);
exit;
