<?php
declare(strict_types=1);

require_once __DIR__ . '/lib.php';

[$cfg, $user] = quiz_api_bootstrap(true);
$body = jsonBody();
$errors = quiz_api_validate_milestone_payload($body);
if ($errors) jsonErr($errors[0], 422);
$userId = quiz_api_user_id($user);
$attempt = is_int($body['attempt'] ?? null) ? max(1, min(20, $body['attempt'])) : 1;
$verified = quiz_api_verify_milestone_submission((string) $body['milestone'], $body['answers'], $userId, $attempt);
if ($verified === null) jsonErr('Milník zatím nemá serverovou definici.', 409);
$reflection = $body['reflection'] ?? [];
if ((string)$body['milestone'] === 'final-6') {
  $reflectionErrors = quiz_api_validate_final_reflection($reflection);
  if ($reflectionErrors) jsonErr($reflectionErrors[0], 422);
  foreach (array_values($reflection) as $index=>$entry) {
    $questionId = 'reflection-' . ($index + 1); $existing = sb_find_one($cfg, 'edu_quiz_submission', ['user_id'=>$userId,'lesson_slug'=>'6-4-zaverecny-test','question_id'=>$questionId], 'id');
    if (isset($existing['error'])) jsonErr('Reflexi se nepodařilo uložit.', 503);
    if (!is_array($existing['data'] ?? null)) { $savedReflection = sb_insert($cfg, 'edu_quiz_submission', ['user_id'=>$userId,'lesson_slug'=>'6-4-zaverecny-test','question_id'=>$questionId,'kind'=>'open','body'=>trim($entry['text']),'self_rubric'=>['mode'=>'self','score'=>$entry['score'],'scale'=>5]]); if (isset($savedReflection['error'])) jsonErr('Reflexi se nepodařilo uložit.', 503); }
  }
}
$awarded = quiz_api_award_verified_milestone($cfg, $userId, (string) $body['milestone'], $verified['passed'], [
  'score_pct' => $verified['scorePct'],
  'question_count' => $verified['questionCount'],
]);
jsonOk(['passed' => $verified['passed'], 'score_pct' => $verified['scorePct'], 'badge_awarded' => $awarded]);
