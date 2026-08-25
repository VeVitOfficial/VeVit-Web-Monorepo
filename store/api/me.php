<?php
// Local /api/me.php — serves nav hydration for same-origin PHP-rendered pages.
//
// NOTE: The canonical auth endpoint is account.vevit.cz/api/me.php.
// Frontend JS in vevit-account.js calls that endpoint directly with
// credentials:include. This local endpoint is kept as a thin wrapper for
// server-rendered pages that still need user context via getCurrentUser().
//
// TRANSITIONAL: returns data from the local store session (vevit_store_session).
// Once the VeVit Account server-to-server contract is available, this should be
// replaced by a proxy call to VevitAccount::checkSession().
// See lib/VevitAccount.php and docs/vevit-account-integration.md.
//
// Security:
//   - No wildcard Access-Control-Allow-Origin.
//   - CORS restricted to configured allowed origins.
//   - Cache-Control: no-store prevents proxies from caching user data.
//   - Only public, non-sensitive user fields are returned.

require_once __DIR__ . '/../config.php';

// CORS — only explicitly allowed origins; never wildcard for authenticated data.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $storeConfig['allowed_origins'] ?? [];
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    header('Allow: GET, OPTIONS');
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('Pragma: no-cache');

$user = getCurrentUser();

// Return only public fields. Never return password, internal IDs, or security metadata.
echo json_encode([
    'authenticated' => $user !== null,
    'user' => $user ? [
        'id'           => $user['id'],
        'display_name' => $user['full_name'] ?? $user['nickname'] ?? '',
        'avatar_url'   => $user['avatar_url'],
    ] : null,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
