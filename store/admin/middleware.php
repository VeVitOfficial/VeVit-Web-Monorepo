<?php

declare(strict_types=1);

$secretConfigPath = __DIR__ . '/../config_secret.php';
if (!is_file($secretConfigPath) || !is_readable($secretConfigPath)) {
    error_log('[admin bootstrap] Missing or unreadable config_secret.php');
    http_response_code(500);
    exit('Služba je dočasně nedostupná.');
}

require_once $secretConfigPath;
require_once __DIR__ . '/../lib/config.php';
require_once __DIR__ . '/../lib/session.php';
require_once __DIR__ . '/../lib/auth/ActorContext.php';
require_once __DIR__ . '/../lib/admin/LegacyAdminActor.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    try {
        store_start_session(store_load_config()['session']);
    } catch (Throwable $exception) {
        error_log(sprintf('[admin bootstrap] %s', $exception->getMessage()));
        http_response_code(500);
        exit('Služba je dočasně nedostupná.');
    }
}

function requireAdmin(): void {
    if (empty($_SESSION['admin'])) {
        header('Location: auth.php');
        exit;
    }
}

function csrfToken(): string {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function validateCsrf(): void {
    $token = $_POST['csrf'] ?? '';
    if (!hash_equals($_SESSION['csrf'] ?? '', $token)) {
        http_response_code(403);
        die('Invalid CSRF token');
    }
}

function destroyAdminSession(): void {
    LegacyAdminActor::destroy($_SESSION);
    unset($_SESSION['admin'], $_SESSION['csrf'], $_SESSION['_store_csrf']);
    session_regenerate_id(true);
}
