<?php
declare(strict_types=1);

require_once __DIR__ . '/supabase-rest.php';

const COOKIE_NAME  = '__vvsession';
const SESSION_DAYS = 30;
const COOKIE_PATH  = '/';

/**
 * Resolve an internal side-effect adapter used by the isolated test suite.
 */
function _auth_adapter(string $name): ?callable {
  $adapters = $GLOBALS['_AUTH_HELPER_ADAPTERS'] ?? null;
  if (!is_array($adapters)) {
    return null;
  }

  $adapter = $adapters[$name] ?? null;
  return is_callable($adapter) ? $adapter : null;
}

function _auth_insert(
  array $cfg,
  string $table,
  array $row
): array {
  $adapter = _auth_adapter('insert');
  if ($adapter !== null) {
    $result = $adapter($cfg, $table, $row);
    return is_array($result) ? $result : ['error' => 'Invalid insert result'];
  }

  return sb_insert($cfg, $table, $row);
}

function _auth_delete(array $cfg, string $table, array $eq): bool {
  $adapter = _auth_adapter('delete');
  if ($adapter !== null) {
    return $adapter($cfg, $table, $eq) === true;
  }

  return sb_delete($cfg, $table, $eq);
}

function _auth_update(
  array $cfg,
  string $table,
  array $eq,
  array $patch
): array {
  $adapter = _auth_adapter('update');
  if ($adapter !== null) {
    $result = $adapter($cfg, $table, $eq, $patch);
    return is_array($result) ? $result : ['error' => 'Invalid update result'];
  }

  return sb_update($cfg, $table, $eq, $patch);
}

function _auth_set_cookie(
  string $name,
  string $value,
  array $options
): bool {
  $adapter = _auth_adapter('set_cookie');
  if ($adapter !== null) {
    return $adapter($name, $value, $options) === true;
  }

  return setcookie($name, $value, $options);
}

function _auth_find_one(
  array $cfg,
  string $table,
  array $eq,
  string $select
): array {
  $adapter = _auth_adapter('find_one');
  if ($adapter !== null) {
    $result = $adapter($cfg, $table, $eq, $select);
    return is_array($result) ? $result : ['error' => 'Invalid lookup result'];
  }

  return sb_find_one($cfg, $table, $eq, $select);
}

/**
 * Load the server-only application configuration.
 */
function auth_load_config(): array {
  $configuredPath = getenv('VEVIT_ACCOUNT_CONFIG_PATH');
  $paths = [];
  if (is_string($configuredPath) && $configuredPath !== '') $paths[] = $configuredPath;
  $paths[] = '/etc/vevit/account.php';
  // Lokální vývoj: sourozenec repozitáře, tedy stále mimo document root.
  $paths[] = dirname(__DIR__, 3) . '/vevit-private/account.php';
  $path = null;
  foreach ($paths as $candidate) {
    if (is_file($candidate)) { $path = $candidate; break; }
  }
  if ($path === null) {
    header('Content-Type: application/json');
    http_response_code(500);
    exit(json_encode(['error' => 'Server configuration missing']));
  }

  $cfg = require $path;
  if (!is_array($cfg)) {
    header('Content-Type: application/json');
    http_response_code(500);
    exit(json_encode(['error' => 'Server configuration invalid']));
  }

  foreach ([
    'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
    'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET',
    'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'APP_BASE_URL',
    'TWILIO_ACCOUNT_SID', 'TWILIO_API_KEY', 'TWILIO_API_KEY_SECRET',
    'TWILIO_VERIFY_SERVICE_SID', 'TOTP_ENCRYPTION_KEY',
  ] as $key) {
    $value = getenv($key);
    if (is_string($value) && $value !== '') $cfg[$key] = $value;
  }

  return $cfg;
}

/**
 * Perform a filtered PostgREST GET. Each filter is [column, operator, value].
 *
 * @param array<int, array{0:string, 1:string, 2:string}> $filters
 */
