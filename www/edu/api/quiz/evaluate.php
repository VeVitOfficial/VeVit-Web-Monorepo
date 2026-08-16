<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/evaluator.php';

[$cfg, $user] = quiz_api_bootstrap(true);
$body = jsonBody();
$errors = quiz_api_validate_attempt_payload($body);
if ($errors) jsonErr($errors[0], 422);
$userId = quiz_api_user_id($user);

$question = quiz_api_find_question($body['lesson_slug'], $body['question_id']);
if ($question === null) jsonErr('Otázka v obsahu neexistuje.', 404);
$previousQuestionAttempts = sb_get($cfg, 'edu_quiz_attempt', ['user_id'=>$userId,'course'=>QUIZ_COURSE,'question_id'=>$body['question_id']], 'client_attempt_uuid', 2);
if (isset($previousQuestionAttempts['error'])) jsonErr('Pokus se nepodařilo ověřit.', 503);
$isFirstQuestionAttempt = count($previousQuestionAttempts['data'] ?? []) === 0;
$result = quiz_evaluate_question($body['answer'], $question);
if (($result['valid'] ?? false) !== true) jsonErr((string)($result['detail']['error'] ?? 'Neplatná odpověď.'), 422);

$isCorrect = $result['correct'];
$baseXp = quiz_api_xp_for_question($question);
$wager = max(-30, min(30, (int)($result['detail']['wagerXp'] ?? 0)));
$xpCandidate = ($question['type'] ?? '') === 'wager' ? $wager + ($isCorrect === true ? $baseXp : 0) : ($isCorrect === false ? 0 : $baseXp);
$saved = sb_rpc($cfg, 'record_edu_quiz_attempt', [
  'p_user_id' => $userId, 'p_course' => QUIZ_COURSE, 'p_lesson_slug' => $body['lesson_slug'],
  'p_question_id' => $body['question_id'], 'p_client_attempt_uuid' => $body['client_attempt_uuid'],
  'p_is_correct' => $isCorrect, 'p_score_pct' => $result['scorePct'], 'p_payload_answer' => $body['answer'],
  'p_wager_xp' => $wager, 'p_xp_candidate' => $xpCandidate, 'p_duration_ms' => $body['duration_ms'] ?? null,
  'p_difficulty' => $body['difficulty'] ?? 'both',
]);
if (isset($saved['error']) || !is_array($saved['data'] ?? null) || !isset($saved['data'][0])) jsonErr('Pokus se nepodařilo uložit.', 503);
$record = $saved['data'][0];
$duplicate = (bool)($record['duplicate'] ?? false);
$answerForSubmission = $body['answer']; $responseResult = $result;
if ($duplicate) {
  $original = sb_find_one($cfg, 'edu_quiz_attempt', ['user_id'=>$userId,'client_attempt_uuid'=>$body['client_attempt_uuid']], 'payload_answer');
  if (isset($original['error']) || !is_array($original['data']['payload_answer'] ?? null)) jsonErr('Duplicitní pokus se nepodařilo načíst.', 503);
  $answerForSubmission = $original['data']['payload_answer']; $responseResult = quiz_evaluate_question($answerForSubmission, $question);
}
$streakRpc = sb_rpc($cfg, 'record_edu_quiz_lesson_streak', ['p_user_id'=>$userId,'p_course'=>QUIZ_COURSE,'p_lesson_slug'=>$body['lesson_slug']]);
$streakData = $streakRpc['data'] ?? 0;
if (is_array($streakData)) $streakData = $streakData[0]['record_edu_quiz_lesson_streak'] ?? $streakData[0] ?? 0;
$lessonStreak = isset($streakRpc['error']) ? 0 : (int)$streakData;
$submissionKind = match ($question['type'] ?? '') { 'prompt_lab' => 'prompt_lab', 'open_rubric' => 'open', 'microtask' => 'microtask', default => null };
if ($submissionKind !== null) {
  $submissionText = trim((string)($answerForSubmission['text'] ?? ''));
  if ($submissionText !== '') {
    $existingSubmission = sb_find_one($cfg, 'edu_quiz_submission', ['user_id'=>$userId,'lesson_slug'=>$body['lesson_slug'],'question_id'=>$body['question_id']], 'id');
    if (isset($existingSubmission['error'])) jsonErr('Pokus byl uložen, ale text odpovědi se nepodařilo ověřit.', 503);
    if (!is_array($existingSubmission['data'] ?? null)) {
      $selfRubric = is_array($responseResult['detail']['selfScores'] ?? null) ? ['scores'=>$responseResult['detail']['selfScores'],'score_pct'=>$responseResult['detail']['selfScorePct'] ?? null] : [];
      $storedSubmission = sb_insert($cfg, 'edu_quiz_submission', ['user_id'=>$userId,'lesson_slug'=>$body['lesson_slug'],'question_id'=>$body['question_id'],'kind'=>$submissionKind,'body'=>$submissionText,'self_rubric'=>$selfRubric]);
      if (isset($storedSubmission['error'])) jsonErr('Pokus byl uložen, ale text odpovědi se nepodařilo uložit.', 503);
    }
  }
}
if (!$duplicate && is_bool($isCorrect)) {
  try {
    quiz_api_update_review_queue($cfg, $userId, $body['question_id'], $isCorrect);
    $badgeMeta = ['question_id'=>$body['question_id'], 'lesson_slug'=>$body['lesson_slug']];
    if ($question['type'] === 'hallucination_hunt' && $isCorrect === true && $isFirstQuestionAttempt) quiz_api_award_badge($cfg, $userId, 'detektiv-halucinaci', $badgeMeta);
    if ($question['type'] === 'prompt_lab' && (float)($result['scorePct'] ?? 0) >= 100 && str_word_count((string)($body['answer']['text'] ?? '')) < 30) quiz_api_award_badge($cfg, $userId, 'tokenovy-lakomec', $badgeMeta);
    if ($body['lesson_slug'] === '6-1-kriticke-mysleni' && $body['question_id'] === '6-1-q3' && is_array($result['detail']['rounds'] ?? null)) {
      $history = sb_get($cfg, 'edu_quiz_attempt', ['user_id'=>$userId,'course'=>QUIZ_COURSE,'lesson_slug'=>'6-1-kriticke-mysleni','question_id'=>'6-1-q3'], 'payload_answer,created_at', 100);
      if (isset($history['error'])) throw new RuntimeException('Calibration unavailable');
      $rounds = [];
      foreach ($history['data'] ?? [] as $attempt) { $checked = quiz_evaluate_question(is_array($attempt['payload_answer'] ?? null) ? $attempt['payload_answer'] : [], $question); foreach ($checked['detail']['rounds'] ?? [] as $round) $rounds[] = ['stake'=>(int)($round['stake'] ?? 0),'correct'=>($round['correct'] ?? false) === true]; }
      $calibration = quiz_api_calibration_summary($rounds);
      $calibrationBadge = quiz_api_badge_for_calibration($calibration);
      if ($calibrationBadge !== null) quiz_api_award_badge($cfg, $userId, $calibrationBadge, ['question_id' => $body['question_id'], 'lesson_slug'=>$body['lesson_slug'], 'mean_absolute_error_pct' => $calibration['mean_absolute_error_pct']]);
    }
  } catch (RuntimeException) { jsonErr('Pokus byl uložen, ale opakování se nepodařilo připravit.', 503); }
}
jsonOk(['duplicate' => $duplicate, 'result' => $responseResult, 'xp_awarded' => (int)($record['xp_awarded'] ?? 0), 'state' => ['xp_total' => (int)($record['lesson_xp_total'] ?? 0), 'best_score_pct' => (float)($record['best_score_pct'] ?? 0), 'streak'=>$lessonStreak, 'multiplier'=>$lessonStreak >= 3 ? 1.25 : 1]]);
