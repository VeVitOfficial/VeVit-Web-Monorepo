<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/http.php';

function store_request_id(): string
{
    return bin2hex(random_bytes(12));
}

/** @param array<string, scalar|array|null> $context */
function store_log_security_event(string $event, array $context = []): void
{
    $safeContext = array_filter($context, static fn (string $key): bool => !preg_match('/pass|secret|token|cookie/i', $key), ARRAY_FILTER_USE_KEY);
    error_log(json_encode([
        'event' => $event,
        'request_id' => $GLOBALS['store_request_id'] ?? null,
        'context' => $safeContext,
    ], JSON_UNESCAPED_SLASHES));
}

/** @return array<string, mixed> */
function store_bootstrap(): array
{
    $GLOBALS['store_request_id'] = store_request_id();
    $config = store_load_config();

    error_reporting(E_ALL);
    ini_set('display_errors', $config['app_env'] === 'development' ? '1' : '0');
    ini_set('log_errors', '1');

    set_exception_handler(static function (Throwable $exception): void {
        error_log(sprintf('[%s] Unhandled application error: %s', $GLOBALS['store_request_id'] ?? 'unknown', $exception->getMessage()));
        http_response_code(500);
        exit('Služba je dočasně nedostupná.');
    });

    store_start_session($config['session']);

    return $config;
}
