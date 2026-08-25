<?php
declare(strict_types=1);
require_once __DIR__ . '/totp.php';
require_once dirname(__DIR__, 2) . '/shared/i18n/locale.php';

function totpChallengeId(mixed $value): ?string {
  return is_string($value) && preg_match('/\A[0-9a-f]{48}\z/D', $value) === 1 ? $value : null;
}

function loadTotpChallenge(array $cfg, string $id, string $kind): ?array {
  $result = _auth_find_one($cfg, 'auth_challenges', ['id' => $id], 'id,user_id,kind,payload,expires_at,used_at,attempts');
  $row = $result['data'] ?? null;
  if (!is_array($row) || ($row['kind'] ?? null) !== $kind || ($row['used_at'] ?? null) !== null
    || (int) ($row['attempts'] ?? 0) >= 5 || strtotime((string) ($row['expires_at'] ?? '')) <= time()) return null;
  return $row;
}

function requireCurrentPassword(array $cfg, string $userId, string $password): void {
  $result = _auth_find_one($cfg, 'users', ['id' => $userId], 'password');
  $hash = $result['data']['password'] ?? null;
  if (!is_string($hash) || $hash === '') jsonErr('Pro tento účet je nutné nové ověření přes připojenou službu.', 409);
  if (!password_verify($password, $hash)) jsonErr('Současné heslo je nesprávné.', 401);
}

function requireTotpReauthentication(array $cfg, string $userId, array $body): void {
  $result = _auth_find_one($cfg, 'users', ['id' => $userId], 'password');
  $hash = $result['data']['password'] ?? null;
  if (is_string($hash) && $hash !== '') {
    if (!password_verify((string) ($body['password'] ?? ''), $hash)) jsonErr('Současné heslo je nesprávné.', 401);
    return;
  }
  $id = totpChallengeId($body['reauth_challenge'] ?? null);
  $challenge = $id ? loadTotpChallenge($cfg, $id, 'totp_setup') : null;
  $payload = decodeChallengePayload($challenge['payload'] ?? []);
  if (!$challenge || !hash_equals($userId, (string) $challenge['user_id']) || ($payload['purpose'] ?? '') !== 'oauth_reauth') {
    jsonErr('Je nutné nové ověření přes připojenou službu.', 401);
  }
  _auth_update($cfg, 'auth_challenges', ['id' => $id], ['used_at' => gmdate('c')]);
}

function findUnusedRecoveryCode(array $cfg, string $userId, string $candidate): ?int {
  $rows = _auth_filtered_get($cfg, 'user_recovery_codes', [
    ['user_id', 'eq', $userId], ['used_at', 'is', 'null'],
  ], 'id,code_hash', 20);
  foreach (($rows['data'] ?? []) as $row) {
    if (is_array($row) && password_verify(strtoupper(trim($candidate)), (string) ($row['code_hash'] ?? ''))) return (int) $row['id'];
  }
  return null;
}

function totpRateLimit(array $cfg, string $action, int $limit = 10): void {
  $ip = clientIp($cfg);
  if (!checkRateLimit($cfg, $ip, $action, $limit, 10)) jsonErr('Příliš mnoho pokusů. Zkuste to později.', 429);
  logAttempt($cfg, $ip, $action);
}

function totpRpcScalar(array $result): mixed {
  $data = $result['data'] ?? null;
  return is_array($data) && array_is_list($data) && count($data) === 1 ? $data[0] : $data;
}

function completeTotpSession(array $cfg, array $consumed): never {
  $userId = $consumed['user_id'] ?? null;
  if (!is_string($userId) || $userId === '') jsonErr('Ověření se nepodařilo dokončit.', 409);
  $payload = decodeChallengePayload($consumed['payload'] ?? []);
  createSession($cfg, $userId, ($payload['remember'] ?? false) === true);
  logActivity($cfg, $userId, 'login', 'Přihlášení s 2FA');
  $destination = $payload['destination'] ?? '/account';
  if (!is_string($destination) || !str_starts_with($destination, '/') || str_starts_with($destination, '//')) $destination = '/account';
  // Cross-device: prefix podle users.language z DB.
  $langRow = _auth_find_one($cfg, 'users', ['id' => $userId], 'language');
  $lang = vv_locale_valid(($langRow['data']['language'] ?? null) ?: 'cs');
  vv_locale_cookie($lang);
  jsonOk(['redirect' => vv_locale_redirect_target($destination, $lang)]);
}
