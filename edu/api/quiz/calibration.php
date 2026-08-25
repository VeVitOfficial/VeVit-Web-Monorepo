<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/evaluator.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') { header('Allow: GET'); jsonErr('Method not allowed', 405); }
[$cfg, $user] = quiz_api_bootstrap(); $userId = quiz_api_user_id($user);
$attempts = sb_get($cfg, 'edu_quiz_attempt', ['user_id' => $userId, 'course' => QUIZ_COURSE, 'lesson_slug' => '6-1-kriticke-mysleni', 'question_id' => '6-1-q3'], 'payload_answer,created_at', 100);
if (isset($attempts['error'])) jsonErr('Kalibrační data se nepodařilo načíst.', 503);
$question = quiz_api_find_question('6-1-kriticke-mysleni', '6-1-q3'); $rounds = [];
if ($question !== null) foreach (($attempts['data'] ?? []) as $attempt) {
  $answer = is_array($attempt['payload_answer'] ?? null) ? $attempt['payload_answer'] : [];
  $evaluation = quiz_evaluate_question($answer, $question);
  foreach (($evaluation['detail']['rounds'] ?? []) as $round) $rounds[] = ['stake' => (int)($round['stake'] ?? 0), 'correct' => ($round['correct'] ?? false) === true];
}
jsonOk(quiz_api_calibration_summary($rounds));
