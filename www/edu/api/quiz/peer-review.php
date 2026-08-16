<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
  [$cfg, $user] = quiz_api_bootstrap(); $userId = quiz_api_user_id($user);
  $result = sb_rpc($cfg, 'get_edu_quiz_peer_review_candidates', ['p_reviewer_id'=>$userId,'p_limit'=>2]);
  if (isset($result['error'])) jsonErr('Peer review se nepodařilo načíst.', 503);
  $reviews = [];
  foreach ($result['data'] ?? [] as $row) {
    if (!is_array($row) || !is_string($row['question_id'] ?? null) || preg_match('/^[1-6]-[0-9]+-q[0-9]+$/', $row['question_id']) !== 1) continue;
    $question = quiz_api_find_question_in_chapter((int)$row['question_id'][0], $row['question_id']);
    $rubric = is_array($question['payload']['rubric'] ?? null) ? array_values($question['payload']['rubric']) : [];
    if ($rubric === []) continue;
    $reviews[] = ['submission_id'=>$row['submission_id'],'lesson_slug'=>$row['lesson_slug'],'question_id'=>$row['question_id'],'body'=>$row['body'],'rubric'=>array_map(static fn(mixed $item): array => ['label'=>is_string($item) ? $item : (string)($item['label'] ?? $item['text'] ?? 'Kritérium'),'hint'=>is_array($item) ? (string)($item['hint'] ?? '') : ''], $rubric)];
  }
  jsonOk(['reviews'=>array_slice($reviews, 0, 2)]);
}
if ($method !== 'POST') { header('Allow: GET, POST'); jsonErr('Method not allowed', 405); }
[$cfg, $user] = quiz_api_bootstrap(true); $userId = quiz_api_user_id($user); $body = jsonBody();
$submissionId = $body['submission_id'] ?? null; $scores = $body['scores'] ?? null;
if (!is_string($submissionId) || preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $submissionId) !== 1 || !is_array($scores)) jsonErr('Neplatné peer review.', 422);
$submission = sb_find_one($cfg, 'edu_quiz_submission', ['id'=>$submissionId], 'user_id,lesson_slug,question_id,status');
if (isset($submission['error'])) jsonErr('Peer review se nepodařilo ověřit.', 503);
$row = $submission['data'] ?? null;
if (!is_array($row) || ($row['user_id'] ?? null) === $userId || ($row['status'] ?? null) !== 'submitted' || !is_string($row['question_id'] ?? null) || preg_match('/^[1-6]-[0-9]+-q[0-9]+$/', $row['question_id']) !== 1) jsonErr('Odevzdání není dostupné k hodnocení.', 409);
$question = quiz_api_find_question_in_chapter((int)$row['question_id'][0], $row['question_id']);
$rubric = is_array($question['payload']['rubric'] ?? null) ? array_values($question['payload']['rubric']) : [];
$scores = array_values($scores); $valid = count($rubric) > 0 && count($scores) === count($rubric);
foreach ($scores as $score) if (!is_int($score) || $score < 0 || $score > 5) $valid = false;
if (!$valid) jsonErr('Vyplň hodnocení 0–5 u všech kritérií.', 422);
$saved = sb_rpc($cfg, 'record_edu_quiz_peer_review', ['p_reviewer_id'=>$userId,'p_submission_id'=>$submissionId,'p_scores'=>$scores]);
if (isset($saved['error']) || !is_array($saved['data'] ?? null) || !isset($saved['data'][0])) jsonErr('Peer review se nepodařilo uložit.', 503);
$record = $saved['data'][0];
jsonOk(['reviewed'=>(bool)($record['reviewed'] ?? false),'xp_awarded'=>(int)($record['xp_awarded'] ?? 0)]);
