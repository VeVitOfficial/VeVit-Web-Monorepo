<?php
// VeVit Edu API — Authentication helpers
// Reads vevit_auth cookie (URL-decoded JSON from account.vevit.fun)

require_once __DIR__ . '/config.php';

/**
 * Get current VeVit user from cookie
 * @return array|null User data or null if not logged in
 */
function getVevitUser() {
    if (!isset($_COOKIE['vevit_auth'])) return null;
    try {
        $raw = $_COOKIE['vevit_auth'];
        $decoded = urldecode($raw);
        $user = json_decode($decoded, true);
        if (!$user || !isset($user['id'])) return null;
        return $user;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Require login — sends 401 if not authenticated
 * @return array User data
 */
function vyzadujPrihlaseni() {
    $user = getVevitUser();
    if (!$user) {
        chyba('Přihlášení vyžadováno', 401);
    }
    return $user;
}

/**
 * Get user XP/level from account DB
 * @param string $userId UUID
 * @return array|null
 */
function getUserXp($userId) {
    try {
        $db = dbAccount();
        $stmt = $db->prepare('SELECT id, nickname, xp, level, role FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        return $stmt->fetch() ?: null;
    } catch (PDOException $e) {
        error_log('getUserXp error: ' . $e->getMessage());
        return null;
    }
}