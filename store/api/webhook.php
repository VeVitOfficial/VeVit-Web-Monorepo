<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../lib/payments/WebhookService.php';
require_once __DIR__ . '/../lib/payments/StripePaymentProcessor.php';

store_require_method(['POST']);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$body = file_get_contents('php://input', false, null, 0, 1048577);
if ($body === false || strlen($body) > 1048576) {
    store_emit_json_error(400, 'webhook_invalid', 'Neplatný webhook.');
}
$secret = (string) $storeConfig['stripe']['webhook_secret'];
$stripeKey = (string) $storeConfig['stripe']['secret_key'];
if (!preg_match('/^sk_(?:test|live)_[A-Za-z0-9_]+$/', $stripeKey)
    || !preg_match('/^whsec_[A-Za-z0-9_]+$/', $secret)) {
    store_log_security_event('stripe_webhook_configuration_missing');
    store_emit_json_error(503, 'webhook_unavailable', 'Webhook není dostupný.');
}
$signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
if ($secret === '' || !StripeWebhookVerifier::verify($body, $signature, $secret, time())) {
    store_log_security_event('stripe_signature_rejected');
    store_emit_json_error(400, 'webhook_invalid', 'Neplatný webhook.');
}
try {
    $event = json_decode($body, true, 64, JSON_THROW_ON_ERROR);
    if (!is_array($event)) throw new JsonException();
    $liveMode = str_starts_with($stripeKey, 'sk_live_');
    $processor = new StripePaymentProcessor(
        $pdo,
        new OrderStateMachine(),
        $liveMode,
        $storeConfig['stripe']['account_id'] ?: null
    );
    $result = $processor->process($event, hash('sha256', $body));
    http_response_code($result['http_status']);
    echo json_encode(['received' => true, 'result' => $result['result']], JSON_UNESCAPED_SLASHES);
} catch (InvalidArgumentException|JsonException $exception) {
    store_log_security_event('stripe_payload_rejected', ['reason' => $exception::class]);
    store_emit_json_error(400, 'webhook_invalid', 'Neplatný webhook.');
} catch (Throwable $exception) {
    store_log_security_event('stripe_webhook_retry', ['reason' => $exception::class]);
    store_emit_json_error(500, 'webhook_retry', 'Dočasná chyba.');
}
