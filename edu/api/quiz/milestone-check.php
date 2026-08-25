<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php'; require_once __DIR__ . '/evaluator.php';
[$cfg, $user] = quiz_api_bootstrap(true); $userId = quiz_api_user_id($user); $body = jsonBody();
$milestone = $body['milestone'] ?? ''; $questionId = $body['question_id'] ?? ''; $answer = $body['answer'] ?? null; $attempt = $body['attempt'] ?? 1;
if (!is_string($milestone) || !is_string($questionId) || !is_array($answer) || !is_int($attempt) || !quiz_api_milestone_allows_question($milestone, $userId, $questionId, $attempt)) jsonErr('Otázka do tohoto milníku nepatří.', 422);
$chapter = (int)$questionId[0]; $question = quiz_api_find_question_in_chapter($chapter, $questionId); if ($question === null) jsonErr('Otázka neexistuje.', 404);
$result = quiz_evaluate_question($answer, $question); if (($result['valid'] ?? false) !== true) jsonErr((string)($result['detail']['error'] ?? 'Neplatná odpověď.'), 422);
jsonOk(['result'=>$result,'why'=>$question['why'] ?? '']);
