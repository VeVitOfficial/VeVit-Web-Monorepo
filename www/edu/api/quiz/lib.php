<?php
declare(strict_types=1);
require_once dirname(__DIR__, 3) . '/shared/quiz-private/public-question.php';

require_once dirname(__DIR__, 3) . '/account/lib/auth-helpers.php';

const QUIZ_COURSE = 'ai-gramotnost';

const QUIZ_XP = [
  'warmup' => 5,
  'question' => 3,
  'trap' => 5,
  'open' => 10,
  'microtask' => 10,
  'boss' => 30,
  'peer_review' => 15,
  'hidden_badge' => 25,
];

function quiz_api_origin_allowed(?string $origin, string $allowedOrigin): bool {
  return is_string($origin) && $origin !== '' && $allowedOrigin !== '' && hash_equals($allowedOrigin, $origin);
}

/** @return list<string> */
function quiz_api_validate_attempt_payload(array $body): array {
  $errors = [];
  foreach (['course', 'lesson_slug', 'question_id', 'client_attempt_uuid', 'answer'] as $field) {
    if (!array_key_exists($field, $body)) $errors[] = "Chybí pole {$field}.";
  }
  if (($body['course'] ?? null) !== QUIZ_COURSE) $errors[] = 'Neplatný kurz.';
  if (!is_string($body['lesson_slug'] ?? null) || preg_match('/^[1-6]-[0-9]+-[a-z0-9-]+$/', (string) $body['lesson_slug']) !== 1) $errors[] = 'Neplatná lekce.';
  if (!is_string($body['question_id'] ?? null) || preg_match('/^[1-6]-[0-9]+-q[0-9]+$/', (string) $body['question_id']) !== 1) $errors[] = 'Neplatná otázka.';
  if (!is_string($body['client_attempt_uuid'] ?? null) || preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', (string) $body['client_attempt_uuid']) !== 1) $errors[] = 'client_attempt_uuid musí být UUID.';
  if (!is_array($body['answer'] ?? null)) $errors[] = 'Odpověď musí být objekt.';
  if (array_key_exists('xp_awarded', $body) || array_key_exists('xp', $body)) $errors[] = 'XP určuje výhradně server.';
  if (isset($body['duration_ms']) && (!is_int($body['duration_ms']) || $body['duration_ms'] < 0 || $body['duration_ms'] > 7200000)) $errors[] = 'Neplatná délka odpovědi.';
  if (isset($body['difficulty']) && !in_array($body['difficulty'], ['junior', 'pro', 'both'], true)) $errors[] = 'Neplatná obtížnost.';
  return $errors;
}

/** @return list<string> */
function quiz_api_validate_final_reflection(mixed $reflection): array {
  if (!is_array($reflection) || count($reflection) !== 3) return ['Doplň všechny tři reflexe a sebehodnocení 0–5.'];
  foreach (array_values($reflection) as $entry) {
    if (!is_array($entry) || !is_string($entry['text'] ?? null) || strlen(trim($entry['text'])) < 10 || !is_int($entry['score'] ?? null) || $entry['score'] < 0 || $entry['score'] > 5) {
      return ['Doplň všechny tři reflexe a sebehodnocení 0–5.'];
    }
  }
  return [];
}

/** @return array{0:array,1:array} */
function quiz_api_bootstrap(bool $write = false): array {
  $cfg = auth_load_config();
  beginJson($cfg);
  if ($write) quiz_api_require_write_request($cfg);
  $user = requireAuth($cfg);
  return [$cfg, $user];
}

function quiz_api_require_write_request(array $cfg): void {
  $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? ''));
  if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    header('Allow: POST, PUT, PATCH, DELETE');
    jsonErr('Method not allowed', 405);
  }
  $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
  $allowedOrigin = (string) ($cfg['ALLOWED_ORIGIN'] ?? 'https://vevit.cz');
  if (!quiz_api_origin_allowed(is_string($origin) ? $origin : null, $allowedOrigin)) jsonErr('Origin not allowed', 403);
  $rawToken = $_COOKIE[VV_COOKIE] ?? $_COOKIE[VV_COOKIE_LEG] ?? null;
  $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  if (!_vv_valid_token_format($rawToken) || !is_string($csrf) || !vv_csrf_verify($rawToken, $csrf, $cfg)) jsonErr('Neplatný CSRF token.', 403);
}

function quiz_api_iso_now(): string {
  return gmdate('Y-m-d\TH:i:s\Z');
}

