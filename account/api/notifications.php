<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg    = auth_load_config();
beginJson($cfg);
$user   = requireAuth($cfg);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $res = sb_find_one($cfg, 'user_notification_prefs', ['user_id' => $user['id']], '*');
  if (isset($res['error']) && $res['error'] !== 'not_found') jsonErr('Chyba serveru.', 500);
  $prefs = $res['data'] ?? [
    'security_alerts' => true,
    'product_updates' => true,
    'marketing'       => false,
    'billing_summary' => true,
  ];
  jsonOk(['prefs' => $prefs]);
}

if ($method === 'PATCH' || $method === 'POST') {
  $body    = jsonBody();
  $allowed = ['product_updates', 'marketing', 'billing_summary'];
  $patch   = ['user_id' => $user['id']];
  foreach ($allowed as $k) {
    if (array_key_exists($k, $body)) $patch[$k] = (bool)$body[$k];
  }
  $existing = sb_find_one($cfg, 'user_notification_prefs', ['user_id' => $user['id']], 'user_id');
  if (($existing['data'] ?? null) === null) {
    $defaults = ['security_alerts' => true, 'product_updates' => true, 'marketing' => false, 'billing_summary' => true];
    $res = sb_insert($cfg, 'user_notification_prefs', array_merge($defaults, $patch));
  } else {
    $res = sb_update($cfg, 'user_notification_prefs', ['user_id' => $user['id']], $patch);
  }
  if (isset($res['error'])) jsonErr('Uložení selhalo.', 500);
  jsonOk(['ok' => true]);
}

jsonErr('Method not allowed', 405);
