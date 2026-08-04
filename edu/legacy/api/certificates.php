<?php
// VeVit Edu API — Certificates endpoint
// POST /api/certificates/issue   — issue a certificate for completed course
// GET  /api/certificates/my      — list user's certificates
// GET  /api/certificates/verify  — verify a certificate by UUID

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

$db = db();

$method = $_SERVER['REQUEST_METHOD'];

// Parse path for sub-routes
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', $path)));

$certIndex = -1;
foreach ($parts as $i => $p) {
    if ($p === 'certificates') { $certIndex = $i; break; }
}

$subRoute = ($certIndex !== -1 && isset($parts[$certIndex + 1])) ? $parts[$certIndex + 1] : null;

// ─── ROUTING ───
if ($method === 'POST' && $subRoute === 'issue') {
    handleIssue($db);
} elseif ($method === 'GET' && $subRoute === 'my') {
    handleMy($db);
} elseif ($method === 'GET' && $subRoute === 'verify') {
    handleVerify($db);
} else {
    chyba('Neplatná cesta', 404);
}

// ─── POST /api/certificates/issue ───
function handleIssue($db) {
    $user = vyzadujPrihlaseni();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['course_slug'])) {
        chyba('Chybí course_slug', 400);
    }

    $courseSlug = trim($input['course_slug']);
    if ($courseSlug === '') chyba('Neplatný course_slug', 400);

    try {
        // Check for existing certificate
        $stmt = $db->prepare('SELECT id, uuid, user_nick, user_name, course_title, issued_at FROM certificates WHERE user_id = ? AND course_slug = ?');
        $stmt->execute([$user['id'], $courseSlug]);
        $existing = $stmt->fetch();
        if ($existing) {
            odpoved([
                'uuid' => $existing['uuid'],
                'user_nick' => esc($existing['user_nick']),
                'user_name' => esc($existing['user_name']),
                'course_title' => esc($existing['course_title']),
                'issued_at' => $existing['issued_at'],
                'already_exists' => true,
            ]);
        }

        // Get course info
        $stmt = $db->prepare('SELECT id, title, lesson_count FROM courses WHERE slug = ?');
        $stmt->execute([$courseSlug]);
        $course = $stmt->fetch();
        if (!$course) chyba('Kurz nenalezen', 404);

        // Check completion via user_progress
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM user_progress WHERE user_id = ? AND course_id = ?'
        );
        $stmt->execute([$user['id'], $course['id']]);
        $completedCount = (int)$stmt->fetchColumn();
        $requiredCount = (int)($course['lesson_count'] ?? 0);

        // If lesson_count is 0, check if there are any lessons at all
        if ($requiredCount === 0) {
            $stmt = $db->prepare('SELECT COUNT(*) FROM lessons WHERE course_id = ?');
            $stmt->execute([$course['id']]);
            $requiredCount = (int)$stmt->fetchColumn();
        }

        if ($requiredCount > 0 && $completedCount < $requiredCount) {
            chyba('Kurz ještě není dokončen.', 403);
        }

        // Generate UUID
        $uuid = sprintf(
            '%s-%s-%s-%s-%s',
            bin2hex(random_bytes(4)),
            bin2hex(random_bytes(2)),
            bin2hex(random_bytes(2)),
            bin2hex(random_bytes(2)),
            bin2hex(random_bytes(6))
        );

        // Generate verify hash
        $verifyHash = hash('sha256', $uuid . $user['id'] . $courseSlug . CERT_SECRET);

        // Get user full name from account DB
        $userName = $user['nickname'] ?? $user['nick'] ?? '';
        try {
            $accDb = dbAccount();
            $stmt = $accDb->prepare('SELECT nickname, full_name FROM users WHERE id = ?');
            $stmt->execute([$user['id']]);
            $accUser = $stmt->fetch();
            if ($accUser) {
                $userName = !empty($accUser['full_name']) ? $accUser['full_name'] : $accUser['nickname'];
            }
        } catch (PDOException $e) {
            error_log('certificates account lookup error: ' . $e->getMessage());
        }

        $userNick = $user['nickname'] ?? $user['nick'] ?? 'Anonym';

        // Insert certificate
        $stmt = $db->prepare(
            'INSERT INTO certificates (uuid, user_id, user_nick, user_name, course_slug, course_title, issued_at, verify_hash)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)'
        );
        $stmt->execute([$uuid, $user['id'], $userNick, $userName, $courseSlug, $course['title'], $verifyHash]);

        odpoved([
            'uuid' => $uuid,
            'user_nick' => esc($userNick),
            'user_name' => esc($userName),
            'course_title' => esc($course['title']),
            'issued_at' => date('c'),
        ], 201);

    } catch (PDOException $e) {
        error_log('certificates issue error: ' . $e->getMessage());
        chyba('Chyba při vydávání certifikátu', 500);
    }
}

// ─── GET /api/certificates/my ───
function handleMy($db) {
    $user = vyzadujPrihlaseni();

    try {
        $stmt = $db->prepare(
            'SELECT uuid, course_slug, course_title, issued_at FROM certificates WHERE user_id = ? ORDER BY issued_at DESC'
        );
        $stmt->execute([$user['id']]);
        $certs = $stmt->fetchAll();

        foreach ($certs as &$c) {
            $c['course_title'] = esc($c['course_title']);
        }
        unset($c);

        odpoved($certs);
    } catch (PDOException $e) {
        error_log('certificates my error: ' . $e->getMessage());
        chyba('Chyba při načítání certifikátů', 500);
    }
}

// ─── GET /api/certificates/verify?uuid=XXXX ───
function handleVerify($db) {
    $uuid = isset($_GET['uuid']) ? trim($_GET['uuid']) : '';
    if ($uuid === '') chyba('Chybí uuid', 400);

    try {
        $stmt = $db->prepare(
            'SELECT uuid, user_nick, user_name, course_slug, course_title, issued_at FROM certificates WHERE uuid = ?'
        );
        $stmt->execute([$uuid]);
        $cert = $stmt->fetch();

        if (!$cert) chyba('Certifikát nenalezen.', 404);

        odpoved([
            'uuid' => $cert['uuid'],
            'user_nick' => esc($cert['user_nick']),
            'user_name' => esc($cert['user_name']),
            'course_slug' => $cert['course_slug'],
            'course_title' => esc($cert['course_title']),
            'issued_at' => $cert['issued_at'],
            'valid' => true,
        ]);
    } catch (PDOException $e) {
        error_log('certificates verify error: ' . $e->getMessage());
        chyba('Chyba při ověřování certifikátu', 500);
    }
}