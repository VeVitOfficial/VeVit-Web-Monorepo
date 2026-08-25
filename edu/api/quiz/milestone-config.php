<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') { header('Allow: GET'); jsonErr('Method not allowed', 405); }
[$cfg, $user] = quiz_api_bootstrap();
$userId = quiz_api_user_id($user);
$milestone = $_GET['milestone'] ?? '';
if (!is_string($milestone) || quiz_api_milestone_chapter($milestone) === null) jsonErr('Neplatný milník.', 422);
$attempt = filter_var($_GET['attempt'] ?? 1, FILTER_VALIDATE_INT, ['options'=>['min_range'=>1,'max_range'=>20]]); if ($attempt === false) jsonErr('Neplatný pokus.', 422);
$questions = quiz_api_milestone_questions($milestone, $userId, $attempt);
$chapter = quiz_api_load_chapter((int)quiz_api_milestone_chapter($milestone));
$boss = is_array($chapter['bossQuiz'] ?? null) ? $chapter['bossQuiz'] : null;
if ($questions === null || $boss === null) jsonErr('Milník zatím nemá serverovou definici.', 409);

$adaptivePool = [];
if ($milestone === 'final-6') {
  foreach (range(1, 6) as $chapterNumber) {
    foreach (glob(dirname(__DIR__, 2) . '/content/ai-gramotnost/lessons/' . $chapterNumber . '-*.json') ?: [] as $path) {
      try { $lesson = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR); } catch (JsonException) { continue; }
      foreach (($lesson['questionBank'] ?? []) as $question) {
        if (!is_array($question) || !is_string($question['id'] ?? null) || str_starts_with($question['id'], '6-4-')) continue;
        $question['tags'] = array_values(array_unique(array_merge($question['tags'] ?? [], ['chapter-' . $chapterNumber])));
        $adaptivePool[] = quiz_api_public_question($question);
      }
    }
  }
}

jsonOk([
  'milestone' => $milestone,
  'attempt' => $attempt,
  'questions' => array_map(static function (array $question): array { $question['tags'] = array_values(array_unique(array_merge($question['tags'] ?? [], ['chapter-' . (int)$question['id'][0]]))); return quiz_api_public_question($question); }, $questions),
  'lives' => (int)($boss['lives'] ?? 0),
  'pass_score_pct' => (int)($boss['passScorePct'] ?? 70),
  'adaptive' => ($boss['adaptive'] ?? false) === true,
  'adaptive_pool' => $adaptivePool,
]);
