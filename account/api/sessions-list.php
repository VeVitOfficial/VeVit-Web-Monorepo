<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
$user = requireAuth($cfg);

// Detekce aktuální relace přes token_hash — plaintext token se nikdy neodesílá do klienta.
$currentHash = '';
$newTok = $_COOKIE[VV_COOKIE] ?? null;
$legTok = $_COOKIE[COOKIE_NAME] ?? null;
if (is_string($newTok) && preg_match('/\A[0-9a-f]{64}\z/iD', $newTok) === 1) {
  $currentHash = hash('sha256', $newTok);
} elseif (is_string($legTok) && preg_match('/\A[0-9a-f]{64}\z/iD', $legTok) === 1) {
  $currentHash = hash('sha256', $legTok);
}

$now = gmdate('Y-m-d\TH:i:s\Z');
$res = sb_get($cfg, 'sessions',
  ['user_id' => $user['id']],
  'id,token_hash,created_at,expires_at,ip_address,user_agent,last_seen_at,revoked_at'
);
if (isset($res['error'])) jsonErr('Chyba načítání relací.', 500);

$rows = array_filter($res['data'] ?? [], fn($s) =>
  $s['expires_at'] > $now && ($s['revoked_at'] ?? null) === null
);
$rows = array_map(function ($s) use ($currentHash) {
  return [
    'id'          => $s['id'],
    'created_at'  => $s['created_at'],
    'expires_at'  => $s['expires_at'],
    'last_seen_at'=> $s['last_seen_at'] ?? $s['created_at'],
    'ip_address'  => session_mask_ip((string) ($s['ip_address'] ?? '')),
    'device'      => session_device_label((string) ($s['user_agent'] ?? '')),
    'is_current'  => $currentHash !== '' && hash_equals($currentHash, (string) ($s['token_hash'] ?? '')),
  ];
}, array_values($rows));

jsonOk(['sessions' => $rows, 'count' => count($rows)]);

function session_mask_ip(string $ip): string {
  if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
    $parts = explode('.', $ip); return $parts[0] . '.' . $parts[1] . '.*.*';
  }
  if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) return substr($ip, 0, 6) . '…';
  return 'Neuvedeno';
}
function session_device_label(string $agent): string {
  if (str_contains($agent, 'Firefox')) return 'Firefox';
  if (str_contains($agent, 'Edg/')) return 'Edge';
  if (str_contains($agent, 'Chrome')) return 'Chrome';
  if (str_contains($agent, 'Safari')) return 'Safari';
  return 'Webové zařízení';
}
