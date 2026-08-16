<?php

declare(strict_types=1);

// Configuration values live outside version control in config_secret.php.
require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/data-api.php';

$configuredPath = getenv('VEVIT_STORE_CONFIG');
$secretConfigCandidates = array_filter([
    is_string($configuredPath) && $configuredPath !== '' ? $configuredPath : null,
    dirname(__DIR__, 2) . '/config/store.php',
    __DIR__ . '/config_secret.php', // Legacy rollback only; remove after rollout.
]);
$secretConfigPath = null;
foreach ($secretConfigCandidates as $candidate) {
    if (is_file($candidate) && is_readable($candidate)) {
        $secretConfigPath = $candidate;
        break;
    }
}
if ($secretConfigPath === null) {
    error_log('[bootstrap] Missing or unreadable Store server configuration');
    http_response_code(500);
    exit('Služba je dočasně nedostupná.');
}

require_once $secretConfigPath;

try {
    $storeConfig = store_bootstrap();
    $pdo = null;
    $storeDataApi = null;
    if ($storeConfig['database']['mode'] === 'postgrest') {
        $storeDataApi = new StoreDataApi(
            $storeConfig['database']['supabase_url'],
            $storeConfig['database']['supabase_secret_key'],
        );
    } else {
        $pdo = store_connect_database($storeConfig);
    }
} catch (Throwable $exception) {
    error_log(sprintf('[bootstrap] %s', $exception->getMessage()));
    http_response_code(500);
    exit('Služba je dočasně nedostupná.');
}

function h(?string $text): string {
    return htmlspecialchars((string)$text, ENT_QUOTES, 'UTF-8');
}

require_once __DIR__ . '/lib/helpers.php';
require_once __DIR__ . '/lib/auth.php';
