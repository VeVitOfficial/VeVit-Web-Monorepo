<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

[$cfg, $user] = quiz_api_bootstrap(true);
$userId = quiz_api_user_id($user); $body = jsonBody(); $ids = $body['question_ids'] ?? null;
if (!is_array($ids) || $ids === [] || count($ids) > 5) jsonErr('Vyber jednu až pět otázek.', 422);
$ids = array_values(array_unique($ids));
try {
  foreach ($ids as $questionId) {
    if (!is_string($questionId) || preg_match('/^[1-6]-[0-9]+-q[0-9]+$/', $questionId) !== 1 || quiz_api_find_question_in_chapter((int)$questionId[0], $questionId) === null) jsonErr('Neplatná otázka k opakování.', 422);
    quiz_api_schedule_review_now($cfg, $userId, $questionId);
  }
} catch (RuntimeException) { jsonErr('Opakování se nepodařilo naplánovat.', 503); }
jsonOk(['scheduled'=>$ids]);
