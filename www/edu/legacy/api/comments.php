<?php
// VeVit Edu API — Comments endpoint
// GET    /api/comments?lesson_id=42       — load comments with replies
// POST   /api/comments                     — add a comment
// POST   /api/comments/like                — toggle like on a comment
// DELETE /api/comments?id=123              — soft-delete a comment

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

$db = db();

$method = $_SERVER['REQUEST_METHOD'];

// Parse path for /like sub-route
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', $path)));
$isLikeRoute = false;
foreach ($parts as $i => $p) {
    if ($p === 'comments' && isset($parts[$i + 1]) && $parts[$i + 1] === 'like') {
        $isLikeRoute = true;
        break;
    }
}

// ─── ROUTING ───
if ($method === 'GET') {
    handleGet($db);
} elseif ($method === 'POST' && $isLikeRoute) {
    handleLike($db);
} elseif ($method === 'POST') {
    handlePost($db);
} elseif ($method === 'DELETE') {
    handleDelete($db);
} else {
    chyba('Nepodporovaná metoda', 405);
}

// ─── GET /api/comments?lesson_id=42 ───
function handleGet($db) {
    $lessonId = isset($_GET['lesson_id']) ? (int)$_GET['lesson_id'] : 0;
    if ($lessonId <= 0) chyba('Chybí lesson_id', 400);

    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
    $limit  = isset($_GET['limit'])  ? min(50, max(1, (int)$_GET['limit'])) : 20;

    $user = getVevitUser();
    $userId = $user ? $user['id'] : null;

    try {
        // Count top-level comments
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM lesson_comments WHERE lesson_id = ? AND parent_id IS NULL AND is_deleted = 0'
        );
        $stmt->execute([$lessonId]);
        $total = (int)$stmt->fetchColumn();

        // Load top-level comments
        $stmt = $db->prepare(
            'SELECT id, lesson_id, user_id, user_nick, user_avatar, parent_id,
                    content, is_pinned, likes, created_at
             FROM lesson_comments
             WHERE lesson_id = ? AND parent_id IS NULL AND is_deleted = 0
             ORDER BY is_pinned DESC, created_at DESC
             LIMIT ? OFFSET ?'
        );
        $stmt->execute([$lessonId, $limit, $offset]);
        $comments = $stmt->fetchAll();

        foreach ($comments as &$comment) {
            $comment['user_liked'] = $userId ? userLiked($db, $comment['id'], $userId) : false;
            $comment['user_nick'] = esc($comment['user_nick']);
            $comment['user_avatar'] = esc($comment['user_avatar']);
            $comment['content'] = esc($comment['content']);

            // Load replies
            $stmt = $db->prepare(
                'SELECT id, lesson_id, user_id, user_nick, user_avatar, parent_id,
                        content, is_pinned, likes, created_at
                 FROM lesson_comments
                 WHERE parent_id = ? AND is_deleted = 0
                 ORDER BY created_at ASC'
            );
            $stmt->execute([$comment['id']]);
            $replies = $stmt->fetchAll();

            foreach ($replies as &$reply) {
                $reply['user_liked'] = $userId ? userLiked($db, $reply['id'], $userId) : false;
                $reply['user_nick'] = esc($reply['user_nick']);
                $reply['user_avatar'] = esc($reply['user_avatar']);
                $reply['content'] = esc($reply['content']);
            }
            unset($reply);

            $comment['replies'] = $replies;
        }
        unset($comment);

        odpoved(['comments' => $comments, 'total' => $total]);
    } catch (PDOException $e) {
        error_log('comments GET error: ' . $e->getMessage());
        chyba('Chyba při načítání komentářů', 500);
    }
}

