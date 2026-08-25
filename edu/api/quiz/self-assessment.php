<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
  [$cfg, $user] = quiz_api_bootstrap(); $rows = sb_get($cfg, 'edu_quiz_submission', ['user_id'=>quiz_api_user_id($user), 'lesson_slug'=>'1-1-co-je-ai', 'question_id'=>'entry-self-assessment'], 'body,created_at', 100);
  if (isset($rows['error'])) jsonErr('Vstupní odhad se nepodařilo načíst.', 503);
  $data = $rows['data'] ?? []; usort($data, static fn(array $a,array $b): int => strcmp((string)($b['created_at'] ?? ''), (string)($a['created_at'] ?? '')));
  jsonOk(['estimate' => isset($data[0]['body']) ? (int)$data[0]['body'] : null]);
}
if ($method !== 'POST') { header('Allow: GET, POST'); jsonErr('Method not allowed', 405); }
[$cfg, $user] = quiz_api_bootstrap(true); $body = jsonBody(); $estimate = $body['estimate'] ?? null;
if (!is_int($estimate) || $estimate < 0 || $estimate > 8) jsonErr('Odhad musí být od 0 do 8.', 422);
$saved = sb_insert($cfg, 'edu_quiz_submission', ['user_id'=>quiz_api_user_id($user),'lesson_slug'=>'1-1-co-je-ai','question_id'=>'entry-self-assessment','kind'=>'open','body'=>(string)$estimate,'self_rubric'=>['scale'=>8]]);
if (isset($saved['error'])) jsonErr('Vstupní odhad se nepodařilo uložit.', 503);
jsonOk(['estimate'=>$estimate], 201);