function quiz_api_user_id(array $user): string {
  $userId = $user['id'] ?? null;
  if (!is_string($userId) || $userId === '') jsonErr('Neplatná identita uživatele.', 503);
  return $userId;
}

function quiz_api_lesson_path(string $slug): ?string {
  if (preg_match('/^[1-6]-[0-9]+-[a-z0-9-]+$/', $slug) !== 1) return null;
  return dirname(__DIR__, 2) . '/content/ai-gramotnost/lessons/' . $slug . '.json';
}

function quiz_api_find_question(string $lessonSlug, string $questionId): ?array {
  $path = quiz_api_lesson_path($lessonSlug);
  $raw = $path === null ? false : @file_get_contents($path);
  if ($raw === false) return null;
  try { $lesson = json_decode($raw, true, 512, JSON_THROW_ON_ERROR); }
  catch (JsonException) { return null; }
  if (!is_array($lesson) || ($lesson['slug'] ?? null) !== $lessonSlug) return null;
  foreach (($lesson['questionBank'] ?? []) as $question) if (is_array($question) && ($question['id'] ?? null) === $questionId) return $question;
  return null;
}

function quiz_api_xp_for_question(array $question): int {
  return match ($question['type'] ?? '') {
    'prompt_lab', 'open_rubric' => QUIZ_XP['open'],
    'microtask' => QUIZ_XP['microtask'],
    default => ($question['trap'] ?? false) === true ? QUIZ_XP['trap'] : QUIZ_XP['question'],
  };
}

/**
 * Čistá kopie pravidla, které používá atomická databázová RPC. Slouží pro
 * kontraktní test a pro konzistentní vysvětlení výsledku v API; autoritou pro
 * skutečný zápis XP zůstává výhradně record_edu_quiz_attempt().
 *
 * @param list<bool> $latestResults Nejnovější odpověď je poslední položka.
 */
function quiz_api_streak_xp_award(int $candidateXp, array $latestResults): int {
  if ($candidateXp <= 0 || count($latestResults) < 3) return $candidateXp;
  $lastThree = array_slice($latestResults, -3);
  return $lastThree === [true, true, true] ? (int) ceil($candidateXp * 1.25) : $candidateXp;
}

/** @param list<array{stake:int,correct:bool}> $rounds */
function quiz_api_calibration_summary(array $rounds): array {
  $expected = [5 => 50, 15 => 75, 30 => 90]; $buckets = [];
  foreach ($expected as $stake => $confidence) $buckets[$stake] = ['stake' => $stake, 'confidence_pct' => $confidence, 'count' => 0, 'correct' => 0, 'accuracy_pct' => 0];
  foreach ($rounds as $round) {
    $stake = (int)($round['stake'] ?? 0); if (!isset($buckets[$stake]) || !is_bool($round['correct'] ?? null)) continue;
    $buckets[$stake]['count']++; if ($round['correct']) $buckets[$stake]['correct']++;
  }
  $weightedError = 0; $count = 0;
  foreach ($buckets as &$bucket) {
    if ($bucket['count'] > 0) $bucket['accuracy_pct'] = (int)round(100 * $bucket['correct'] / $bucket['count']);
    $weightedError += abs($bucket['accuracy_pct'] - $bucket['confidence_pct']) * $bucket['count']; $count += $bucket['count'];
  }
  unset($bucket);
  $mae = $count ? round($weightedError / $count, 2) : 100.0;
  return ['round_count' => $count, 'mean_absolute_error_pct' => $mae, 'calibrated' => $count >= 10 && $mae <= 20, 'buckets' => array_values($buckets)];
}

function quiz_api_badge_for_calibration(array $summary): ?string {
  return ($summary['calibrated'] ?? false) === true && (int)($summary['round_count'] ?? 0) >= 10 ? 'kalibrovany' : null;
}

function quiz_api_badge_for_verified_milestone(string $milestone, bool $passed): ?string {
  if (!$passed) return null;
  return match ($milestone) {
    'boss-1' => 'archeolog-ai',
    'boss-2' => 'mechanik-neuronu',
    'boss-3' => 'promptovy-kovar',
    'boss-4' => 'integrator',
    'boss-5' => 'stavitel',
    'final-6' => 'skeptik-s-certifikatem',
    default => null,
  };
}