// ─── POST /api/comments ───
function handlePost($db) {
    $user = vyzadujPrihlaseni();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) chyba('Neplatný JSON', 400);

    $lessonId = isset($input['lesson_id']) ? (int)$input['lesson_id'] : 0;
    $content  = isset($input['content']) ? trim($input['content']) : '';
    $parentId = isset($input['parent_id']) ? (int)$input['parent_id'] : null;
    if ($parentId === 0) $parentId = null;

    if ($lessonId <= 0) chyba('Neplatné lesson_id', 400);
    if ($content === '') chyba('Komentář nesmí být prázdný', 400);
    if (mb_strlen($content) > 2000) chyba('Komentář je příliš dlouhý (max 2000 znaků)', 400);

    // Rate limit: max 5 comments per 10 minutes
    try {
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM lesson_comments
             WHERE user_id = ? AND created_at > NOW() - INTERVAL 10 MINUTE'
        );
        $stmt->execute([$user['id']]);
        $recent = (int)$stmt->fetchColumn();
        if ($recent >= 5) {
            http_response_code(429);
            echo json_encode(['ok' => false, 'error' => 'Příliš mnoho komentářů. Počkej 10 minut.'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    } catch (PDOException $e) {
        error_log('comments rate-limit error: ' . $e->getMessage());
    }

    // If replying, verify parent exists and is not deleted
    if ($parentId !== null) {
        try {
            $stmt = $db->prepare('SELECT id, parent_id FROM lesson_comments WHERE id = ? AND is_deleted = 0');
            $stmt->execute([$parentId]);
            $parent = $stmt->fetch();
            if (!$parent) chyba('Komentář neexistuje', 404);
            // Max 1 level of nesting — if parent is already a reply, reply to its parent
            if ($parent['parent_id'] !== null) {
                $parentId = (int)$parent['parent_id'];
            }
        } catch (PDOException $e) {
            chyba('Chyba při ověřování rodiče', 500);
        }
    }

    try {
        $stmt = $db->prepare(
            'INSERT INTO lesson_comments (lesson_id, user_id, user_nick, user_avatar, parent_id, content, is_pinned, is_deleted, likes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, NOW())'
        );
        $nick   = $user['nickname'] ?? $user['nick'] ?? 'Anonym';
        $avatar = $user['avatar'] ?? '';
        $stmt->execute([$lessonId, $user['id'], $nick, $avatar, $parentId, $content]);

        $newId = (int)$db->lastInsertId();

        // Fetch the inserted row
        $stmt = $db->prepare(
            'SELECT id, lesson_id, user_id, user_nick, user_avatar, parent_id,
                    content, is_pinned, likes, created_at
             FROM lesson_comments WHERE id = ?'
        );
        $stmt->execute([$newId]);
        $row = $stmt->fetch();
        $row['user_liked'] = false;
        $row['user_nick'] = esc($row['user_nick']);
        $row['user_avatar'] = esc($row['user_avatar']);
        $row['content'] = esc($row['content']);
        $row['replies'] = [];

        odpoved($row, 201);
    } catch (PDOException $e) {
        error_log('comments POST error: ' . $e->getMessage());
        chyba('Chyba při ukládání komentáře', 500);
    }
}

// ─── POST /api/comments/like ───
function handleLike($db) {
    $user = vyzadujPrihlaseni();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['comment_id'])) chyba('Chybí comment_id', 400);

    $commentId = (int)$input['comment_id'];
    if ($commentId <= 0) chyba('Neplatné comment_id', 400);

    try {
        // Try insert (like)
        try {
            $stmt = $db->prepare(
                'INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, NOW())'
            );
            $stmt->execute([$commentId, $user['id']]);
            $liked = true;
        } catch (PDOException $e) {
            // Duplicate key → unlike
            if ($e->getCode() == 23000) {
                $stmt = $db->prepare(
                    'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?'
                );
                $stmt->execute([$commentId, $user['id']]);
                $liked = false;
            } else {
                throw $e;
            }
        }

        // Update likes count
        $stmt = $db->prepare(
            'UPDATE lesson_comments SET likes = (
                SELECT COUNT(*) FROM comment_likes WHERE comment_id = ?
             ) WHERE id = ?'
        );
        $stmt->execute([$commentId, $commentId]);

        // Get current count
        $stmt = $db->prepare('SELECT likes FROM lesson_comments WHERE id = ?');
        $stmt->execute([$commentId]);
        $likes = (int)$stmt->fetchColumn();

        http_response_code(200);
        echo json_encode(['ok' => true, 'liked' => $liked, 'likes' => $likes], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (PDOException $e) {
        error_log('comments like error: ' . $e->getMessage());
        chyba('Chyba při likování', 500);
    }
}

// ─── DELETE /api/comments?id=123 ───
function handleDelete($db) {
    $user = vyzadujPrihlaseni();

    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) chyba('Chybí id komentáře', 400);

    try {
        // Fetch comment to check ownership
        $stmt = $db->prepare('SELECT user_id FROM lesson_comments WHERE id = ?');
        $stmt->execute([$id]);
        $comment = $stmt->fetch();
        if (!$comment) chyba('Komentář nenalezen', 404);

        // Check permission: own comment or admin
        $isAdmin = ($user['role'] ?? '') === 'admin';
        if ($comment['user_id'] !== $user['id'] && !$isAdmin) {
            chyba('Nemáš oprávnění smazat tento komentář', 403);
        }

        // Soft delete
        $stmt = $db->prepare(
            "UPDATE lesson_comments SET is_deleted = 1, content = '[Komentář byl smazán]' WHERE id = ?"
        );
        $stmt->execute([$id]);

        odpoved(['id' => $id, 'deleted' => true]);
    } catch (PDOException $e) {
        error_log('comments DELETE error: ' . $e->getMessage());
        chyba('Chyba při mazání komentáře', 500);
    }
}

// ─── HELPER: check if user liked a comment ───
function userLiked($db, $commentId, $userId) {
    try {
        $stmt = $db->prepare(
            'SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?'
        );
        $stmt->execute([$commentId, $userId]);
        return (bool)$stmt->fetchColumn();
    } catch (PDOException $e) {
        return false;
    }
}