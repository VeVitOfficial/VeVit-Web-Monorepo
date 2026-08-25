<?php

declare(strict_types=1);

/** @param array{name:string,path:string,secure:bool,same_site:string} $config */
function store_session_cookie_settings(array $config): array
{
    if (preg_match('/^[A-Za-z0-9_-]{1,64}$/', $config['name']) !== 1) {
        throw new InvalidArgumentException('Session cookie name is invalid.');
    }
    if (!in_array($config['same_site'], ['Lax', 'Strict'], true)) {
        throw new InvalidArgumentException('Session SameSite setting is invalid.');
    }

    return [
        'name' => $config['name'],
        'cookie' => [
            'lifetime' => 0,
            'path' => $config['path'],
            'secure' => $config['secure'],
            'httponly' => true,
            'samesite' => $config['same_site'],
        ],
    ];
}

/** @param array{name:string,path:string,secure:bool,same_site:string} $config */
function store_start_session(array $config): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $settings = store_session_cookie_settings($config);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_secure', $settings['cookie']['secure'] ? '1' : '0');
    session_name($settings['name']);
    session_set_cookie_params($settings['cookie']);
    session_start();

    if (empty($_SESSION['_store_session_initialized'])) {
        session_regenerate_id(true);
        $_SESSION['_store_session_initialized'] = time();
    }
}

function store_regenerate_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        throw new LogicException('Cannot regenerate an inactive session.');
    }

    session_regenerate_id(true);
    $_SESSION['_store_session_regenerated_at'] = time();
}

function store_destroy_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return;
    }

    $params = session_get_cookie_params();
    $_SESSION = [];
    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $params['path'] ?: '/',
        'domain' => $params['domain'] ?? '',
        'secure' => (bool) ($params['secure'] ?? false),
        'httponly' => (bool) ($params['httponly'] ?? true),
        'samesite' => $params['samesite'] ?? 'Lax',
    ]);
    session_destroy();
}
