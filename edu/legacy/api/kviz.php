<?php
// VeVit Edu API — Quiz endpoint
// GET /api/kviz/{lessonId} — quiz questions for a lesson

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    chyba('Pouze GET', 405);
}

// Parse path: /api/kviz/{lessonId}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', $path)));

$kvizIndex = -1;
foreach ($parts as $i => $p) {
    if ($p === 'kviz') { $kvizIndex = $i; break; }
}

$lessonId = isset($parts[$kvizIndex + 1]) ? (int)$parts[$kvizIndex + 1] : 0;
if ($lessonId <= 0) chyba('Neplatné ID kvízu', 400);

try {
    $db = db();

    // Verify lesson exists and is a quiz type
    $stmt = $db->prepare('SELECT id, title, lesson_type, xp_reward FROM lessons WHERE id = ?');
    $stmt->execute([$lessonId]);
    $lesson = $stmt->fetch();
    if (!$lesson) chyba('Kvíz nenalezen', 404);

    // Get questions
    $stmt = $db->prepare('SELECT * FROM quizzes WHERE lesson_id = ? ORDER BY sort_order ASC');
    $stmt->execute([$lessonId]);
    $questions = $stmt->fetchAll();

    if (empty($questions)) chyba('Kvíz nemá otázky', 404);

    // Get course slug for breadcrumb
    $stmt = $db->prepare('SELECT slug, title FROM courses WHERE id = (SELECT course_id FROM lessons WHERE id = ?)');
    $stmt->execute([$lessonId]);
    $course = $stmt->fetch();

    odpoved([
        'id' => (int)$lesson['id'],
        'title' => $lesson['title'],
        'lesson_type' => $lesson['lesson_type'],
        'course_slug' => $course ? $course['slug'] : null,
        'course_title' => $course ? $course['title'] : null,
        'xp_reward' => (int)$lesson['xp_reward'],
        'questions' => $questions
    ]);
} catch (PDOException $e) {
    error_log('kviz error: ' . $e->getMessage());
    chyba('Chyba při načítání kvízu', 500);
}