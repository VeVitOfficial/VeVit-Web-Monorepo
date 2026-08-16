<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
$user = requireAuth($cfg);

$res = sb_get($cfg, 'premium_subscriptions',
  ['user_id' => $user['id']],
  'id,tier,billing_cycle,price,started_at,expires_at,auto_renew,payment_method,payment_id,status',
  50
);
$rows = $res['data'] ?? [];

usort($rows, fn($a, $b) => strcmp($b['started_at'], $a['started_at']));

$active  = null;
$history = [];
foreach ($rows as $r) {
  if ($r['status'] === 'active' && $active === null) {
    $active = $r;
    if (!empty($active['payment_id']) && strlen($active['payment_id']) > 4) {
      $active['payment_id_last4'] = substr($active['payment_id'], -4);
      unset($active['payment_id']);
    }
  } else {
    if (!empty($r['payment_id']) && strlen($r['payment_id']) > 4) {
      $r['payment_id_last4'] = substr($r['payment_id'], -4);
      unset($r['payment_id']);
    }
    $history[] = $r;
  }
}

$price = null;
if ($active) {
  $priceRes = sb_get($cfg, 'tier_prices',
    ['tier' => $active['tier'], 'billing_cycle' => $active['billing_cycle']],
    'price_czk', 1
  );
  $price = $priceRes['data'][0] ?? null;
}

jsonOk(['subscription' => $active, 'price' => $price, 'history' => $history]);
