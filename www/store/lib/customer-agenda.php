<?php
declare(strict_types=1);

foreach ([
    'auth/AuthContext.php','auth/AnonymousAuthContext.php','auth/AuthContextFactory.php','auth/ActorContext.php',
    'orders/OrderAccessService.php','orders/CustomerOrderService.php','orders/CaseQuantityAvailability.php','database/Transactional.php',
    'audit/AuditActor.php','audit/AuditService.php','claims/ClaimStateMachine.php','claims/ClaimRepository.php','claims/ClaimService.php',
    'returns/ReturnStateMachine.php','returns/ReturnRepository.php','returns/ReturnService.php',
    'delivery/DeliveryStateMachine.php','delivery/TrackingUrlPolicy.php','delivery/DeliveryRepository.php','delivery/DeliveryService.php',
    'favorites/FavoriteRepository.php','favorites/FavoriteService.php',
    'attachments/LocalPrivateStorage.php','attachments/AttachmentRepository.php','attachments/AttachmentService.php',
    'admin/LegacyAdminActor.php','admin/AdminMutationGuard.php','admin/AdminMutationService.php',
] as $file) require_once __DIR__ . '/' . $file;
require_once __DIR__ . '/RateLimiter.php';

/** @return array<string,mixed> */
function agenda_json_input(int $maxBytes = 32768): array
{
    $type = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($type !== 'application/json') store_emit_json_error(415, 'content_type_invalid', 'Požadavek musí používat JSON.');
    $length = $_SERVER['CONTENT_LENGTH'] ?? '0';
    if (!ctype_digit((string) $length) || (int) $length > $maxBytes) store_emit_json_error(413, 'request_too_large', 'Požadavek je příliš velký.');
    $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if ($raw === false || strlen($raw) > $maxBytes) store_emit_json_error(413, 'request_too_large', 'Požadavek je příliš velký.');
    try { $input = json_decode($raw, true, 32, JSON_THROW_ON_ERROR); } catch (JsonException) { store_emit_json_error(400, 'json_invalid', 'Požadavek není platný JSON.'); }
    if (!is_array($input)) store_emit_json_error(400, 'json_invalid', 'Požadavek není platný JSON.');
    return $input;
}

/** @return array{actor:ActorContext,grant:string} */
function agenda_guest_actor(string $orderPublicId): array
{
    $grant = OrderAccessService::sessionGrant($orderPublicId);
    if ($grant === null) store_emit_json_error(404, 'order_unavailable', 'Objednávka není k dispozici.');
    return ['actor' => new ActorContext('customer_guest', null, null, 'guest_order_grant'), 'grant' => $grant];
}

function agenda_rate_limit(PDO $pdo, string $scope, int $limit = 10): void
{
    (new StoreRateLimiter($pdo))->consume($scope, session_id(), $limit, 60);
}

/** @param list<string> $methods */
function agenda_prepare_http(array $methods, array $config): void
{
    $allowedOrigins = array_values(array_unique(array_filter([
        rtrim((string) ($config['app_url'] ?? ''), '/'),
        ...($config['allowed_origins'] ?? []),
    ])));
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
    if (is_string($origin) && $origin !== '' && !in_array(rtrim($origin, '/'), $allowedOrigins, true)) {
        store_emit_json_error(403, 'origin_rejected', 'Původ požadavku není povolen.');
    }
    store_apply_cors($allowedOrigins);
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        header('Access-Control-Allow-Methods: ' . implode(', ', $methods));
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Idempotency-Key');
    }
    store_require_method($methods);
}

function agenda_auth_context(array $config): AuthContext
{
    return (new AuthContextFactory($config['vevit_account'] ?? []))->fromRequest();
}

/** @return array{actor:ActorContext,grant:?string} */
function agenda_actor_for_order(string $orderPublicId, array $config): array
{
    $auth = agenda_auth_context($config);
    if ($auth->isAuthenticated() && $auth->userId()) {
        return ['actor' => new ActorContext('customer_account', $auth->userId(), null, $auth->source()), 'grant' => null];
    }
    $grant = OrderAccessService::sessionGrant($orderPublicId);
    if ($grant === null) throw new DomainException('Order unavailable.');
    return ['actor' => new ActorContext('customer_guest', null, null, 'guest_order_grant'), 'grant' => $grant];
}

function agenda_admin_mutation_service(PDO $pdo, array $config): AdminMutationService
{
    $access = new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC')));
    $audit = new AuditService($pdo);
    $availability = new CaseQuantityAvailability($pdo);
    return new AdminMutationService(
        new ClaimService($pdo, new ClaimRepository($pdo), $availability, $access, $audit),
        new ReturnService($pdo, new ReturnRepository($pdo), $availability, $access, $audit, new ReturnStateMachine(), (int)($config['return_request_days']??14)),
        new DeliveryService($pdo, new DeliveryRepository($pdo), new DeliveryStateMachine(), new TrackingUrlPolicy($config['tracking_carriers'] ?? []), $audit),
    );
}

function agenda_return_service(PDO $pdo, array $config): ReturnService
{
    return new ReturnService(
        $pdo,
        new ReturnRepository($pdo),
        new CaseQuantityAvailability($pdo),
        new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC'))),
        new AuditService($pdo),
        new ReturnStateMachine(),
        (int) ($config['return_request_days'] ?? 14),
    );
}
