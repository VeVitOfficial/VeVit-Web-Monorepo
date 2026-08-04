<?php

declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../lib/orders/CheckoutService.php';
require_once __DIR__ . '/../lib/RateLimiter.php';

store_require_method(['POST']);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    store_emit_json_error(415, 'content_type_invalid', 'Požadavek musí používat JSON.');
}
$contentLength = $_SERVER['CONTENT_LENGTH'] ?? '0';
if (!ctype_digit((string) $contentLength) || (int) $contentLength > 32768) {
    store_emit_json_error(413, 'request_too_large', 'Požadavek je příliš velký.');
}
store_require_csrf('checkout');

$rawBody = file_get_contents('php://input', false, null, 0, 32769);
if ($rawBody === false || strlen($rawBody) > 32768) {
    store_emit_json_error(413, 'request_too_large', 'Požadavek je příliš velký.');
}
try {
    $input = json_decode($rawBody, true, 64, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    store_emit_json_error(400, 'json_invalid', 'Požadavek není platný JSON.');
}
if (!is_array($input)) {
    store_emit_json_error(400, 'json_invalid', 'Požadavek není platný JSON.');
}

$untrustedFields = [];
foreach (($input['items'] ?? []) as $item) {
    if (!is_array($item)) {
        continue;
    }
    foreach (['price', 'sale_price', 'currency', 'name', 'type', 'stock', 'shipping', 'tax', 'total', 'download_url', 'download_token'] as $field) {
        if (array_key_exists($field, $item)) {
            $untrustedFields[$field] = true;
        }
    }
}
if ($untrustedFields !== []) {
    store_log_security_event('checkout_client_owned_fields_ignored', ['fields' => array_keys($untrustedFields)]);
}

$idempotencyKey = $_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? ($input['idempotency_key'] ?? '');
$input['idempotency_key'] = $idempotencyKey;
$user = getCurrentUser();

try {
    $limiter = new StoreRateLimiter($pdo);
    // REMOTE_ADDR is supplied by the web server. Forwarded headers remain
    // intentionally untrusted until WEDOS provides an explicit proxy contract.
    $limiter->consume('checkout_snapshot_ip', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 30, 60);
    $limiter->consume('checkout_snapshot_session', session_id(), 5, 60);

    $service = new CheckoutService(new PdoCheckoutRepository($pdo), new DateTimeImmutable('now', new DateTimeZone('UTC')), $storeConfig['storage_path']);
    $result = $service->createSnapshot($input, $user, session_id());
    $snapshot = $result['snapshot'];

    if ($result['reused']) {
        $hasGuestGrant = isset($_SESSION['_store_checkout_grants'][$snapshot['public_id']]['grant']);
        if ($user === null && !$hasGuestGrant) {
            store_log_security_event('checkout_snapshot_access_rejected', ['reason' => 'missing_guest_grant']);
            store_emit_json_error(409, 'checkout_retry_required', 'Objednávku nelze bezpečně obnovit. Opakujte prosím pokus.');
        }
        store_log_security_event('checkout_idempotency_reused', ['public_id_prefix' => substr((string) $snapshot['public_id'], 0, 8)]);
    } else {
        $_SESSION['_store_checkout_grants'][$snapshot['public_id']] = [
            'grant' => $result['grant'],
            'expires_at' => $snapshot['expires_at'],
        ];
    }

    http_response_code($result['reused'] ? 200 : 201);
    echo json_encode([
        'checkout' => [
            'id' => $snapshot['public_id'],
            'expires_at' => $snapshot['expires_at'],
            'currency' => $snapshot['currency'],
            'total_minor' => $snapshot['total_minor'],
        ],
        'payment' => ['status' => 'not_started'],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (StoreRateLimitExceeded $exception) {
    header('Retry-After: ' . $exception->retryAfter);
    store_log_security_event('checkout_rate_limited');
    store_emit_json_error(429, 'checkout_rate_limited', 'Příliš mnoho pokusů. Zkuste to prosím za chvíli.');
} catch (CheckoutValidationException $exception) {
    store_log_security_event('checkout_validation_rejected', ['code' => $exception->errorCode]);
    store_emit_json_error(422, $exception->errorCode, $exception->getMessage());
} catch (PDOException $exception) {
    store_log_security_event('checkout_transaction_failed', ['sql_state' => (string) $exception->getCode()]);
    store_emit_json_error(500, 'checkout_unavailable', 'Objednávku se nyní nepodařilo připravit. Zkuste to prosím znovu.');
} catch (Throwable $exception) {
    store_log_security_event('checkout_unexpected_error', ['type' => $exception::class]);
    store_emit_json_error(500, 'checkout_unavailable', 'Objednávku se nyní nepodařilo připravit. Zkuste to prosím znovu.');
}