function quiz_api_milestone_lesson_slug(string $milestone): ?string {
  return match ($milestone) {
    'boss-1' => '1-4-etika-bezpecnost',
    'boss-2' => '2-4-multimodalni-ai',
    'boss-3' => '3-12-pokrocile-techniky',
    'boss-4' => '4-6-integrace-ai',
    'boss-5' => '5-6-lokalni-modely-soukromi',
    'final-6' => '6-4-zaverecny-test',
    default => null,
  };
}

/**
 * Volá se až po serverovém vyhodnocení boss/final úkolu. Klient nikdy
 * neposílá příznak úspěchu ani klíč odznaku.
 */
function quiz_api_award_verified_milestone(array $cfg, string $userId, string $milestone, bool $passed, array $meta = [], ?callable $rpc = null): bool {
  $badgeKey = quiz_api_badge_for_verified_milestone($milestone, $passed);
  if ($badgeKey === null) return false;
  $lessonSlug = quiz_api_milestone_lesson_slug($milestone);
  return quiz_api_award_badge($cfg, $userId, $badgeKey, array_merge($meta, ['milestone' => $milestone, 'lesson_slug' => $lessonSlug]), $rpc);
}

/** @return list<string> */
function quiz_api_validate_milestone_payload(array $body): array {
  $errors = [];
  if (!in_array($body['milestone'] ?? null, ['boss-1', 'boss-2', 'boss-3', 'boss-4', 'boss-5', 'final-6'], true)) $errors[] = 'Neplatný milník.';
  if (!is_array($body['answers'] ?? null)) $errors[] = 'Odpovědi milníku musí být objekt.';
  return $errors;
}

function quiz_api_milestone_chapter(string $milestone): ?int {
  return match ($milestone) {
    'boss-1' => 1,
    'boss-2' => 2,
    'boss-3' => 3,
    'boss-4' => 4,
    'boss-5' => 5,
    'final-6' => 6,
    default => null,
  };
}

function quiz_api_find_question_in_chapter(int $chapterNumber, string $questionId): ?array {
  if (preg_match('/^' . $chapterNumber . '-[0-9]+-q[0-9]+$/', $questionId) !== 1) return null;
  if ($chapterNumber === 6 && str_starts_with($questionId, '6-4-')) {
    $privatePath = dirname(__DIR__, 3) . '/shared/quiz-private/final-6.json';
    try { $private = json_decode((string)file_get_contents($privatePath), true, 512, JSON_THROW_ON_ERROR); } catch (Throwable) { return null; }
    foreach ($private['questions'] ?? [] as $candidate) if (is_array($candidate) && ($candidate['id'] ?? null) === $questionId) return $candidate;
    return null;
  }
  foreach ((glob(dirname(__DIR__, 2) . '/content/ai-gramotnost/lessons/' . $chapterNumber . '-*.json') ?: []) as $path) {
    try { $lesson = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR); } catch (JsonException) { continue; }
    foreach (($lesson['questionBank'] ?? []) as $candidate) if (is_array($candidate) && ($candidate['id'] ?? null) === $questionId) return $candidate;
  }
  return null;
}

function quiz_api_public_question(array $question): array {
  return quiz_public_question($question);
}

function quiz_api_milestone_allows_question(string $milestone, string $userId, string $questionId, int $attempt = 1): bool {
  $ids = quiz_api_milestone_question_ids($milestone, $userId, $attempt);
  if (is_array($ids) && in_array($questionId, $ids, true)) return true;
  if ($milestone !== 'final-6') return false;
  return preg_match('/^[1-6]-[0-9]+-q[0-9]+$/', $questionId) === 1 && !str_starts_with($questionId, '6-4-') && quiz_api_find_question_in_chapter((int)$questionId[0], $questionId) !== null;
}

/** @return list<array> */
function quiz_api_final_pool(): array {
  $pool = [];
  foreach (range(1, 6) as $chapterNumber) {
    foreach (glob(dirname(__DIR__, 2) . '/content/ai-gramotnost/lessons/' . $chapterNumber . '-*.json') ?: [] as $path) {
      try { $lesson = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR); } catch (Throwable) { continue; }
      foreach ($lesson['questionBank'] ?? [] as $question) {
        if (!is_array($question) || !is_string($question['id'] ?? null)) continue;
        $actual = quiz_api_find_question_in_chapter((int)$question['id'][0], $question['id']); if ($actual !== null) $pool[$question['id']] = $actual;
      }
    }
  }
  return array_values($pool);
}

