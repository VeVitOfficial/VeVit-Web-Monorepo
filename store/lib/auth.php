<?php
// VeVit Store — auth adapter (transitional state)
//
// Authentication authority is account.vevit.cz, not this application.
// This application MUST NOT verify passwords, create VeVit sessions, or
// issue its own authentication tokens.
//
// TRANSITIONAL: getCurrentUser() still reads the local store session
// (vevit_store_session). New sessions are no longer created; existing ones
// expire naturally. Server-side auth is a BLOCKER until VeVit Account provides
// a server-to-server contract (see lib/VevitAccount.php and docs/).
//
// loginUser() has been REMOVED. Passwords are no longer verified here.
// api/login.php now returns 410 Gone.

if (session_status() !== PHP_SESSION_ACTIVE) {
    if (function_exists('store_start_session') && isset($GLOBALS['storeConfig']['session'])) {
        store_start_session($GLOBALS['storeConfig']['session']);
    } else {
        session_start();
    }
}

/**
 * Return the currently authenticated user from the local store session.
 *
 * TRANSITIONAL: This reads the legacy vevit_store_session. It returns null
 * for all new visitors because no new sessions are created after loginUser()
 * was removed. Server-side user identity must eventually come from
 * VevitAccount::checkSession() once the server-to-server contract is known.
 * See lib/VevitAccount.php for details.
 *
 * @return array{id:string,email:string,full_name:string,nickname:string|null,avatar_url:string|null,tier:string|null}|null
 */
function getCurrentUser(): ?array {
    global $pdo;
    if (empty($_SESSION['user_id'])) return null;
    $stmt = $pdo->prepare(
        'SELECT id, email, full_name, nickname, avatar_url, tier FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    return $user ?: null;
}

/**
 * Redirect unauthenticated requests to VeVit Account login.
 *
 * For pages where a valid session is strictly required (e.g. download.php),
 * this redirects to account.vevit.cz/login with a return_url back to the
 * current page.
 *
 * [B2] The return_url parameter name must be confirmed with VeVit Account.
 */
function requireLogin(): never {
    global $storeConfig;
    $loginUrl  = $storeConfig['vevit_account']['login_url'] ?? 'https://vevit.cz/account/login';
    $appUrl    = rtrim($storeConfig['app_url'] ?? '', '/');
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $returnUrl = $appUrl ? ($appUrl . $requestUri) : '';

    if ($returnUrl && filter_var($returnUrl, FILTER_VALIDATE_URL)) {
        header('Location: ' . $loginUrl . '?return_url=' . urlencode($returnUrl), true, 302); // [B2]
    } else {
        header('Location: ' . $loginUrl, true, 302);
    }
    exit;
}

function logoutUser(): void {
    if (function_exists('store_destroy_session')) {
        store_destroy_session();
        return;
    }

    $_SESSION = [];
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => true,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
    session_destroy();
}
