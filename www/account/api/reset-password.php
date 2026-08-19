<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

$body     = jsonBody();
$rawToken = (string)($body['token']        ?? '');
$newPass  = (string)($body['new_password'] ?? '');

if (strlen($rawToken) !== 64) jsonErr('Neplatný nebo expirovaný odkaz.');
if (strlen($newPass)  < 8)   jsonErr('Heslo musí mít alespoň 8 znaků.', 422, 'new_password');

$tokenHash = hash('sha256', $rawToken);
$now       = date('Y-m-d\TH:i:s\Z');

// Find user with valid token
$base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/users';
$qs   = [
  'reset_token_hash=eq.'       . rawurlencode($tokenHash),
  'reset_token_expires_at=gt.' . rawurlencode($now),
  'select=id',
  'limit=1',
];
$headers = _sb_base_headers($cfg);
$ch = curl_init($base . '?' . implode('&', $qs));
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 10, CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]);
$raw  = curl_exec($ch);
$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$rows = json_decode((string)$raw, true);
if ($code !== 200 || empty($rows)) jsonErr('Neplatný nebo expirovaný odkaz.');

$userId  = $rows[0]['id'];
$newHash = password_hash($newPass, PASSWORD_BCRYPT);

sb_update($cfg, 'users', ['id' => $userId], [
  'password'               => $newHash,
  'reset_token_hash'       => null,
  'reset_token_expires_at' => null,
]);

// Revoke all sessions (force re-login everywhere)
sb_delete($cfg, 'sessions', ['user_id' => $userId]);

logActivity($cfg, $userId, 'password_change', 'Via password reset');
jsonOk(['ok' => true]);
