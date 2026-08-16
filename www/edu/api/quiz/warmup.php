<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/evaluator.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
  [$cfg, $user] = quiz_api_bootstrap(); $userId = quiz_api_user_id($user); $lesson = $_GET['lesson_slug'] ?? '';
  if (!is_string($lesson) || quiz_api_lesson_path($lesson) === null) jsonErr('Neplatná lekce.', 422);
  $attempts = sb_get($cfg, 'edu_quiz_attempt', ['user_id' => $userId, 'course' => QUIZ_COURSE], 'question_id,is_correct,created_at', 300);
  $reviews = sb_get($cfg, 'edu_quiz_review_queue', ['user_id' => $userId], 'question_id,due_at,last_result', 300);
  if (isset($attempts['error']) || isset($reviews['error'])) jsonErr('Rozcvičku se nepodařilo připravit.', 503);
  jsonOk(['questions' => quiz_api_warmup_questions($lesson, $userId, $attempts['data'] ?? [], $reviews['data'] ?? [])]);
}
if ($method !== 'POST') { header('Allow: GET, POST'); jsonErr('Method not allowed', 405); }
[$cfg, $user] = quiz_api_bootstrap(true); $userId = quiz_api_user_id($user); $body = jsonBody();
$lesson = $body['lesson_slug'] ?? ''; $answers = $body['answers'] ?? null; $uuid = $body['client_attempt_uuid'] ?? '';
if (!is_string($lesson) || !is_array($answers) || !is_string($uuid) || preg_match('/^[0-9a-f-]{36}$/i', $uuid) !== 1) jsonErr('Neplatná rozcvička.', 422);
$attempts = sb_get($cfg, 'edu_quiz_attempt', ['user_id' => $userId, 'course' => QUIZ_COURSE], 'question_id,is_correct,created_at', 300);
$reviews = sb_get($cfg, 'edu_quiz_review_queue', ['user_id' => $userId], 'question_id,due_at,last_result', 300);
if (isset($attempts['error']) || isset($reviews['error'])) jsonErr('Rozcvičku se nepodařilo ověřit.', 503);
$questions = quiz_api_warmup_questions($lesson, $userId, $attempts['data'] ?? [], $reviews['data'] ?? []); if (count($questions) < 2) jsonErr('Rozcvička nemá dost kandidátů.', 409);
$correct = 0;
foreach ($questions as $question) {
  $answer = $answers[$question['id']] ?? null; if (!is_array($answer)) jsonErr('Chybí odpověď rozcvičky.', 422);
  $result = quiz_evaluate_question($answer, $question); if (($result['valid'] ?? false) !== true) jsonErr('Neplatná odpověď rozcvičky.', 422);
  if (($result['correct'] ?? false) === true) $correct++;
  quiz_api_update_review_queue($cfg, $userId, $question['id'], ($result['correct'] ?? false) === true);
}
$score = (int)round(100 * $correct / count($questions)); $award = $correct === count($questions) ? QUIZ_XP['warmup'] : 0;
$saved = sb_rpc($cfg, 'record_edu_quiz_attempt', ['p_user_id'=>$userId,'p_course'=>QUIZ_COURSE,'p_lesson_slug'=>$lesson,'p_question_id'=>'warmup-'.$lesson,'p_client_attempt_uuid'=>$uuid,'p_is_correct'=>null,'p_score_pct'=>$score,'p_payload_answer'=>$answers,'p_wager_xp'=>0,'p_xp_candidate'=>$award,'p_duration_ms'=>null,'p_difficulty'=>'both']);
if (isset($saved['error']) || !isset($saved['data'][0])) jsonErr('Rozcvičku se nepodařilo uložit.', 503);
jsonOk(['score_pct'=>$score,'xp_awarded'=>(int)($saved['data'][0]['xp_awarded'] ?? 0),'duplicate'=>(bool)($saved['data'][0]['duplicate'] ?? false)]);
