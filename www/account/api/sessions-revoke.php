<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);
$user = requireAuth($cfg);
$body = jsonBody();

// Detekce aktuální relace přes token_hash — plaintext se nekompuaruje ani neodesílá.
$currentHash = '';
$newTok = $_COOKIE[VV_COOKIE] ?? null;
$legTok = $_COOKIE[COOKIE_NAME] ?? null;
if (is_string($newTok) && preg_match('/\A[0-9a-f]{64}\z/iD', $newTok) === 1) {
  $currentHash = hash('sha256', $newTok);
} elseif (is_string($legTok) && preg_match('/\A[0-9a-f]{64}\z/iD', $legTok) === 1) {
  $currentHash = hash('sha256', $legTok);
}

$revokedAt = gmdate('Y-m-d\TH:i:s\Z');
$now       = gmdate('Y-m-d\TH:i:s\Z');

if (!empty($body['all_others'])) {
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/sessions';
  $qs   = 'user_id=eq.'    . rawurlencode($user['id'])
        . '&revoked_at=is.null'
        . '&expires_at=gt.' . rawurlencode($now);
  if ($currentHash !== '') {
    $qs .= '&token_hash=neq.' . rawurlencode($currentHash);
  }
  $patch   = json_encode(['revoked_at' => $revokedAt, 'revoked_reason' => 'revoke_others']);
  $headers = array_merge(_sb_base_headers($cfg), ['Prefer: return=minimal']);
  $ch = curl_init($base . '?' . $qs);
  curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => 'PATCH', CURLOPT_POSTFIELDS => $patch,
    CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 10, CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
  $raw = curl_exec($ch); $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  if ($raw === false || $status < 200 || $status >= 300) jsonErr('Relace se nepodařilo ukončit.', 500);
  logActivity($cfg, $user['id'], 'session_revoke', 'All other sessions');
  jsonOk(['ok' => true]);
}

$sessionId = (string) ($body['session_id'] ?? '');
if ($sessionId === '') jsonErr('session_id required.');

$res = sb_find_one($cfg, 'sessions', ['id' => $sessionId],
  'user_id,token_hash,revoked_at,expires_at');
if (!isset($res['data']) || $res['data'] === null) jsonErr('Relace nenalezena.', 404);
$s = $res['data'];
if ($s['user_id'] !== $user['id']) jsonErr('Forbidden', 403);
if (($s['revoked_at'] ?? null) !== null) jsonErr('Relace již byla odvolána.', 409);
if ($currentHash !== '' && hash_equals($currentHash, (string) ($s['token_hash'] ?? ''))) {
  jsonErr('Nemůžete zrušit aktuální relaci — použijte odhlášení.', 422);
}

$result = _auth_update($cfg, 'sessions', ['id' => $sessionId], [
  'revoked_at'     => $revokedAt,
  'revoked_reason' => 'user_revoke',
]);
if (isset($result['error'])) jsonErr('Relace se nepodařilo ukončit.', 500);

logActivity($cfg, $user['id'], 'session_revoke', 'Session ' . substr($sessionId, 0, 8));
jsonOk(['ok' => true]);
