<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli' && !defined('VEVIT_AUTH_INCLUDED')) {
    http_response_code(404);
    exit;
}

const VEVIT_SESSION_COOKIE = '__vvsession';

/** Load server-only Account connectivity without exposing credentials to JS. */
function vevitAuthConfig(): array
{
    if (!defined('VEVIT_CONFIG_INCLUDED')) {
        define('VEVIT_CONFIG_INCLUDED', true);
    }

    $configuredPath = getenv('VEVIT_HOME_CONFIG_PATH');
    $paths = [];
    if (is_string($configuredPath) && $configuredPath !== '') $paths[] = $configuredPath;
    $paths[] = '/etc/vevit/home.php';
    $paths[] = dirname(__DIR__, 3) . '/vevit-private/home.php';
    foreach ($paths as $path) {
        if (!is_file($path)) continue;
        $config = require $path;
        return is_array($config) ? $config : [];
    }
    return [];
}

function vevitJsonHeaders(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private, max-age=0');
    header('Vary: Origin');
}

function vevitJsonResponse(array $body, int $status): never
{
    http_response_code($status);
    $encoded = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(is_string($encoded) ? $encoded : '{"error":"JSON encoding failed"}');
}

function vevitRequireMethod(string $method): void
{
    $expected = strtoupper($method);
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== $expected) {
        header('Allow: ' . $expected);
        vevitJsonResponse(['error' => 'Method not allowed'], 405);
    }
}

function vevitAuthAdapter(string $name): ?callable
{
    $adapters = $GLOBALS['_VEVIT_AUTH_ADAPTERS'] ?? null;
    return is_array($adapters) && is_callable($adapters[$name] ?? null)
        ? $adapters[$name]
        : null;
}

/** Execute one server-to-server PostgREST request. */
function vevitAuthRest(array $config, string $method, string $table, array $query = []): ?array
{
    $base = $config['supabase_url'] ?? null;
    $key = $config['service_role'] ?? null;
    if (!is_string($base) || !str_starts_with($base, 'https://') || !is_string($key) || $key === '') {
        return null;
    }
    $url = rtrim($base, '/') . '/rest/v1/' . rawurlencode($table);
    if ($query !== []) $url .= '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    $curl = curl_init($url);
    if ($curl === false) return null;
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'apikey: ' . $key,
            'Authorization: Bearer ' . $key,
            'Prefer: return=minimal',
        ],
    ]);
    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    if (!is_string($body) || $status < 200 || $status >= 300) return null;
    if ($body === '') return [];
    $decoded = json_decode($body, true);
    return is_array($decoded) ? $decoded : null;
}

function vevitFindSession(array $config, string $rawToken): ?array
{
    $adapter = vevitAuthAdapter('find_session');
    if ($adapter !== null) {
        $result = $adapter($config, $rawToken);
        return is_array($result) ? $result : null;
    }
    $rows = vevitAuthRest($config, 'GET', 'sessions', [
        'select' => 'user_id,expires_at',
        'session_token' => 'eq.' . $rawToken,
        'limit' => '1',
    ]);
    return is_array($rows) && is_array($rows[0] ?? null) ? $rows[0] : null;
}

function vevitFindUser(array $config, string $userId): ?array
{
    $adapter = vevitAuthAdapter('find_user');
    if ($adapter !== null) {
        $result = $adapter($config, $userId);
        return is_array($result) ? $result : null;
    }
    $rows = vevitAuthRest($config, 'GET', 'users', [
        'select' => 'id,full_name,nickname,email,avatar_url',
        'id' => 'eq.' . $userId,
        'limit' => '1',
    ]);
    return is_array($rows) && is_array($rows[0] ?? null) ? $rows[0] : null;
}

function vevitMaskEmail(mixed $email): string
{
    if (!is_string($email) || !str_contains($email, '@')) return '';
    [$local, $domain] = explode('@', $email, 2);
    return $local !== '' && $domain !== '' ? substr($local, 0, 1) . '***@' . $domain : '';
}

