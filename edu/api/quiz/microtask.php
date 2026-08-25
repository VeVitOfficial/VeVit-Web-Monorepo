<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

[$cfg, $user] = quiz_api_bootstrap(true);
$userId = quiz_api_user_id($user); $body = jsonBody();
$lessonSlug = $body['lesson_slug'] ?? null; $uuid = $body['client_attempt_uuid'] ?? null; $text = trim((string)($body['text'] ?? ''));
if (!is_string($lessonSlug) || !is_string($uuid) || preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $uuid) !== 1) jsonErr('Neplatný mikro-úkol.', 422);
$path = quiz_api_lesson_path($lessonSlug); $raw = $path === null ? false : @file_get_contents($path);
try { $lesson = $raw === false ? null : json_decode($raw, true, 512, JSON_THROW_ON_ERROR); } catch (JsonException) { $lesson = null; }
if (!is_array($lesson) || !is_array($lesson['microtask'] ?? null) || ($lesson['microtask']['proof'] ?? null) !== 'text') jsonErr('Mikro-úkol v lekci neexistuje.', 404);
$length = function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text);
if ($text === '' || $length > 12000) jsonErr('Doplň krátký důkaz splnění mikro-úkolu.', 422);
$saved = sb_rpc($cfg, 'record_edu_quiz_attempt', [
  'p_user_id'=>$userId,'p_course'=>QUIZ_COURSE,'p_lesson_slug'=>$lessonSlug,'p_question_id'=>'microtask-'.$lessonSlug,
  'p_client_attempt_uuid'=>$uuid,'p_is_correct'=>null,'p_score_pct'=>100,'p_payload_answer'=>['text'=>$text,'confirmed'=>true],
  'p_wager_xp'=>0,'p_xp_candidate'=>QUIZ_XP['microtask'],'p_duration_ms'=>null,'p_difficulty'=>'both',
]);
if (isset($saved['error']) || !is_array($saved['data'] ?? null) || !isset($saved['data'][0])) jsonErr('Mikro-úkol se nepodařilo uložit.', 503);
$record = $saved['data'][0];
$duplicate = (bool)($record['duplicate'] ?? false);
if ($duplicate) {
  $original = sb_find_one($cfg, 'edu_quiz_attempt', ['user_id'=>$userId,'client_attempt_uuid'=>$uuid], 'payload_answer');
  if (isset($original['error']) || !is_array($original['data']['payload_answer'] ?? null)) jsonErr('Duplicitní mikro-úkol se nepodařilo načíst.', 503);
  $text = trim((string)($original['data']['payload_answer']['text'] ?? ''));
}
$existing = sb_find_one($cfg, 'edu_quiz_submission', ['user_id'=>$userId,'lesson_slug'=>$lessonSlug,'question_id'=>'microtask'], 'id');
if (isset($existing['error'])) jsonErr('XP bylo uloženo, ale důkaz se nepodařilo ověřit.', 503);
if (!is_array($existing['data'] ?? null)) {
  $submission = sb_insert($cfg, 'edu_quiz_submission', ['user_id'=>$userId,'lesson_slug'=>$lessonSlug,'question_id'=>'microtask','kind'=>'microtask','body'=>$text,'self_rubric'=>[]]);
  if (isset($submission['error'])) jsonErr('XP bylo uloženo, ale důkaz se nepodařilo uložit.', 503);
}
jsonOk(['duplicate'=>$duplicate,'xp_awarded'=>(int)($record['xp_awarded'] ?? 0),'state'=>['xp_total'=>(int)($record['lesson_xp_total'] ?? 0)]]);