/** @return list<string>|null */
function quiz_api_final_question_ids(string $userId, int $attempt): ?array {
  $required = ['mcq'=>8,'sort_buckets'=>4,'order'=>3,'hallucination_hunt'=>3,'branching'=>3,'prompt_lab'=>2,'poll'=>2];
  $pool = quiz_api_final_pool(); $selected = []; $chapterCounts = array_fill(1, 6, 0);
  foreach ($required as $type => $count) {
    $candidates = array_values(array_filter($pool, static fn(array $q): bool => ($q['type'] ?? null) === $type && ($type !== 'mcq' || ($q['trap'] ?? false) === true) && !in_array($q['id'], $selected, true)));
    for ($index = 0; $index < $count; $index++) {
      usort($candidates, static function (array $a, array $b) use ($chapterCounts, $userId, $attempt): int {
        $chapterA=(int)$a['id'][0]; $chapterB=(int)$b['id'][0]; $byCoverage=$chapterCounts[$chapterA]<=>$chapterCounts[$chapterB];
        return $byCoverage ?: strcmp(hash('sha256',$userId.'|final-6|'.$attempt.'|'.$a['id']), hash('sha256',$userId.'|final-6|'.$attempt.'|'.$b['id']));
      });
      $question = array_shift($candidates); if (!is_array($question)) return null;
      $selected[] = $question['id']; $chapterCounts[(int)$question['id'][0]]++;
    }
  }
  return $selected;
}

/** @return list<string>|null */
function quiz_api_milestone_question_ids(string $milestone, string $userId, int $attempt = 1): ?array {
  $chapterNumber = quiz_api_milestone_chapter($milestone);
  $chapter = $chapterNumber === null ? null : quiz_api_load_chapter($chapterNumber);
  $boss = is_array($chapter['bossQuiz'] ?? null) ? $chapter['bossQuiz'] : null;
  if ($boss === null) return null;
  if ($milestone === 'final-6') {
    return quiz_api_final_question_ids($userId, $attempt);
  }
  $pool = is_array($boss['poolQuestionIds'] ?? null) ? array_values(array_filter($boss['poolQuestionIds'], 'is_string')) : [];
  $count = (int)($boss['count'] ?? 10);
  if (count($pool) < $count || $count !== 10) return null;
  usort($pool, static function (string $left, string $right) use ($userId, $milestone, $attempt): int {
    return strcmp(hash('sha256', $userId . '|' . $milestone . '|' . $attempt . '|' . $left), hash('sha256', $userId . '|' . $milestone . '|' . $attempt . '|' . $right));
  });
  $selected = []; $seenTypes = [];
  foreach ($pool as $id) {
    $question = quiz_api_find_question_in_chapter((int)$chapterNumber, $id); $type = $question['type'] ?? null;
    if (!is_string($type) || isset($seenTypes[$type])) continue;
    $selected[] = $id; $seenTypes[$type] = true;
    if (count($selected) >= min(5, $count)) break;
  }
  foreach ($pool as $id) {
    if (count($selected) >= $count) break;
    if (!in_array($id, $selected, true)) $selected[] = $id;
  }
  return $selected;
}

/** @return list<array>|null */
function quiz_api_milestone_questions(string $milestone, string $userId, int $attempt = 1): ?array {
  $chapter = quiz_api_milestone_chapter($milestone);
  $ids = quiz_api_milestone_question_ids($milestone, $userId, $attempt);
  if ($chapter === null || $ids === null) return null;
  $questions = [];
  foreach ($ids as $id) {
    $question = quiz_api_find_question_in_chapter((int)$id[0], $id);
    if ($question === null) return null;
    $questions[] = $question;
  }
  return $questions;
}