function vevitPublicUser(array $user): array
{
    return [
        'id' => is_string($user['id'] ?? null) ? $user['id'] : '',
        'full_name' => is_string($user['full_name'] ?? null) ? $user['full_name'] : '',
        'nickname' => is_string($user['nickname'] ?? null) ? $user['nickname'] : '',
        'email' => vevitMaskEmail($user['email'] ?? null),
        'avatar_url' => is_string($user['avatar_url'] ?? null) ? $user['avatar_url'] : '',
    ];
}

/** Validate the cookie, active session row, expiration, and owning user. */
function optionalVevitAuth(array $config): ?array
{
    $rawToken = $_COOKIE[VEVIT_SESSION_COOKIE] ?? null;
    if (!is_string($rawToken) || preg_match('/\A[0-9a-f]{64}\z/iD', $rawToken) !== 1) return null;
    $session = vevitFindSession($config, $rawToken);
    $expiresAt = is_array($session) ? strtotime((string) ($session['expires_at'] ?? '')) : false;
    $userId = is_array($session) ? ($session['user_id'] ?? null) : null;
    if (!is_int($expiresAt) || $expiresAt <= time() || !is_string($userId) || $userId === '') return null;
    $user = vevitFindUser($config, $userId);
    return is_array($user) ? vevitPublicUser($user) : null;
}

function requireVevitAuth(array $config): array
{
    $user = optionalVevitAuth($config);
    if ($user === null) vevitJsonResponse(['authenticated' => false], 401);
    return $user;
}

function vevitAuthCookieOptions(array $config, int $expires): array
{
    return [
        'expires' => $expires,
        'path' => '/',
        'domain' => '.vevit.cz',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ];
}

function currentVevitCsrfToken(array $config): string
{
    $rawToken = $_COOKIE[VEVIT_SESSION_COOKIE] ?? null;
    $secret = $config['csrf_secret'] ?? null;
    if (!is_string($rawToken) || !is_string($secret) || $secret === '') {
        vevitJsonResponse(['error' => 'CSRF configuration unavailable'], 500);
    }
    return hash_hmac('sha256', 'vevit-portal-csrf-v1|' . $rawToken, $secret);
}

function vevitOriginAllowed(array $config, mixed $origin): bool
{
    if (!is_string($origin) || $origin === '') return false;
    $allowed = $config['allowed_origins'] ?? [];
    if (!is_array($allowed)) return false;
    foreach ($allowed as $candidate) {
        if (is_string($candidate) && hash_equals($candidate, $origin)) return true;
    }
    return false;
}

function requireVevitCsrf(array $config): void
{
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    $expected = currentVevitCsrfToken($config);
    if (!is_string($provided) || !hash_equals($expected, $provided)) {
        vevitJsonResponse(['error' => 'Invalid CSRF token'], 403);
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
    if (vevitOriginAllowed($config, $origin)) return;
    $referer = $_SERVER['HTTP_REFERER'] ?? null;
    $parts = is_string($referer) ? parse_url($referer) : false;
    if (is_array($parts) && ($parts['scheme'] ?? null) === 'https' && is_string($parts['host'] ?? null)) {
        $refererOrigin = 'https://' . $parts['host'];
        if (vevitOriginAllowed($config, $refererOrigin)) return;
    }
    vevitJsonResponse(['error' => 'Origin not allowed'], 403);
}

function logoutVevitSession(array $config): void
{
    $rawToken = $_COOKIE[VEVIT_SESSION_COOKIE] ?? null;
    $deleted = false;
    if (is_string($rawToken) && preg_match('/\A[0-9a-f]{64}\z/iD', $rawToken) === 1) {
        $adapter = vevitAuthAdapter('delete_session');
        $deleted = $adapter !== null
            ? $adapter($config, $rawToken) === true
            : vevitAuthRest($config, 'DELETE', 'sessions', ['session_token' => 'eq.' . $rawToken]) !== null;
    }
    setcookie(VEVIT_SESSION_COOKIE, '', vevitAuthCookieOptions($config, time() - 3600));
    unset($_COOKIE[VEVIT_SESSION_COOKIE]);
    if (!$deleted) vevitJsonResponse(['error' => 'Unable to end session'], 500);
}
