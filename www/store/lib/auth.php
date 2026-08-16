<?php
declare(strict_types=1);

// Store nevydává ani neověřuje vlastní identitu. Všechny account-bound operace
// používají stejnou host-only relaci jako ostatní aplikace.
require_once dirname(__DIR__, 2) . '/shared/auth/session.php';

/** @return array<string,mixed> */
function store_account_session_config(): array
{
    global $storeConfig;
    return [
        'SUPABASE_URL' => (string) ($storeConfig['database']['supabase_url'] ?? ''),
        'SUPABASE_SECRET_KEY' => (string) ($storeConfig['database']['supabase_secret_key'] ?? ''),
        'COOKIE_DOMAIN' => 'account.vevit.cz',
    ];
}

/** @return array{state:'authenticated'|'anonymous'|'unavailable',user:?array<string,mixed>} */
function store_account_identity(): array
{
    if (isset($GLOBALS['_STORE_ACCOUNT_IDENTITY']) && is_array($GLOBALS['_STORE_ACCOUNT_IDENTITY'])) {
        return $GLOBALS['_STORE_ACCOUNT_IDENTITY'];
    }
    try {
        $user = vv_session_validate(store_account_session_config());
    } catch (VvDbException) {
        return $GLOBALS['_STORE_ACCOUNT_IDENTITY'] = ['state' => 'unavailable', 'user' => null];
    }
    if (!is_array($user)) {
        return $GLOBALS['_STORE_ACCOUNT_IDENTITY'] = ['state' => 'anonymous', 'user' => null];
    }
    return $GLOBALS['_STORE_ACCOUNT_IDENTITY'] = ['state' => 'authenticated', 'user' => $user];
}

function store_legacy_session_matches_account(array $legacySession, array $accountUser): bool
{
    $legacyUserId = $legacySession['user_id'] ?? null;
    $accountUserId = $accountUser['id'] ?? null;
    return is_string($legacyUserId) && $legacyUserId !== ''
        && is_string($accountUserId) && $accountUserId !== ''
        && hash_equals($accountUserId, $legacyUserId);
}

function store_retire_legacy_session(array $accountUser): void
{
    // Legacy Store identity se nikdy nepřenáší podle e-mailu ani přezdívky.
    // Při přesné shodě user_id je Account relace už autoritativní; při neshodě
    // lokální relaci také zahodíme, aby nemohla autorizovat cizí data.
    if (!empty($_SESSION['user_id'])) {
        store_log_security_event(
            store_legacy_session_matches_account($_SESSION, $accountUser)
                ? 'legacy_store_session_migrated'
                : 'legacy_store_session_rejected',
        );
        store_destroy_session();
    }
}

/**
 * @return array{id:string,email:string,full_name:string,nickname:string|null,avatar_url:string|null,tier:string|null}|null
 */
function getCurrentUser(): ?array
{
    $identity = store_account_identity();
    if ($identity['state'] !== 'authenticated' || !is_array($identity['user'])) {
        return null; // anonymní i výpadek Accountu jsou pro Store fail-closed
    }
    store_retire_legacy_session($identity['user']);
    return $identity['user'];
}

function store_account_is_unavailable(): bool
{
    return store_account_identity()['state'] === 'unavailable';
}

function requireLogin(): never
{
    global $storeConfig;
    if (store_account_is_unavailable()) {
        http_response_code(503);
        exit('Přihlášení je dočasně nedostupné.');
    }
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/store';
    $returnTo = is_string($requestUri) && str_starts_with($requestUri, '/') && !str_starts_with($requestUri, '//')
        ? $requestUri : '/store';
    header('Location: ' . ($storeConfig['vevit_account']['login_url'] ?? '/account/login')
        . '?return_to=' . rawurlencode($returnTo), true, 302);
    exit;
}

function logoutUser(): void
{
    // Store nemá vlastní login ani logout. Centrální odhlášení obstarává Account.
    store_destroy_session();
}