/** @return list<array> */
function quiz_api_warmup_questions(string $lessonSlug, string $userId, array $attempts = [], array $reviews = []): array {
  $coursePath = dirname(__DIR__, 2) . '/content/ai-gramotnost/course.json';
  try { $course = json_decode((string)file_get_contents($coursePath), true, 512, JSON_THROW_ON_ERROR); } catch (Throwable) { return []; }
  $slugs = array_values(array_filter(array_column($course['lessons'] ?? [], 'slug'), 'is_string')); $current = array_search($lessonSlug, $slugs, true);
  if (!is_int($current) || $current <= 0) return [];
  $failed = []; foreach ($attempts as $attempt) if (($attempt['is_correct'] ?? null) === false && is_string($attempt['question_id'] ?? null)) $failed[$attempt['question_id']] = true;
  $due = []; $now = time(); foreach ($reviews as $review) if (is_string($review['question_id'] ?? null) && strtotime((string)($review['due_at'] ?? '')) <= $now) $due[$review['question_id']] = true;
  $candidates = [];
  foreach (array_slice($slugs, 0, $current) as $slug) {
    $path = quiz_api_lesson_path($slug); if ($path === null) continue;
    try { $lesson = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR); } catch (Throwable) { continue; }
    foreach ($lesson['questionBank'] ?? [] as $question) {
      if (!is_array($question) || !is_string($question['id'] ?? null)) continue;
      $score = 0; $id = $question['id'];
      if (isset($failed[$id])) $score += 100;
      if (($question['trap'] ?? false) === true) $score += 50;
      if (isset($due[$id])) $score += 25;
      if (in_array($lessonSlug, $question['spacedRepeatIn'] ?? [], true)) $score += 15;
      $candidates[] = ['score' => $score, 'hash' => hash('sha256', $userId . '|' . $lessonSlug . '|' . $id), 'question' => $question];
    }
  }
  usort($candidates, static fn(array $a, array $b): int => $b['score'] <=> $a['score'] ?: strcmp($a['hash'], $b['hash']));
  return array_column(array_slice($candidates, 0, 3), 'question');
}

function quiz_api_load_chapter(int $chapterNumber): ?array {
  if ($chapterNumber < 1 || $chapterNumber > 6) return null;
  $matches = glob(dirname(__DIR__, 2) . '/content/ai-gramotnost/chapters/' . sprintf('%02d-', $chapterNumber) . '*.json');
  if (!is_array($matches) || count($matches) !== 1) return null;
  try { $chapter = json_decode((string) file_get_contents($matches[0]), true, 512, JSON_THROW_ON_ERROR); }
  catch (JsonException) { return null; }
  return is_array($chapter) ? $chapter : null;
}

/** @return array{passed:bool,scorePct:float,questionCount:int,livesLeft:int,adaptiveRequired:int,adaptiveCorrect:int}|null */
function quiz_api_verify_milestone_submission(string $milestone, array $answers, string $userId = 'contract-test-user', int $attempt = 1): ?array {
  $chapterNumber = quiz_api_milestone_chapter($milestone);
  $chapter = $chapterNumber === null ? null : quiz_api_load_chapter($chapterNumber);
  $boss = is_array($chapter['bossQuiz'] ?? null) ? $chapter['bossQuiz'] : null;
  $questionIds = quiz_api_milestone_question_ids($milestone, $userId, $attempt);
  $threshold = $boss['passScorePct'] ?? null;
  if ($questionIds === null || $questionIds === [] || !is_int($threshold) || $threshold < 0 || $threshold > 100) return null;
  require_once __DIR__ . '/evaluator.php';
  $correct = 0; $wrongQuestionIds = [];
  foreach ($questionIds as $questionId) {
    if (!is_string($questionId) || !array_key_exists($questionId, $answers) || !is_array($answers[$questionId])) return ['passed' => false, 'scorePct' => 0, 'questionCount' => count($questionIds)];
    $question = quiz_api_find_question_in_chapter((int)$questionId[0], $questionId);
    if ($question === null) return null;
    $result = quiz_evaluate_question($answers[$questionId], $question);
    if (($result['valid'] ?? false) !== true) return ['passed' => false, 'scorePct' => 0, 'questionCount' => count($questionIds)];
    if (($result['correct'] ?? null) !== false && (float)($result['scorePct'] ?? 0) >= 100) $correct++;
    else $wrongQuestionIds[] = $questionId;
  }
  $score = round(100 * $correct / count($questionIds), 2);
  $lives = (int)($boss['lives'] ?? 0);
  $withinLives = $lives <= 0 || (count($questionIds) - $correct) <= $lives;
  $adaptiveRequired = 0; $adaptiveCorrect = 0; $adaptiveValid = true;
  if ($milestone === 'final-6') {
    $adaptiveRequired = min(5, count($wrongQuestionIds));
    $extraIds = array_values(array_diff(array_keys($answers), $questionIds));
    if (count($extraIds) !== $adaptiveRequired) $adaptiveValid = false;
    $requiredByChapter = [];
    foreach (array_slice($wrongQuestionIds, 0, $adaptiveRequired) as $wrongId) $requiredByChapter[(int)$wrongId[0]] = ($requiredByChapter[(int)$wrongId[0]] ?? 0) + 1;
    $correctByChapter = [];
    foreach ($extraIds as $extraId) {
      if (!is_string($extraId) || str_starts_with($extraId, '6-4-') || !is_array($answers[$extraId] ?? null)) { $adaptiveValid = false; continue; }
      $extraQuestion = quiz_api_find_question_in_chapter((int)$extraId[0], $extraId);
      if ($extraQuestion === null) { $adaptiveValid = false; continue; }
      $extraResult = quiz_evaluate_question($answers[$extraId], $extraQuestion);
      $extraCorrect = ($extraResult['valid'] ?? false) === true && ($extraResult['correct'] ?? null) !== false && (float)($extraResult['scorePct'] ?? 0) >= 100;
      if (!$extraCorrect) { $adaptiveValid = false; continue; }
      $adaptiveCorrect++;
      $chapter = (int)$extraId[0]; $correctByChapter[$chapter] = ($correctByChapter[$chapter] ?? 0) + 1;
    }
    foreach ($requiredByChapter as $chapter => $requiredCount) if (($correctByChapter[$chapter] ?? 0) < $requiredCount) $adaptiveValid = false;
  }
  return [
    'passed' => $score >= $threshold && $withinLives && $adaptiveValid,
    'scorePct' => $score,
    'questionCount' => count($questionIds),
    'livesLeft' => max(0, $lives - (count($questionIds) - $correct)),
    'adaptiveRequired' => $adaptiveRequired,
    'adaptiveCorrect' => $adaptiveCorrect,
  ];
}