function _auth_filtered_get(
  array $cfg,
  string $table,
  array $filters,
  string $select,
  ?int $limit = null
): array {
  $adapter = _auth_adapter('filtered_get');
  if ($adapter !== null) {
    $result = $adapter($cfg, $table, $filters, $select, $limit);
    return is_array($result) ? $result : ['error' => 'Invalid lookup result'];
  }

  if (
    !isset($cfg['SUPABASE_URL'])
    || !is_string($cfg['SUPABASE_URL'])
    || _sb_secret_key($cfg) === ''
  ) {
    return ['error' => 'Invalid server configuration'];
  }

  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $query = ['select=' . rawurlencode($select)];

  foreach ($filters as [$column, $operator, $value]) {
    $query[] = rawurlencode($column) . '=' . rawurlencode($operator . '.' . $value);
  }
  if ($limit !== null) {
    $query[] = 'limit=' . rawurlencode((string) max(0, $limit));
  }

  $response = _sb_curl(
    'GET',
    $base . '?' . implode('&', $query),
    _sb_base_headers($cfg)
  );

  return _sb_parse($response);
}

/**
 * Read and validate the current session, then return only non-secret user data.
 */
function getCurrentUser(array $cfg): ?array {
  $token = $_COOKIE[COOKIE_NAME] ?? null;
  if (
    !is_string($token)
    || preg_match('/\A[0-9a-f]{64}\z/iD', $token) !== 1
  ) {
    return null;
  }

  $session = _auth_filtered_get(
    $cfg,
    'sessions',
    [
      ['session_token', 'eq', $token],
      ['expires_at', 'gt', gmdate('Y-m-d\TH:i:s\Z')],
    ],
    'user_id,remember',
    1
  );
  $rows = $session['data'] ?? null;
  if (
    !is_array($rows)
    || !isset($rows[0])
    || !is_array($rows[0])
    || !isset($rows[0]['user_id'])
    || !is_string($rows[0]['user_id'])
    || $rows[0]['user_id'] === ''
  ) {
    return null;
  }

  $safeColumns = implode(',', [
    'id',
    'email',
    'nickname',
    'full_name',
    'tier',
    'tier_expires',
    'tier_billing',
    'tier_cancel_at',
    'role',
    'avatar_url',
    'phone',
    'location',
    'birth_date',
    'bio',
    'level',
    'xp',
    'created_at',
    'company_name',
    'ico',
    'dic',
    'billing_address',
    'language',
    'two_factor_enabled',
  ]);
  $result = _auth_find_one(
    $cfg,
    'users',
    ['id' => $rows[0]['user_id']],
    $safeColumns
  );
  $user = $result['data'] ?? null;
  if (!is_array($user)) {
    return null;
  }

  $remember = $rows[0]['remember'] ?? false;
  if (!is_bool($remember)) {
    jsonErr('Unable to renew session', 500);
  }

  renewSession($cfg, $token, $remember);
  return $user;
}

/**
 * Require an authenticated user or terminate with a JSON 401 response.
 */
function requireAuth(array $cfg): array {
  $user = getCurrentUser($cfg);
  if ($user === null) {
    jsonErr('Unauthorized', 401);
  }

  return $user;
}

/**
 * Return whether an action remains below its IP-based rate limit.
 */
function checkRateLimit(
  array $cfg,
  string $ip,
  string $action,
  int $limit,
  int $windowMinutes
): bool {
  if ($limit <= 0 || $windowMinutes < 0) {
    return false;
  }

  $since = gmdate('Y-m-d\TH:i:s\Z', time() - ($windowMinutes * 60));
  $result = _auth_filtered_get(
    $cfg,
    'login_attempts',
    [
      ['ip_address', 'eq', $ip],
      ['action', 'eq', $action],
      ['attempt_time', 'gt', $since],
    ],
    'id',
    $limit
  );
  $rows = $result['data'] ?? null;
  if (!is_array($rows)) {
    return false;
  }

  return count($rows) < $limit;
}

/**
 * Record a rate-limited action attempt.
 */
function logAttempt(array $cfg, string $ip, string $action): void {
  // TODO(Task 17): replace checkRateLimit() + logAttempt() with one Postgres
  // RPC that atomically records the attempt and evaluates the time window.
  // Separate HTTP calls cannot eliminate concurrent check/insert races.
  $result = _auth_insert($cfg, 'login_attempts', [
    'ip_address' => $ip,
    'action' => $action,
    'attempt_time' => gmdate('Y-m-d\TH:i:s\Z'),
  ]);
  if (!isset($result['data']) || !is_array($result['data'])) {
    jsonErr('Unable to process request', 503);
  }
}

/**
 * Record a security-related account event.
 */
