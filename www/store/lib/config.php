<?php

declare(strict_types=1);

final class StoreConfigurationException extends RuntimeException
{
}

/**
 * Loads only explicitly provided configuration. Values can come from a supplied
 * test array, environment variables, or legacy constants from config_secret.php.
 * No production secret is inferred from a hostname or source file.
 *
 * @param array<string, string|int|bool|null>|null $source
 * @return array<string, mixed>
 */
function store_load_config(?array $source = null): array
{
    $read = static function (string $key, mixed $default = null) use ($source): mixed {
        if ($source !== null && array_key_exists($key, $source)) {
            return $source[$key];
        }

        $environment = getenv($key);
        if ($environment !== false) {
            return $environment;
        }

        if (defined($key)) {
            return constant($key);
        }

        return $default;
    };

    $appEnv = strtolower(trim((string) $read('APP_ENV', 'production')));
    if (!in_array($appEnv, ['development', 'staging', 'production', 'test'], true)) {
        throw new StoreConfigurationException('APP_ENV is invalid.');
    }

    $appUrl = rtrim(trim((string) $read('APP_URL')), '/');
    if ($appUrl === '' || filter_var($appUrl, FILTER_VALIDATE_URL) === false) {
        throw new StoreConfigurationException('APP_URL must be a valid absolute URL.');
    }

    $urlParts = parse_url($appUrl);
    $scheme = $urlParts['scheme'] ?? '';
    if (!in_array($scheme, ['http', 'https'], true)) {
        throw new StoreConfigurationException('APP_URL must use HTTP or HTTPS.');
    }
    if ($appEnv === 'production' && $scheme !== 'https') {
        throw new StoreConfigurationException('Production APP_URL must use HTTPS.');
    }

    $supabaseUrl = rtrim(trim((string) $read('SUPABASE_URL')), '/');
    $supabaseSecretKey = trim((string) $read('SUPABASE_SECRET_KEY'));
    $databaseMode = strtolower(trim((string) $read(
        'STORE_DATABASE_MODE',
        $supabaseUrl !== '' && $supabaseSecretKey !== '' ? 'postgrest' : 'pdo'
    )));
    if (!in_array($databaseMode, ['pdo', 'postgrest'], true)) {
        throw new StoreConfigurationException('STORE_DATABASE_MODE is invalid.');
    }

    $dsn = trim((string) $read('DB_DSN'));
    if ($databaseMode === 'pdo' && $dsn === '') {
        $legacyHost = trim((string) $read('DB_HOST'));
        $legacyPort = trim((string) $read('DB_PORT', '5432'));
        $legacyName = trim((string) $read('DB_NAME'));
        if ($legacyHost !== '' && $legacyName !== '') {
            $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $legacyHost, $legacyPort, $legacyName);
        }
    }
    if ($databaseMode === 'pdo' && !str_starts_with($dsn, 'pgsql:')) {
        throw new StoreConfigurationException('A PostgreSQL DB_DSN is required.');
    }

    $dbUser = (string) $read('DB_USER');
    $dbPass = (string) $read('DB_PASS');
    if ($databaseMode === 'pdo' && ($dbUser === '' || $dbPass === '')) {
        throw new StoreConfigurationException('Database credentials are required.');
    }
    if ($databaseMode === 'postgrest') {
        if (filter_var($supabaseUrl, FILTER_VALIDATE_URL) === false
            || !str_starts_with($supabaseUrl, 'https://')
            || !str_starts_with($supabaseSecretKey, 'sb_secret_')) {
            throw new StoreConfigurationException('A valid Supabase URL and secret key are required for PostgREST.');
        }
    }

    $storagePath = rtrim((string) $read('APP_STORAGE_PATH'), DIRECTORY_SEPARATOR);
    if ($storagePath === '' || !str_starts_with($storagePath, DIRECTORY_SEPARATOR)) {
        throw new StoreConfigurationException('APP_STORAGE_PATH must be an absolute path outside the web root.');
    }
    $storageRealPath = realpath($storagePath);
    $applicationRoot = realpath(dirname(__DIR__));
    $storagePermissions = $storageRealPath === false ? false : fileperms($storageRealPath);
    if ($storageRealPath === false || is_link($storagePath) || !is_dir($storageRealPath) || !is_readable($storageRealPath)
        || !is_writable($storageRealPath) || $storagePermissions === false || ($storagePermissions & 0077) !== 0) {
        throw new StoreConfigurationException('APP_STORAGE_PATH must be a private readable and writable directory.');
    }
    if ($applicationRoot !== false
        && ($storageRealPath === $applicationRoot
            || str_starts_with($storageRealPath, $applicationRoot . DIRECTORY_SEPARATOR))) {
        throw new StoreConfigurationException('APP_STORAGE_PATH must be outside the application web root.');
    }

    $sessionName = (string) $read('SESSION_NAME', 'vevit_store_session');
    $sessionSecure = store_config_bool($read('SESSION_COOKIE_SECURE', $scheme === 'https'));
    if ($appEnv === 'production' && !$sessionSecure) {
        throw new StoreConfigurationException('Production sessions must use secure cookies.');
    }

    $sameSite = ucfirst(strtolower((string) $read('SESSION_COOKIE_SAMESITE', 'Lax')));
    if (!in_array($sameSite, ['Lax', 'Strict'], true)) {
        throw new StoreConfigurationException('SESSION_COOKIE_SAMESITE must be Lax or Strict.');
    }

    $allowedOrigins = array_values(array_filter(array_map(
        'trim',
        explode(',', (string) $read('STORE_ALLOWED_ORIGINS', ''))
    )));
    foreach ($allowedOrigins as $origin) {
        if (filter_var($origin, FILTER_VALIDATE_URL) === false) {
            throw new StoreConfigurationException('STORE_ALLOWED_ORIGINS contains an invalid URL.');
        }
    }

    $attachmentMaxBytes = (int) $read('CASE_ATTACHMENT_MAX_BYTES', 10 * 1024 * 1024);
    $attachmentMaxFiles = (int) $read('CASE_ATTACHMENT_MAX_FILES', 5);
    $attachmentAllowedMime = array_values(array_filter(array_map('trim', explode(',', (string) $read(
        'CASE_ATTACHMENT_ALLOWED_MIME',
        'image/jpeg,image/png,image/webp,application/pdf'
    )))));
    if ($attachmentMaxBytes < 1024 || $attachmentMaxBytes > 50 * 1024 * 1024
        || $attachmentMaxFiles < 1 || $attachmentMaxFiles > 20
        || array_diff($attachmentAllowedMime, ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])) {
        throw new StoreConfigurationException('Attachment limits or MIME allowlist are invalid.');
    }
    try {
        $trackingCarriers = json_decode((string) $read('TRACKING_CARRIER_ORIGINS_JSON', '{}'), true, 8, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        throw new StoreConfigurationException('TRACKING_CARRIER_ORIGINS_JSON must be valid JSON.');
    }
    if (!is_array($trackingCarriers)) throw new StoreConfigurationException('Tracking carrier configuration must be an object.');
    foreach ($trackingCarriers as $code => $origin) {
        if (!is_string($code) || !preg_match('/^[a-z0-9_-]{1,32}$/', $code) || !is_string($origin) || !str_starts_with($origin, 'https://') || filter_var($origin, FILTER_VALIDATE_URL) === false) {
            throw new StoreConfigurationException('Tracking carrier origin is invalid.');
        }
    }

    // VeVit Account integration.
    // [B1] Confirm me_url with VeVit Account team before production.
    // [B2] Confirm login_url and return_url parameter name before production.
    $vevitAccountMeUrl    = rtrim(trim((string) $read('VEVIT_ACCOUNT_ME_URL',    'https://vevit.cz/account/api/me.php')), '/');
    $vevitAccountLoginUrl = rtrim(trim((string) $read('VEVIT_ACCOUNT_LOGIN_URL', 'https://vevit.cz/account/login')),      '/');
    foreach (['vevit_account_me_url' => $vevitAccountMeUrl, 'vevit_account_login_url' => $vevitAccountLoginUrl] as $key => $url) {
        if (filter_var($url, FILTER_VALIDATE_URL) === false || !str_starts_with($url, 'https://')) {
            throw new StoreConfigurationException(strtoupper($key) . ' must be a valid https:// URL.');
        }
    }

    return [
        'app_env' => $appEnv,
        'app_url' => $appUrl,
        'storage_path' => $storageRealPath,
        'database' => [
            'mode' => $databaseMode,
            'dsn' => $dsn,
            'user' => $dbUser,
            'pass' => $dbPass,
            'supabase_url' => $supabaseUrl,
            'supabase_secret_key' => $supabaseSecretKey,
        ],
        'session' => [
            'name' => $sessionName,
            'path' => '/',
            'secure' => $sessionSecure,
            'same_site' => $sameSite,
        ],
        'stripe' => [
            'secret_key' => (string) $read('STRIPE_SECRET_KEY', ''),
            'webhook_secret' => (string) $read('STRIPE_WEBHOOK_SECRET', ''),
            'account_id' => (string) $read('STRIPE_ACCOUNT_ID', ''),
        ],
        'allowed_origins' => $allowedOrigins,
        'attachments' => [
            'max_bytes' => $attachmentMaxBytes,
            'max_files' => $attachmentMaxFiles,
            'allowed_mime' => $attachmentAllowedMime,
        ],
        'return_request_days' => max(1, min(365, (int) $read('RETURN_REQUEST_DAYS', 14))),
        'admin_reauth_seconds' => max(60, min(3600, (int) $read('ADMIN_REAUTH_SECONDS', 300))),
        'tracking_carriers' => $trackingCarriers,
        'vevit_account' => [
            'me_url'    => $vevitAccountMeUrl,    // [B1]
            'login_url' => $vevitAccountLoginUrl, // [B2]
        ],
    ];
}

function store_config_bool(mixed $value): bool
{
    if (is_bool($value)) {
        return $value;
    }

    $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($parsed === null) {
        throw new StoreConfigurationException('Boolean configuration value is invalid.');
    }

    return $parsed;
}

/** @param array<string, mixed> $config */
function store_connect_database(array $config): PDO
{
    $database = $config['database'];
    $pdo = new PDO($database['dsn'], $database['user'], $database['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    return $pdo;
}
