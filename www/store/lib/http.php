<?php

declare(strict_types=1);

function store_method_is_allowed(string $method, array $allowed): bool
{
    return in_array(strtoupper($method), array_map('strtoupper', $allowed), true);
}

/** @param list<string> $allowedOrigins */
function store_allowed_origin(?string $origin, array $allowedOrigins): ?string
{
    if ($origin === null || $origin === '') {
        return null;
    }

    return in_array($origin, $allowedOrigins, true) ? $origin : null;
}

/** @param array<string, scalar|array|null> $details @return array{status:int,body:array<string,mixed>} */
function store_json_payload(int $status, string $code, string $message, array $details = []): array
{
    return [
        'status' => $status,
        'body' => [
            'error' => array_filter([
                'code' => $code,
                'message' => $message,
                'details' => $details ?: null,
            ], static fn (mixed $value): bool => $value !== null),
        ],
    ];
}

/** @param array<string, scalar|array|null> $details */
function store_emit_json_error(int $status, string $code, string $message, array $details = []): never
{
    $payload = store_json_payload($status, $code, $message, $details);
    http_response_code($payload['status']);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload['body'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** @param list<string> $allowed */
function store_require_method(array $allowed): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'OPTIONS') {
        http_response_code(204);
        header('Allow: ' . implode(', ', $allowed));
        exit;
    }
    if (!store_method_is_allowed($method, $allowed)) {
        header('Allow: ' . implode(', ', $allowed));
        store_emit_json_error(405, 'method_not_allowed', 'Nepodporovaná metoda požadavku.');
    }
}

/** @param list<string> $allowedOrigins */
function store_apply_cors(array $allowedOrigins): void
{
    $origin = store_allowed_origin($_SERVER['HTTP_ORIGIN'] ?? null, $allowedOrigins);
    if ($origin === null) {
        return;
    }

    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

function store_csrf_token(string $scope): string
{
    if ($scope === '' || !preg_match('/^[a-z0-9_-]{1,64}$/i', $scope)) {
        throw new InvalidArgumentException('Invalid CSRF scope.');
    }

    if (!isset($_SESSION['_store_csrf']) || !is_array($_SESSION['_store_csrf'])) {
        $_SESSION['_store_csrf'] = [];
    }
    if (empty($_SESSION['_store_csrf'][$scope])) {
        $_SESSION['_store_csrf'][$scope] = bin2hex(random_bytes(32));
    }

    return $_SESSION['_store_csrf'][$scope];
}

function store_verify_csrf_token(string $scope, mixed $token): bool
{
    if (!is_string($token) || $token === '' || !isset($_SESSION['_store_csrf'][$scope])) {
        return false;
    }

    return hash_equals((string) $_SESSION['_store_csrf'][$scope], $token);
}

function store_require_csrf(string $scope): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf'] ?? '');
    if (!store_verify_csrf_token($scope, $token)) {
        store_log_security_event('csrf_rejected', ['scope' => $scope]);
        store_emit_json_error(403, 'csrf_invalid', 'Platnost požadavku vypršela. Obnovte prosím stránku.');
    }
}
