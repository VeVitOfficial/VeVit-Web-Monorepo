<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/account/lib/auth-helpers.php';
$cfg = auth_load_config(); $user = requireAuth($cfg); $userId = $user['id'] ?? '';
$badge = is_string($userId) && $userId !== '' ? sb_find_one($cfg, 'edu_quiz_badge', ['user_id'=>$userId,'badge_key'=>'skeptik-s-certifikatem'], 'awarded_at,meta') : ['error'=>'identity'];
if (isset($badge['error'])) { http_response_code(503); header('Content-Type: text/plain; charset=utf-8'); echo 'Certifikát je dočasně nedostupný.'; exit; }
if (!is_array($badge['data'] ?? null)) { http_response_code(403); header('Content-Type: text/plain; charset=utf-8'); echo 'Certifikát bude dostupný po úspěšném závěrečném testu.'; exit; }
$name = (string)($user['nickname'] ?? $user['name'] ?? 'Uživatel VeVit'); $awarded = (string)($badge['data']['awarded_at'] ?? gmdate('c'));
header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: no-store, private'); header('X-Content-Type-Options: nosniff');
?><!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certifikát AI gramotnosti</title><link rel="stylesheet" href="styles.css"></head><body><main class="container"><article class="card quiz-certificate"><p>VeVit Edu</p><h1>Certifikát AI gramotnosti</h1><p>Potvrzujeme, že</p><h2><?= htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h2><p>úspěšně dokončil(a) závěrečný test kurzu AI gramotnost a získal(a) odznak Skeptik s certifikátem.</p><p>Vydáno <?= htmlspecialchars(substr($awarded, 0, 10), ENT_QUOTES, 'UTF-8') ?></p><p><a class="btn btn-primary" href="/edu/ai-gramotnost/#course">Zpět do kurzu</a></p></article></main></body></html>
