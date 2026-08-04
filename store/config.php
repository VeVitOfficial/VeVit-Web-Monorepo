<?php

declare(strict_types=1);

// Configuration values live outside version control in config_secret.php.
require_once __DIR__ . '/lib/bootstrap.php';

$secretConfigPath = __DIR__ . '/config_secret.php';
if (!is_file($secretConfigPath) || !is_readable($secretConfigPath)) {
    error_log('[bootstrap] Missing or unreadable config_secret.php');
    http_response_code(500);
    exit('Služba je dočasně nedostupná.');
}

require_once $secretConfigPath;

try {
    $storeConfig = store_bootstrap();
    $pdo = store_connect_database($storeConfig);
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
