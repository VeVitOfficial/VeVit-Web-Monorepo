<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

[$cfg, $user] = quiz_api_bootstrap(true);
$body = jsonBody();
$kind = $body['kind'] ?? null;
$lesson = $body['lesson_slug'] ?? null;
$question = $body['question_id'] ?? null;
$text = $body['body'] ?? null;
if (!in_array($kind, ['open', 'prompt_lab'], true) || !is_string($lesson) || !is_string($question) || !is_string($text) || preg_match('/^[1-6]-[0-9]+-q[0-9]+$/', $question) !== 1) jsonErr('Neplatné odevzdání.', 422);
$sourceQuestion = quiz_api_find_question($lesson, $question);
$expectedKind = ($sourceQuestion['type'] ?? null) === 'prompt_lab' ? 'prompt_lab' : (($sourceQuestion['type'] ?? null) === 'open_rubric' ? 'open' : null);
if ($expectedKind === null || $kind !== $expectedKind) jsonErr('Otázka nepřijímá textové odevzdání.', 422);
$text = trim($text);
$length = function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text);
if ($text === '' || $length > 12000) jsonErr('Text odevzdání má neplatnou délku.', 422);
$rubric = is_array($sourceQuestion['payload']['rubric'] ?? null) ? array_values($sourceQuestion['payload']['rubric']) : [];
$selfRubric = is_array($body['self_rubric'] ?? null) ? $body['self_rubric'] : [];
$scores = is_array($selfRubric['scores'] ?? null) ? array_values($selfRubric['scores']) : [];
$validScores = count($rubric) > 0 && count($scores) === count($rubric);
foreach ($scores as $score) if (!is_int($score) || $score < 0 || $score > 5) $validScores = false;
if (!$validScores) jsonErr('Vyplň sebehodnocení 0–5 u všech kritérií.', 422);
$existing = sb_find_one($cfg, 'edu_quiz_submission', ['user_id'=>quiz_api_user_id($user),'lesson_slug'=>$lesson,'question_id'=>$question], 'id,kind,body,self_rubric,status,created_at');
if (isset($existing['error'])) jsonErr('Odevzdání se nepodařilo ověřit.', 503);
if (is_array($existing['data'] ?? null)) jsonOk(['submission'=>$existing['data'],'duplicate'=>true]);
$result = sb_insert($cfg, 'edu_quiz_submission', [
  'user_id' => quiz_api_user_id($user), 'lesson_slug' => $lesson, 'question_id' => $question,
  'kind' => $kind, 'body' => $text, 'self_rubric' => $selfRubric,
]);
if (isset($result['error'])) jsonErr('Odevzdání se nepodařilo uložit.', 503);
jsonOk(['submission' => $result['data'], 'duplicate'=>false], 201);
