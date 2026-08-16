<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); jsonErr('Method not allowed', 405); }
$user = requireAuth($cfg);
$uid  = $user['id'];

function fetchTable(array $cfg, string $table, string $uid, string $columns): array {
  $res = sb_get($cfg, $table, ['user_id' => $uid], $columns, 1000);
  return $res['data'] ?? [];
}

$tables = [
  'premium_subscriptions' => '*', 'cal_events' => '*', 'cal_reminders' => '*',
  'certificates' => '*', 'lesson_comments' => '*', 'games_stats' => '*',
  'store_orders' => '*', 'daily_bonus_log' => '*', 'ai_usage_log' => '*',
  'sessions' => 'id,created_at,expires_at,remember,ip_address,user_agent,last_seen_at',
  'account_activity' => 'kind,detail,created_at',
  'user_notification_prefs' => 'security_alerts,product_updates,marketing,billing_summary',
  'oauth_identities' => 'provider,provider_user_id,provider_email,created_at,updated_at',
  'user_preferences' => 'timezone,date_format,week_starts_on,region,updated_at',
];

$export = ['user' => $user, 'exported_at' => date('c')];
foreach ($tables as $t => $columns) {
  $export[$t] = fetchTable($cfg, $t, $uid, $columns);
}

header('Content-Type: application/json');
header('Content-Disposition: attachment; filename="vevit-export-' . date('Y-m-d') . '.json"');
exit(json_encode($export, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
