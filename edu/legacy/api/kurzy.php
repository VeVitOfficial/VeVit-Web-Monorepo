<?php
// VeVit Edu API — Courses endpoint
// GET /api/kurzy          — all active courses + user progress
// GET /api/kurzy/{slug}   — course detail + lessons + progress

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

$db = db();
$user = getVevitUser();

// Parse path: /api/kurzy or /api/kurzy/{slug}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', $path)));

// Find where 'kurzy' is in the path
$kurzyIndex = -1;
foreach ($parts as $i => $p) {
    if ($p === 'kurzy') { $kurzyIndex = $i; break; }
}

if ($kurzyIndex === -1) chyba('Neplatná cesta', 404);

$slug = isset($parts[$kurzyIndex + 1]) ? $parts[$kurzyIndex + 1] : null;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    chyba('Pouze GET', 405);
}

if ($slug) {
    // GET /api/kurzy/{slug} — course detail + lessons
    renderKurzDetail($db, $user, $slug);
} else {
    // GET /api/kurzy — all courses
    renderKurzy($db, $user);
}

function renderKurzy($db, $user) {
    try {
        $stmt = $db->query('SELECT * FROM courses WHERE is_active = 1 ORDER BY sort_order ASC');
        $courses = $stmt->fetchAll();

        // Add progress for logged-in user
        if ($user) {
            $stmt = $db->prepare(
                'SELECT course_id, COUNT(*) as completed FROM user_progress
                 WHERE user_id = ? GROUP BY course_id'
            );
            $stmt->execute([$user['id']]);
            $progress = [];
            while ($row = $stmt->fetch()) {
                $progress[$row['course_id']] = (int)$row['completed'];
            }
            foreach ($courses as &$c) {
                $c['completed_lessons'] = isset($progress[$c['id']]) ? $progress[$c['id']] : 0;
            }
        }

        odpoved($courses);
    } catch (PDOException $e) {
        error_log('kurzy error: ' . $e->getMessage());
        chyba('Chyba při načítání kurzů', 500);
    }
}

function renderKurzDetail($db, $user, $slug) {
    try {
        // Get course
        $stmt = $db->prepare('SELECT * FROM courses WHERE slug = ? AND is_active = 1');
        $stmt->execute([$slug]);
        $course = $stmt->fetch();
        if (!$course) chyba('Kurz nenalezen', 404);

        // Get lessons
        $stmt = $db->prepare(
            'SELECT id, course_id, title, lesson_type, sort_order, xp_reward, duration_minutes, requires_tier
             FROM lessons WHERE course_id = ? ORDER BY sort_order ASC'
        );
        $stmt->execute([$course['id']]);
        $lessons = $stmt->fetchAll();

        // Determine lock status based on user tier
        $user = $user; // already set from parameter
        $userTier = $user ? ($user['tier'] ?? 'free') : 'free';
        $tierOrder = ['free' => 0, 'bronze' => 1, 'silver' => 2, 'gold' => 3, 'platinum' => 4];
        $userTierLevel = $tierOrder[$userTier] ?? 0;

        foreach ($lessons as &$l) {
            $reqTier = $l['requires_tier'] ?? 'free';
            $reqLevel = $tierOrder[$reqTier] ?? 0;
            $l['locked'] = $userTierLevel < $reqLevel;
            $l['requires_tier'] = $reqTier;
        }

        // Add progress per lesson
        if ($user) {
            $lessonIds = array_column($lessons, 'id');
            if (!empty($lessonIds)) {
                $placeholders = implode(',', array_fill(0, count($lessonIds), '?'));
                $stmt = $db->prepare(
                    "SELECT lesson_id, completed_at FROM user_progress
                     WHERE user_id = ? AND lesson_id IN ($placeholders)"
                );
                $params = array_merge([$user['id']], $lessonIds);
                $stmt->execute($params);
                $completedMap = [];
                while ($row = $stmt->fetch()) {
                    $completedMap[$row['lesson_id']] = $row['completed_at'];
                }
                foreach ($lessons as &$l) {
                    $l['dokonceno'] = isset($completedMap[$l['id']]);
                    $l['completed_at'] = $completedMap[$l['id']] ?? null;
                }
            }
        } else {
            foreach ($lessons as &$l) {
                $l['dokonceno'] = false;
                $l['completed_at'] = null;
            }
        }

        // Get quizzes for quiz lessons
        $quizLessonIds = array_filter($lessons, function($l) {
            return $l['lesson_type'] === 'quiz' || $l['lesson_type'] === 'final_quiz';
        });
        if (!empty($quizLessonIds)) {
            $qIds = array_column($quizLessonIds, 'id');
            $placeholders = implode(',', array_fill(0, count($qIds), '?'));
            $stmt = $db->prepare(
                "SELECT * FROM quizzes WHERE lesson_id IN ($placeholders) ORDER BY sort_order ASC"
            );
            $stmt->execute($qIds);
            $allQuizzes = $stmt->fetchAll();
            $quizzesByLesson = [];
            foreach ($allQuizzes as $q) {
                $quizzesByLesson[$q['lesson_id']][] = $q;
            }
            foreach ($lessons as &$l) {
                if (isset($quizzesByLesson[$l['id']])) {
                    $l['quizzes'] = $quizzesByLesson[$l['id']];
                }
            }
        }

        $course['lessons'] = $lessons;
        odpoved($course);
    } catch (PDOException $e) {
        error_log('kurz detail error: ' . $e->getMessage());
        chyba('Chyba při načítání kurzu', 500);
    }
}