<?php
// VZOR — English content overlay for the ai-gramotnost course (no-DB fallback path).
//
// Loaded by content-loader.php when the resolved locale is `en`. This file requires
// content.php for the builder helpers + content*() functions + the canonical
// $LESSONS (lesson bodies + exercise prompts/options/explanations remain Czech
// until the full-content translation follow-up), then overrides the small,
// high-visibility translatable metadata:
//   - $ACHS         : achievement names + descriptions (10)
//   - $CHAPTERS     : chapter titles + descriptions (6)
//   - $COURSE_META  : course title + description (read by contentData())
//
// Follow-up (bulk, tracked separately):
//   1. Translate $LESSONS lesson bodies + exercise prompts/options/explanations
//      to en (and de/es/uk/fr/sk) — mirror this file as content.<lang>.php.
//   2. Add DB translation tables (chapter_translations, lesson_translations,
//      exercise_translations) so the DB-backed API path (api/courses.php,
//      api/exercises.php when $pdo is present) serves localized content too;
//      currently the DB path serves the Czech-seeded rows regardless of locale.
declare(strict_types=1);

require_once __DIR__ . '/content.php';   // builders + content*() functions + cs globals

$ACHS = [
  ['First Steps',            'Complete 1 lesson',                       'zap',    1, 'lessons_count',      1,  50],
  ['Prompt Wizard',          '100% in 5 prompt builder exercises',      'brain',  2, 'perfect_exercises', 5,  100],
  ['Streak Master',          '7 days in a row',                         'flame',  3, 'streak',            7,  75],
  ['Speedrunner',            '3 lessons under 50% of average time',     'zap',    4, 'speed_bonus_count', 3,  50],
  ['Perfectionist',          'Complete a chapter with 100%',            'trophy', 5, 'perfect_chapter',   1,  100],
  ['Code Poet',              'All code exercises',                      'zap',    6, 'all_code_exercises',1,  75],
  ['RAG Pioneer',            'Complete chapter 5',                      'brain',  7, 'chapter_complete',  5,  50],
  ['Full Stack',             'Complete the entire course',              'trophy', 8, 'course_complete',   1,  200],
  ['Early Bird',             'Log in before 8:00',                      'zap',    9, 'login_before_hour', 8,  25],
  ['Night Owl',              'Study after 22:00',                       'brain', 10, 'login_after_hour', 22,  25],
];

$CHAPTERS = [
  1 => ['Intro to AI',                      'Foundations, history, AI types and ethics.'],
  2 => ['How AI Works',                     'Neural networks, LLMs, models, multimodality.'],
  3 => ['Prompt Engineering',               'From basics to advanced techniques.'],
  4 => ['Practical AI Tool Integration',    'AI in practice – office, research, automation.'],
  5 => ['Advanced Topics',                  'APIs, chatbots, RAG, fine-tuning, trends.'],
  6 => ['Conclusion & Projects',            'Critical thinking and final projects.'],
];

$COURSE_META = [
  'title'       => 'AI Literacy',
  'description' => 'A complete AI literacy course – from foundations to advanced prompt engineering and AI tool integration.',
];