<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
  [$cfg, $user] = quiz_api_bootstrap(); $userId = quiz_api_user_id($user);
  $profile = sb_find_one($cfg, 'edu_quiz_profile', ['user_id' => $userId], 'difficulty,updated_at');
  if (isset($profile['error'])) jsonErr('Profil se nepodařilo načíst.', 503);
  jsonOk(['difficulty' => $profile['data']['difficulty'] ?? 'junior']);
}
[$cfg, $user] = quiz_api_bootstrap(true); $body = jsonBody(); $difficulty = $body['difficulty'] ?? null;
if (!in_array($difficulty, ['junior', 'pro'], true)) jsonErr('Neplatná obtížnost.', 422);
$userId = quiz_api_user_id($user); $row = ['user_id' => $userId, 'difficulty' => $difficulty, 'updated_at' => quiz_api_iso_now()];
$existing = sb_find_one($cfg, 'edu_quiz_profile', ['user_id' => $userId], 'user_id');
if (isset($existing['error'])) jsonErr('Profil se nepodařilo uložit.', 503);
$saved = is_array($existing['data'] ?? null) ? sb_update($cfg, 'edu_quiz_profile', ['user_id' => $userId], $row) : sb_insert($cfg, 'edu_quiz_profile', $row);
if (isset($saved['error'])) jsonErr('Profil se nepodařilo uložit.', 503);
jsonOk(['difficulty' => $difficulty]);