function logActivity(
  array $cfg,
  string $userId,
  string $kind,
  string $detail = ''
): void {
  $result = _auth_insert($cfg, 'account_activity', [
    'user_id' => $userId,
    'kind' => $kind,
    'detail' => $detail,
    'created_at' => gmdate('Y-m-d\TH:i:s\Z'),
  ]);
  if (!isset($result['data']) || !is_array($result['data'])) {
    error_log('[auth] account_activity insert failed');
  }
}

/**
 * Determine whether PHP received this request over HTTPS.
 */
function _auth_is_https(): bool {
  $https = strtolower((string) ($_SERVER['HTTPS'] ?? ''));
  if ($https !== '' && $https !== 'off' && $https !== '0') {
    return true;
  }

  return (string) ($_SERVER['SERVER_PORT'] ?? '') === '443';
}

/**
 * Return the shared session-cookie options.
 *
 * @return array{
 *   expires:int,
 *   path:string,
 *   domain:string,
 *   secure:bool,
 *   httponly:bool,
 *   samesite:string
 * }
 */
function _auth_cookie_options(array $cfg, int $expires): array {
  $domain = $cfg['COOKIE_DOMAIN'] ?? '';

  return [
    'expires' => $expires,
    'path' => COOKIE_PATH,
    'domain' => is_string($domain) ? $domain : '',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
  ];
}

function _auth_session_expires_at(int $now): string {
  return gmdate('Y-m-d\TH:i:s\Z', $now + (SESSION_DAYS * 86400));
}

function _auth_set_session_cookie(
  array $cfg,
  string $token,
  bool $remember,
  int $now
): bool {
  $expires = $remember ? $now + (SESSION_DAYS * 86400) : 0;
  return !headers_sent()
    && _auth_set_cookie(COOKIE_NAME, $token, _auth_cookie_options($cfg, $expires));
}

/**
 * Persist a new session and set its secure browser cookie.
 */
function createSession(array $cfg, string $userId, bool $remember = false): string {
  if (!_auth_is_https()) {
    jsonErr('Secure connection required', 500);
  }

  $token = bin2hex(random_bytes(32));
  $now = time();
  $result = _auth_insert($cfg, 'sessions', [
    'session_token' => $token,
    'user_id' => $userId,
    'remember' => $remember,
    'expires_at' => _auth_session_expires_at($now),
    'created_at' => gmdate('Y-m-d\TH:i:s\Z', $now),
    'last_seen_at' => gmdate('Y-m-d\TH:i:s\Z', $now),
    'ip_address' => clientIp($cfg),
    'user_agent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 240),
  ]);
  $inserted = $result['data'] ?? null;
  if (
    !is_array($inserted)
    || !isset($inserted['session_token'])
    || !is_string($inserted['session_token'])
    || !hash_equals($token, $inserted['session_token'])
  ) {
    jsonErr('Unable to create session', 500);
  }

  if (
    !_auth_set_session_cookie($cfg, $token, $remember, $now)
  ) {
    _auth_delete($cfg, 'sessions', ['session_token' => $token]);
    jsonErr('Unable to create session', 500);
  }

  return $token;
}

/**
 * Extend a verified server session and reset its browser cookie lifetime.
 */
function renewSession(array $cfg, string $token, bool $remember): void {
  if (!_auth_is_https()) {
    jsonErr('Secure connection required', 500);
  }

  $now = time();
  $result = _auth_update($cfg, 'sessions', ['session_token' => $token], [
    'expires_at' => _auth_session_expires_at($now),
    'last_seen_at' => gmdate('Y-m-d\TH:i:s\Z', $now),
  ]);
  if (isset($result['error']) || !_auth_set_session_cookie($cfg, $token, $remember, $now)) {
    jsonErr('Unable to renew session', 500);
  }
}

/**
 * Delete the current DB session and expire the matching browser cookie.
 */
function destroySession(array $cfg): void {
  $token = $_COOKIE[COOKIE_NAME] ?? null;
  $deleted = true;
  if (
    is_string($token)
    && preg_match('/\A[0-9a-f]{64}\z/iD', $token) === 1
  ) {
    $deleted = _auth_delete($cfg, 'sessions', ['session_token' => $token]);
  }

  // Always attempt the cookie expiry, even when DB deletion failed.
  $expired = @_auth_set_cookie(
    COOKIE_NAME,
    '',
    _auth_cookie_options($cfg, time() - 3600)
  );
  unset($_COOKIE[COOKIE_NAME]);

  if (!$deleted || !$expired) {
    jsonErr('Unable to end session', 500);
  }
}

