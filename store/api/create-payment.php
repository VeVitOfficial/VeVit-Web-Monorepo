<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../lib/orders/PaymentOrderService.php';
require_once __DIR__ . '/../lib/payments/StripeCheckoutService.php';
require_once __DIR__ . '/../lib/stripe-php/init.php';

store_require_method(['POST']);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
store_require_csrf('checkout');

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    store_emit_json_error(415, 'content_type_invalid', 'Požadavek musí používat JSON.');
}
$body = file_get_contents('php://input', false, null, 0, 4097);
if ($body === false || strlen($body) > 4096) {
    store_emit_json_error(413, 'request_too_large', 'Požadavek je příliš velký.');
}
try {
    $input = json_decode($body, true, 16, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    store_emit_json_error(400, 'json_invalid', 'Požadavek není platný.');
}
if (!is_array($input) || array_diff(array_keys($input), ['snapshot']) !== []) {
    store_emit_json_error(400, 'request_invalid', 'Požadavek není platný.');
}
$snapshotId = $input['snapshot'] ?? null;
if (!is_string($snapshotId) || !preg_match('/^[a-f0-9]{32}$/', $snapshotId)) {
    store_emit_json_error(404, 'payment_unavailable', 'Platbu se nyní nepodařilo připravit.');
}
if (!preg_match('/^sk_(?:test|live)_[A-Za-z0-9_]+$/', (string) $storeConfig['stripe']['secret_key'])
    || !preg_match('/^whsec_[A-Za-z0-9_]+$/', (string) $storeConfig['stripe']['webhook_secret'])) {
    store_log_security_event('payment_configuration_missing');
    store_emit_json_error(503, 'payment_unavailable', 'Platbu se nyní nepodařilo připravit.');
}

try {
    $user = getCurrentUser();
    $checkoutGrant = $_SESSION['_store_checkout_grants'][$snapshotId]['grant'] ?? null;
    $orderResult = (new PaymentOrderService(
        $pdo,
        new DateTimeImmutable('now', new DateTimeZone('UTC')),
        (string) $storeConfig['storage_path']
    ))->createFromSnapshot($snapshotId, $user, is_string($checkoutGrant) ? $checkoutGrant : null);
    $order = $orderResult['order'];
    if ($orderResult['guest_grant'] !== '') {
        $_SESSION['_store_order_grants'][$order['public_id']] = [
            'grant' => $orderResult['guest_grant'],
            'created_at' => time(),
        ];
    }
    $stripe = new StripeCheckoutService(
        $pdo,
        new LegacyStripeCheckoutClient((string) $storeConfig['stripe']['secret_key']),
        (string) $storeConfig['app_url'],
        str_starts_with((string) $storeConfig['stripe']['secret_key'], 'sk_live_')
    );
    $session = $stripe->createOrReuse((int) $order['id']);
    store_log_security_event('stripe_checkout_ready', [
        'order_public_prefix' => substr((string) $order['public_id'], 0, 8),
        'reused' => $session['reused'] ? 1 : 0,
    ]);
    echo json_encode([
        'url' => $session['url'],
        'order' => ['public_id' => $order['public_id']],
    ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (PaymentOrderException $exception) {
    store_log_security_event('payment_order_rejected', ['reason' => $exception->errorCode]);
    store_emit_json_error(409, 'payment_refresh_required', 'Košík se změnil. Obnovte prosím objednávku.');
} catch (Throwable $exception) {
    store_log_security_event('payment_creation_failed', ['reason' => $exception::class]);
    store_emit_json_error(503, 'payment_unavailable', 'Platbu se nyní nepodařilo připravit.');
}
