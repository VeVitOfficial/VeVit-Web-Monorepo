<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
$user = requireAuth($cfg);

$currentToken = $_COOKIE[COOKIE_NAME] ?? '';
$now = gmdate('Y-m-d\TH:i:s\Z');

$res = sb_get($cfg, 'sessions',
  ['user_id' => $user['id']],
  'id,session_token,created_at,expires_at,ip_address,user_agent,last_seen_at'
);
if (isset($res['error'])) jsonErr('Chyba načítání relací.', 500);

$rows = array_filter($res['data'] ?? [], fn($s) => $s['expires_at'] > $now);
$rows = array_map(function ($s) use ($currentToken) {
  return [
    'id'         => $s['id'],
    'created_at' => $s['created_at'],
    'expires_at' => $s['expires_at'],
    'last_seen_at' => $s['last_seen_at'] ?? $s['created_at'],
    'ip_address' => session_mask_ip((string) ($s['ip_address'] ?? '')),
    'device' => session_device_label((string) ($s['user_agent'] ?? '')),
    'is_current' => $s['session_token'] === $currentToken,
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
