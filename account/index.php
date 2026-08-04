<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth-helpers.php';

// The account shell is authenticated and must never be reused from a browser
// or shared proxy cache after login, logout, or a deployment.
header('Cache-Control: no-store, private, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

/**
 * Resolve a request URI to one of the public account section keys.
 */
function account_route_from_uri(string $requestUri): string {
  if ($requestUri === '' || $requestUri[0] !== '/') {
    return 'overview';
  }

  $path = parse_url($requestUri, PHP_URL_PATH);
  if (!is_string($path)) {
    return 'overview';
  }

  $normalized = rtrim($path, '/');
  $routes = [
    '' => 'overview',
    '/index.html' => 'overview',
    '/account' => 'overview',
    '/account/profile' => 'profile',
    '/account/security' => 'security',
    '/account/billing' => 'billing',
    '/account/connections' => 'connections',
    '/account/notifications' => 'notifications',
    '/account/preferences' => 'preferences',
    '/account/privacy' => 'privacy',
  ];

  return $routes[$normalized] ?? 'overview';
}

/**
 * Serve the account only after a valid server-side session check.
 */
function login_gate_run(array $cfg): never {
  $user = getCurrentUser($cfg);
  if ($user === null) {
    header('Location: /account/login', true, 302);
    exit;
  }
  if (
    !is_string($user['full_name'] ?? null) || trim($user['full_name']) === ''
    || !is_string($user['nickname'] ?? null) || trim($user['nickname']) === ''
  ) {
    header('Location: /account/onboarding.php', true, 302);
    exit;
  }

  try {
    $userJson = json_encode(
      $user,
      JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR
    );
  } catch (JsonException) {
    http_response_code(500);
    exit('Unable to render account');
  }

  $page = file_get_contents(__DIR__ . '/index.html');
  if (!is_string($page)) {
    http_response_code(500);
    exit('Unable to render account');
  }

  $route = account_route_from_uri((string) ($_SERVER['REQUEST_URI'] ?? '/'));
  $bootstrap = '<div id="vv-bootstrap" hidden data-user="'
    . htmlspecialchars($userJson, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
    . '" data-route="'
    . htmlspecialchars($route, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
    . '"></div>';
  header('Content-Type: text/html; charset=utf-8');
  echo str_replace('<!-- VV_USER_BOOTSTRAP -->', $bootstrap, $page);
  exit;
}

if (!defined('LOGIN_GATE_NO_MAIN')) {
  login_gate_run(auth_load_config());
}