/**
 * Return whether a method can mutate server state.
 */
function _auth_is_unsafe_method(string $method): bool {
  return in_array(strtoupper($method), ['POST', 'PUT', 'PATCH', 'DELETE'], true);
}

/**
 * Return whether request metadata indicates that a body is present.
 */
function _auth_request_has_body(): bool {
  $contentLength = $_SERVER['CONTENT_LENGTH'] ?? null;
  if (
    is_string($contentLength)
    && ctype_digit($contentLength)
    && (int) $contentLength > 0
  ) {
    return true;
  }

  $transferEncoding = $_SERVER['HTTP_TRANSFER_ENCODING'] ?? null;
  return is_string($transferEncoding) && trim($transferEncoding) !== '';
}

/**
 * Accept application/json with optional parameters, but no simple MIME types.
 */
function _auth_has_json_content_type(): bool {
  $contentType = $_SERVER['CONTENT_TYPE']
    ?? $_SERVER['HTTP_CONTENT_TYPE']
    ?? null;
  if (!is_string($contentType)) {
    return false;
  }

  $mediaType = strtolower(trim(explode(';', $contentType, 2)[0]));
  return $mediaType === 'application/json';
}

/**
 * Emit JSON and exact-origin credentialed CORS headers, then handle preflight.
 */
function beginJson(array $cfg): void {
  header('Content-Type: application/json');
  header('Cache-Control: no-store, private, max-age=0');
  header('Vary: Origin');

  $originPresent = array_key_exists('HTTP_ORIGIN', $_SERVER);
  $origin = $originPresent ? $_SERVER['HTTP_ORIGIN'] : null;
  $allowedOrigin = $cfg['ALLOWED_ORIGIN'] ?? null;
  $originAllowed = (
    is_string($origin)
    && $origin !== ''
    && is_string($allowedOrigin)
    && $allowedOrigin !== ''
    && hash_equals($allowedOrigin, $origin)
  );
  if ($originAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }

  $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? ''));
  if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
  }

  if (_auth_is_unsafe_method($method) && $originPresent && !$originAllowed) {
    jsonErr('Origin not allowed', 403);
  }

  if (_auth_request_has_body() && !_auth_has_json_content_type()) {
    jsonErr('Content-Type must be application/json', 415);
  }
}

/** Set the same origin safeguards as JSON endpoints, but accept a multipart body. */
function beginMultipart(array $cfg): void {
  header('Content-Type: application/json');
  header('Cache-Control: no-store, private, max-age=0');
  header('Vary: Origin');
  $originPresent = array_key_exists('HTTP_ORIGIN', $_SERVER);
  $origin = $originPresent ? $_SERVER['HTTP_ORIGIN'] : null;
  $allowedOrigin = $cfg['ALLOWED_ORIGIN'] ?? null;
  $originAllowed = is_string($origin) && $origin !== '' && is_string($allowedOrigin)
    && $allowedOrigin !== '' && hash_equals($allowedOrigin, $origin);
  if ($originAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
  }
  $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? ''));
  if ($method === 'OPTIONS') { http_response_code(204); exit; }
  if ($method !== 'POST') { header('Allow: POST'); jsonErr('Method not allowed', 405); }
  if ($originPresent && !$originAllowed) jsonErr('Origin not allowed', 403);
  $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
  if (!is_string($contentType) || !str_starts_with(strtolower($contentType), 'multipart/form-data;')) {
    jsonErr('Content-Type must be multipart/form-data', 415);
  }
}

/**
 * Encode JSON without allowing an encoder failure to become an empty response.
 */
function _auth_encode_json(mixed $data): ?string {
  try {
    return json_encode(
      $data,
      JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
    );
  } catch (JsonException) {
    return null;
  }
}

/**
 * Send a successful JSON response and terminate.
 */
function jsonOk(mixed $data, int $code = 200): never {
  $encoded = _auth_encode_json($data);
  if ($encoded === null) {
    http_response_code(500);
    exit('{"error":"JSON encoding failed"}');
  }

  http_response_code($code);
  exit($encoded);
}

/**
 * Send an error JSON response and terminate.
 */
