<?php
// VeVit Edu API — Lessons & Progress endpoint
// GET  /api/lekce/{id}    — lesson detail (content + quizzes if quiz)
// POST /api/progress      — mark lesson completed, add XP

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

$db = db();

// Parse path
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', $path)));

// Route: /api/lekce/{id} or /api/progress
$lekceIndex = -1;
foreach ($parts as $i => $p) {
    if ($p === 'lekce') { $lekceIndex = $i; break; }
}
$progressIndex = -1;
foreach ($parts as $i => $p) {
    if ($p === 'progress') { $progressIndex = $i; break; }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($progressIndex !== -1 && $method === 'POST') {
    handleProgress($db);
    exit;
}

if ($lekceIndex !== -1 && $method === 'GET') {
    $id = isset($parts[$lekceIndex + 1]) ? (int)$parts[$lekceIndex + 1] : 0;
    if ($id <= 0) chyba('Neplatné ID lekce', 400);
    renderLekce($db, $id);
    exit;
}

if ($lekceIndex !== -1 && isset($parts[$lekceIndex + 1])) {
    // Could be /api/lekce/{id}/kviz
    $id = (int)$parts[$lekceIndex + 1];
    $sub = isset($parts[$lekceIndex + 2]) ? $parts[$lekceIndex + 2] : null;
    if ($sub === 'kviz') {
        renderKviz($db, $id);
        exit;
    }
    renderLekce($db, $id);
    exit;
}

chyba('Neplatná cesta', 404);

function renderLekce($db, $id) {
    try {
        $stmt = $db->prepare('SELECT * FROM lessons WHERE id = ?');
        $stmt->execute([$id]);
        $lesson = $stmt->fetch();
        if (!$lesson) chyba('Lekce nenalezena', 404);

        // Get course info for breadcrumb
        $stmt = $db->prepare('SELECT slug, title FROM courses WHERE id = ?');
        $stmt->execute([$lesson['course_id']]);
        $course = $stmt->fetch();
        $lesson['course'] = $course;

        // Tier gating: check if lesson requires a specific tier
        $requiresTier = $lesson['requires_tier'] ?? 'free';
        $user = getVevitUser();
        $userTier = $user['tier'] ?? 'free';

        if ($requiresTier !== 'free') {
            $tierOrder = ['free' => 0, 'bronze' => 1, 'silver' => 2, 'gold' => 3, 'platinum' => 4];
            $userTierLevel = $tierOrder[$userTier] ?? 0;
            $requiredTierLevel = $tierOrder[$requiresTier] ?? 0;

            if ($userTierLevel < $requiredTierLevel) {
                http_response_code(403);
                echo json_encode([
                    'ok' => false,
                    'error' => 'premium_required',
                    'requires_tier' => $requiresTier,
                    'user_tier' => $userTier,
                    'message' => 'Tato lekce vyžaduje ' . ucfirst($requiresTier) . ' předplatné.',
                    'upgrade_url' => 'https://account.vevit.fun/premium.html'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        // Mark the required tier in response
        $lesson['requires_tier'] = $requiresTier;
        $lesson['locked'] = false;

        // If quiz, include questions
        if ($lesson['lesson_type'] === 'quiz' || $lesson['lesson_type'] === 'final_quiz') {
            $stmt = $db->prepare('SELECT * FROM quizzes WHERE lesson_id = ? ORDER BY sort_order ASC');
            $stmt->execute([$id]);
            $lesson['quizzes'] = $stmt->fetchAll();
        }

        // Check user progress
        if ($user) {
            $stmt = $db->prepare('SELECT completed_at FROM user_progress WHERE user_id = ? AND lesson_id = ?');
            $stmt->execute([$user['id'], $id]);
            $row = $stmt->fetch();
            $lesson['dokonceno'] = !!$row;
            $lesson['completed_at'] = $row ? $row['completed_at'] : null;
        }

        odpoved($lesson);
    } catch (PDOException $e) {
        error_log('lekce error: ' . $e->getMessage());
        chyba('Chyba při načítání lekce', 500);
    }
}

function renderKviz($db, $lessonId) {
    try {
        $stmt = $db->prepare('SELECT * FROM quizzes WHERE lesson_id = ? ORDER BY sort_order ASC');
        $stmt->execute([$lessonId]);
        $questions = $stmt->fetchAll();
        if (empty($questions)) chyba('Kvíz nemá otázky', 404);
        odpoved($questions);
    } catch (PDOException $e) {
        error_log('kviz error: ' . $e->getMessage());
        chyba('Chyba při načítání kvízu', 500);
    }
}

function handleProgress($db) {
    $user = vyzadujPrihlaseni();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['lesson_id'])) {
        chyba('Chybí lesson_id', 400);
    }

    $lessonId = (int)$input['lesson_id'];
    $skore = isset($input['skore']) ? (int)$input['skore'] : null;

    try {
        // Get lesson info
        $stmt = $db->prepare('SELECT id, course_id, xp_reward, lesson_type FROM lessons WHERE id = ?');
        $stmt->execute([$lessonId]);
        $lesson = $stmt->fetch();
        if (!$lesson) chyba('Lekce nenalezena', 404);

        $xpBase = (int)$lesson['xp_reward'];

        // Apply tier XP multiplier
        $userTier = $user['tier'] ?? 'free';
        $tierMultipliers = [
            'free' => 1.0,
            'bronze' => 1.2,
            'silver' => 1.5,
            'gold' => 2.0,
            'platinum' => 2.5,
        ];
        $multiplier = $tierMultipliers[$userTier] ?? 1.0;
        $xpZiskano = (int)round($xpBase * $multiplier);

        // Check for duplicate (UNIQUE KEY handles this too)
        $stmt = $db->prepare('SELECT id FROM user_progress WHERE user_id = ? AND lesson_id = ?');
        $stmt->execute([$user['id'], $lessonId]);
        if ($stmt->fetch()) {
            // Already completed — return current XP without re-adding
            $accountInfo = getUserXp($user['id']);
            odpoved([
                'xp_ziskano' => 0,
                'xp_celkem' => $accountInfo ? (int)$accountInfo['xp'] : 0,
                'level' => $accountInfo ? (int)$accountInfo['level'] : 1,
                'level_up' => false,
                'message' => 'Lekce již dokončena'
            ]);
        }

        // Insert progress
        $stmt = $db->prepare(
            'INSERT INTO user_progress (user_id, lesson_id, course_id, xp_ziskano, skore)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$user['id'], $lessonId, $lesson['course_id'], $xpZiskano, $skore]);

        // Update XP in account DB
        $levelUp = false;
        $oldLevel = 1;
        try {
            $accDb = dbAccount();
            $accDb->prepare('UPDATE users SET xp = xp + ? WHERE id = ?')->execute([$xpZiskano, $user['id']]);

            // Recalculate level
            $stmt = $accDb->prepare('SELECT xp, level FROM users WHERE id = ?');
            $stmt->execute([$user['id']]);
            $acc = $stmt->fetch();
            $newXp = $acc ? (int)$acc['xp'] : $xpZiskano;
            $oldLevel = $acc ? (int)$acc['level'] : 1;

            // Level formula: level = floor(sqrt(xp / 100)) + 1
            $newLevel = (int)floor(sqrt($newXp / 100)) + 1;
            if ($newLevel > $oldLevel) {
                $levelUp = true;
                $accDb->prepare('UPDATE users SET level = ? WHERE id = ?')->execute([$newLevel, $user['id']]);
            }
        } catch (PDOException $e) {
            error_log('Account XP update error: ' . $e->getMessage());
            // Non-fatal — progress saved but XP not synced
        }

        $accountInfo = getUserXp($user['id']);
        odpoved([
            'xp_ziskano' => $xpZiskano,
            'xp_base' => $xpBase,
            'multiplier' => $multiplier,
            'tier' => $userTier,
            'xp_celkem' => $accountInfo ? (int)$accountInfo['xp'] : $xpZiskano,
            'level' => $accountInfo ? (int)$accountInfo['level'] : 1,
            'level_up' => $levelUp
        ]);

    } catch (PDOException $e) {
        error_log('progress error: ' . $e->getMessage());
        chyba('Chyba při ukládání progressu', 500);
    }
}