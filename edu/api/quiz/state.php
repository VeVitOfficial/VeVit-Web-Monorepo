<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') { header('Allow: GET'); jsonErr('Method not allowed', 405); }
[$cfg, $user] = quiz_api_bootstrap();
$userId = quiz_api_user_id($user);
$states = sb_get($cfg, 'edu_quiz_lesson_state', ['user_id' => $userId, 'course' => QUIZ_COURSE], 'lesson_slug,status,xp_total,best_score_pct,completed_at,updated_at', 200);
if (isset($states['error'])) jsonErr('Postup se nepodařilo načíst.', 503);
$badges = sb_get($cfg, 'edu_quiz_badge', ['user_id' => $userId], 'badge_key,awarded_at,meta', 100);
if (isset($badges['error'])) jsonErr('Odznaky se nepodařilo načíst.', 503);
$reviews = sb_get($cfg, 'edu_quiz_review_queue', ['user_id' => $userId], 'question_id,due_at,interval_days,last_result', 200);
if (isset($reviews['error'])) jsonErr('Opakování se nepodařilo načíst.', 503);
$attempts = sb_get($cfg, 'edu_quiz_attempt', ['user_id' => $userId], 'is_correct,created_at', 100);
if (isset($attempts['error'])) jsonErr('Streak se nepodařilo načíst.', 503);
$attemptRows = $attempts['data'] ?? []; usort($attemptRows, static fn(array $a,array $b): int => strcmp((string)($b['created_at'] ?? ''), (string)($a['created_at'] ?? '')));
$streak = 0; foreach ($attemptRows as $attempt) { if (($attempt['is_correct'] ?? null) === true) $streak++; elseif (($attempt['is_correct'] ?? null) === false) break; }
jsonOk(['states' => $states['data'] ?? [], 'badges' => $badges['data'] ?? [], 'reviews' => $reviews['data'] ?? [], 'streak' => $streak]);
