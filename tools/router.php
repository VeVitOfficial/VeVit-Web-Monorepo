<?php
// Dev router pro PHP built-in server: `php -S localhost:3939 router.php`
// (php -S ignoruje .htaccess, proto routujeme zde. V produkci na Apache platí .htaccess.)

require_once __DIR__ . '/includes/config.php';

$uri = rawurldecode((string)parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$root = __DIR__;

function vv_dev_static(string $file): bool {
    if (!is_file($file)) return false;
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    $types = [
        'css' => 'text/css; charset=utf-8', 'js' => 'text/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8', 'svg' => 'image/svg+xml',
        'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
        'webp' => 'image/webp', 'ico' => 'image/x-icon', 'wasm' => 'application/wasm',
        'woff2' => 'font/woff2', 'woff' => 'font/woff',
    ];
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    header('Cache-Control: no-cache');
    readfile($file);
    return true;
}

// Built-in PHP server nečte .htaccess. Odmítni traversal a interní includy.
if (str_contains($uri, "\0") || str_contains($uri, '\\') || preg_match('#(?:^|/)\.\.(?:/|$)#', $uri) || str_starts_with($uri, '/includes/')) {
    http_response_code(404);
    echo '404 — stránka nebyla nalezena.';
    return true;
}
if (preg_match('#/(?:\.env(?:\..*)?|.*\.(?:log|sql|bak|backup))$#i', $uri)) {
    http_response_code(404);
    echo '404 — stránka nebyla nalezena.';
    return true;
}

// 1) Statické soubory. Produkce používá /tools/assets pro tool bundle a
// /assets pro společné VeVit assety; dev router musí zachovat stejné URL.
if (preg_match('#^/tools/assets/(.+)$#', $uri, $m) && !str_contains($m[1], '..')) {
    if (vv_dev_static($root . '/assets/' . $m[1])) return true;
}
if (preg_match('#^/assets/#', $uri)) {
    $relative = substr($uri, strlen('/assets/'));
    if (!str_contains($relative, '..') && vv_dev_static(dirname($root) . '/assets/' . $relative)) return true;
}

// 2) Kořen — statický landing (index.html).
if ($uri === '/' || $uri === '') {
    header('Content-Type: text/html; charset=utf-8');
    readfile($root . '/index.html');
    return true;
}

// 3) Pretty URL nástroje: /tools/<slug>
if (preg_match('#^/tools/([a-z0-9-]+)/?$#', $uri, $m)) {
    $_GET['slug'] = $m[1];
    $_SERVER['REQUEST_URI'] = $uri;
    require $root . '/tools.php';
    return true;
}

// 4) AI proxy: /tools/api/ai/ollama
if (preg_match('#^/tools/api/ai/ollama/?$#', $uri)) {
    require $root . '/api/ai/ollama.php';
    return true;
}

// 5) favicon.
if ($uri === '/favicon.ico') {
    $f = $root . '/tools/assets/favicon.ico';
    if (file_exists($f)) {
        header('Content-Type: image/x-icon');
        readfile($f);
        return true;
    }
}

// 6) Ostatní existující soubory (např. /robots.txt) — nech server.
if ($uri !== '/' && file_exists($root . $uri) && is_file($root . $uri)) {
    return false;
}

// 7) 404.
http_response_code(404);
echo '404 — stránka nebyla nalezena.';
return true;
