<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);
$user = requireAuth($cfg);
$body = jsonBody();

$currentToken = $_COOKIE[COOKIE_NAME] ?? '';

if (!empty($body['all_others'])) {
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/sessions';
  $qs   = [
    'user_id=eq.'        . rawurlencode($user['id']),
    'session_token=neq.' . rawurlencode($currentToken),
  ];
  $headers = _sb_base_headers($cfg);
  $ch = curl_init($base . '?' . implode('&', $qs));
  curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => 'DELETE', CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
  $raw = curl_exec($ch); $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  if ($raw === false || $status < 200 || $status >= 300) jsonErr('Relace se nepodařilo ukončit.', 500);
  logActivity($cfg, $user['id'], 'session_revoke', 'All other sessions');
  jsonOk(['ok' => true]);
}

$sessionId = (string)($body['session_id'] ?? '');
if (!$sessionId) jsonErr('session_id required.');

$res = sb_find_one($cfg, 'sessions', ['id' => $sessionId], 'user_id,session_token');
if (!isset($res['data']) || $res['data'] === null) jsonErr('Relace nenalezena.', 404);
if ($res['data']['user_id'] !== $user['id']) jsonErr('Forbidden', 403);
if ($res['data']['session_token'] === $currentToken) jsonErr('Nemůžete zrušit aktuální relaci.', 422);

sb_delete($cfg, 'sessions', ['id' => $sessionId]);
logActivity($cfg, $user['id'], 'session_revoke', 'Session ' . substr($sessionId, 0, 8));
jsonOk(['ok' => true]);