function jsonErr(string $msg, int $code = 400, ?string $field = null): never {
  http_response_code($code);
  $body = ['error' => $msg];
  if ($field !== null) {
    $body['field'] = $field;
  }

  $encoded = _auth_encode_json($body);
  if ($encoded === null) {
    http_response_code(500);
    exit('{"error":"JSON encoding failed"}');
  }

  http_response_code($code);
  exit($encoded);
}

/**
 * Return whether an IPv4 or IPv6 address belongs to an explicit CIDR.
 */
function _auth_ip_in_cidr(string $ip, string $cidr): bool {
  $parts = explode('/', trim($cidr), 2);
  if (
    count($parts) !== 2
    || preg_match('/\A(?:0|[1-9][0-9]{0,2})\z/D', $parts[1]) !== 1
  ) {
    return false;
  }

  $packedIp = @inet_pton($ip);
  $packedNetwork = @inet_pton($parts[0]);
  if (
    $packedIp === false
    || $packedNetwork === false
    || strlen($packedIp) !== strlen($packedNetwork)
  ) {
    return false;
  }

  $prefix = (int) $parts[1];
  $totalBits = strlen($packedIp) * 8;
  if ($prefix > $totalBits) {
    return false;
  }

  $wholeBytes = intdiv($prefix, 8);
  if (
    $wholeBytes > 0
    && !hash_equals(
      substr($packedNetwork, 0, $wholeBytes),
      substr($packedIp, 0, $wholeBytes)
    )
  ) {
    return false;
  }

  $remainingBits = $prefix % 8;
  if ($remainingBits === 0) {
    return true;
  }

  $mask = (0xff << (8 - $remainingBits)) & 0xff;
  return (
    (ord($packedNetwork[$wholeBytes]) & $mask)
    === (ord($packedIp[$wholeBytes]) & $mask)
  );
}

/**
 * Trust proxy behavior only for peers in explicitly configured CIDRs.
 */
function _auth_is_trusted_proxy_ip(string $ip, array $cfg): bool {
  if (filter_var($ip, FILTER_VALIDATE_IP) === false) {
    return false;
  }

  $cidrs = $cfg['TRUSTED_PROXY_CIDRS'] ?? null;
  if (!is_array($cidrs)) {
    return false;
  }

  foreach ($cidrs as $cidr) {
    if (is_string($cidr) && _auth_ip_in_cidr($ip, $cidr)) {
      return true;
    }
  }

  return false;
}

/**
 * Return a validated client IP using an explicitly trusted proxy chain.
 *
 * The chain is validated in full, then walked right-to-left. Trusted proxy
 * hops are removed and the first untrusted address is treated as the client.
 * This remains safe when a proxy appends to a caller-supplied XFF header.
 */
function clientIp(array $cfg): string {
  $remote = $_SERVER['REMOTE_ADDR'] ?? null;
  if (!is_string($remote) || filter_var($remote, FILTER_VALIDATE_IP) === false) {
    return '0.0.0.0';
  }

  $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? null;
  if (
    !_auth_is_trusted_proxy_ip($remote, $cfg)
    || !is_string($forwarded)
    || trim($forwarded) === ''
  ) {
    return $remote;
  }

  $hops = explode(',', $forwarded);
  if (count($hops) > 32) {
    return $remote;
  }

  foreach ($hops as &$hop) {
    $hop = trim($hop);
    if ($hop === '' || filter_var($hop, FILTER_VALIDATE_IP) === false) {
      unset($hop);
      return $remote;
    }
  }
  unset($hop);

  for ($index = count($hops) - 1; $index >= 0; $index--) {
    if (!_auth_is_trusted_proxy_ip($hops[$index], $cfg)) {
      return $hops[$index];
    }
  }

  // A chain containing only configured proxies has no unambiguous client.
  return $remote;
}

/**
 * Decode a JSON object request body or terminate with a JSON 400 response.
 */
function jsonBody(): array {
  if (!_auth_has_json_content_type()) {
    jsonErr('Content-Type must be application/json', 415);
  }

  $raw = file_get_contents('php://input');
  try {
    $object = json_decode((string) $raw, false, 512, JSON_THROW_ON_ERROR);
    if (!is_object($object)) {
      jsonErr('Invalid JSON body');
    }

    $data = json_decode((string) $raw, true, 512, JSON_THROW_ON_ERROR);
  } catch (JsonException) {
    jsonErr('Invalid JSON body');
  }

  return $data;
}