function quiz_api_update_review_queue(array $cfg, string $userId, string $questionId, bool $correct): void {
  $existing = sb_find_one($cfg, 'edu_quiz_review_queue', ['user_id' => $userId, 'question_id' => $questionId], 'id,interval_days,ease');
  if (isset($existing['error'])) throw new RuntimeException('SRS unavailable');
  $oldInterval = (int)($existing['data']['interval_days'] ?? 1);
  $interval = $correct ? min(60, max(2, $oldInterval * 2)) : 1;
  $row = ['user_id' => $userId, 'question_id' => $questionId, 'due_at' => gmdate('Y-m-d\TH:i:s\Z', time() + $interval * 86400), 'interval_days' => $interval, 'ease' => $correct ? 2.5 : 2.0, 'last_result' => $correct, 'updated_at' => quiz_api_iso_now()];
  $saved = is_array($existing['data'] ?? null) ? sb_update($cfg, 'edu_quiz_review_queue', ['id' => $existing['data']['id']], $row) : sb_insert($cfg, 'edu_quiz_review_queue', $row);
  if (isset($saved['error'])) throw new RuntimeException('SRS save failed');
}

function quiz_api_schedule_review_now(array $cfg, string $userId, string $questionId): void {
  $existing = sb_find_one($cfg, 'edu_quiz_review_queue', ['user_id'=>$userId,'question_id'=>$questionId], 'id');
  if (isset($existing['error'])) throw new RuntimeException('SRS unavailable');
  $row = ['user_id'=>$userId,'question_id'=>$questionId,'due_at'=>quiz_api_iso_now(),'interval_days'=>1,'ease'=>2.0,'last_result'=>null,'updated_at'=>quiz_api_iso_now()];
  $saved = is_array($existing['data'] ?? null) ? sb_update($cfg, 'edu_quiz_review_queue', ['id'=>$existing['data']['id']], $row) : sb_insert($cfg, 'edu_quiz_review_queue', $row);
  if (isset($saved['error'])) throw new RuntimeException('SRS save failed');
}

function quiz_api_award_badge(array $cfg, string $userId, string $badgeKey, array $meta = [], ?callable $rpc = null): bool {
  $lessonSlug = $meta['lesson_slug'] ?? null;
  if (!is_string($lessonSlug) || quiz_api_lesson_path($lessonSlug) === null) throw new RuntimeException('Badge lesson unavailable');
  $params = [
    'p_user_id' => $userId,
    'p_badge_key' => $badgeKey,
    'p_meta' => $meta,
    'p_lesson_slug' => $lessonSlug,
  ];
  $saved = $rpc === null ? sb_rpc($cfg, 'award_edu_quiz_badge', $params) : $rpc($cfg, 'award_edu_quiz_badge', $params);
  if (isset($saved['error']) || !is_array($saved['data'] ?? null)) throw new RuntimeException('Badge save failed');
  $row = $saved['data'][0] ?? $saved['data'];
  return is_array($row) && ($row['awarded'] ?? false) === true;
}
