<?php
// VeVit Edu API — Leaderboard endpoint
// GET /api/leaderboard — top 50 users by XP

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    chyba('Pouze GET', 405);
}

try {
    $db = dbAccount();
    $stmt = $db->query(
        'SELECT id, nickname, xp, level, role
         FROM users
         WHERE xp > 0
         ORDER BY xp DESC
         LIMIT 50'
    );
    $users = $stmt->fetchAll();

    // Add rank
    foreach ($users as $i => &$u) {
        $u['rank'] = $i + 1;
        $u['xp'] = (int)$u['xp'];
        $u['level'] = (int)$u['level'];
        unset($u['id']); // Don't expose UUID
    }

    odpoved($users);
} catch (PDOException $e) {
    error_log('leaderboard error: ' . $e->getMessage());
    chyba('Chyba při načítání leaderboardu', 500);
}