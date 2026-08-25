<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../data/content-loader.php';
$pdo = dbOrNull(); $action = $_GET['action'] ?? '';

if ($action === 'list') {
  $rows = [];
  if ($pdo) { try { $rows = $pdo->query("SELECT id, slug, title, description, icon, color, total_xp, estimated_hours, difficulty FROM courses WHERE is_published=1 ORDER BY id")->fetchAll(); } catch (Throwable $e) {} }
  if (!$rows) $rows = [contentCourseMeta()];
  jsonResponse($rows);
}

if ($action === 'detail') {
  $slug = $_GET['slug'] ?? ''; $course = null;
  if ($pdo) {
    try {
      $st = $pdo->prepare("SELECT * FROM courses WHERE slug=? AND is_published=1"); $st->execute([$slug]); $course = $st->fetch();
      if ($course) {
        $chapters = $pdo->prepare("SELECT id, sort_order, title, description FROM chapters WHERE course_id=? ORDER BY sort_order, id");
        $chapters->execute([$course['id']]); $chs = $chapters->fetchAll();
        foreach ($chs as &$ch) {
          $ls = $pdo->prepare("SELECT id, sort_order, title, slug, description, duration, xp_reward FROM lessons WHERE chapter_id=? ORDER BY sort_order, id");
          $ls->execute([$ch['id']]); $ch['lessons'] = $ls->fetchAll();
        }
        $course['chapters'] = $chs;
      }
    } catch (Throwable $e) { $course = null; }
  }
  if (!$course) $course = contentCourseDetail();
  jsonResponse($course);
}

if ($action === 'lesson') {
  $slug = $_GET['slug'] ?? ''; $lesson = null;
  if ($pdo) {
    try {
      $st = $pdo->prepare("SELECT l.*, ch.title AS chapter_title FROM lessons l JOIN chapters ch ON ch.id=l.chapter_id JOIN courses c ON c.id=ch.course_id WHERE l.slug=? AND c.is_published=1");
      $st->execute([$slug]); $lesson = $st->fetch();
      if ($lesson) {
        $exs = $pdo->prepare("SELECT id, sort_order, title, type, prompt, config, explanation, xp_reward FROM exercises WHERE lesson_id=? ORDER BY sort_order, id");
        $exs->execute([$lesson['id']]);
        $lesson['exercises'] = array_map(function ($e) { $e['config'] = json_decode($e['config'], true); return $e; }, $exs->fetchAll());
        unset($lesson['correct_answer']);
      }
    } catch (Throwable $e) { $lesson = null; }
  }
  if (!$lesson) $lesson = contentLesson($slug);
  if (!$lesson) jsonResponse(['error' => 'Lekce nenalezena'], 404);
  jsonResponse($lesson);
}

jsonResponse(['error' => 'Unknown action'], 404);
