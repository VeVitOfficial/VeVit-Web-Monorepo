<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/wikipedia-sanitize.php';

header('Cache-Control: public, max-age=300');
header('X-Content-Type-Options: nosniff');

function wikipedia_error(int $status, string $message): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function wikipedia_fetch(string $url, int $maxBytes, string $accept): array
{
    $body = '';
    $tooLarge = false;
    $handle = curl_init($url);
    if ($handle === false) {
        wikipedia_error(503, 'Wikipedia proxy není dostupná.');
    }
    curl_setopt_array($handle, [
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT => 6,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_HTTPHEADER => ['Accept: ' . $accept, 'User-Agent: VeVitEdu/1.0 (+https://vevit.cz/edu)'],
        CURLOPT_WRITEFUNCTION => static function ($curl, string $chunk) use (&$body, &$tooLarge, $maxBytes): int {
            if (strlen($body) + strlen($chunk) > $maxBytes) {
                $tooLarge = true;
                return 0;
            }
            $body .= $chunk;
            return strlen($chunk);
        },
    ]);
    $ok = curl_exec($handle);
    $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    $contentType = (string) curl_getinfo($handle, CURLINFO_CONTENT_TYPE);
    $error = curl_error($handle);
    curl_close($handle);

    if ($tooLarge) wikipedia_error(502, 'Odpověď Wikipedie překročila povolenou velikost.');
    if ($ok === false) wikipedia_error(503, $error !== '' ? 'Wikipedia je dočasně nedostupná.' : 'Chyba spojení s Wikipedií.');
    if ($status < 200 || $status >= 300) wikipedia_error($status === 404 ? 404 : 502, 'Wikipedia vrátila chybu.');
    return [$body, $contentType];
}

$action = (string) ($_GET['action'] ?? '');
$allowedLanguages = ['cs', 'en', 'de', 'uk', 'es'];
$language = strtolower(trim((string) ($_GET['lang'] ?? 'cs')));
if (!in_array($language, $allowedLanguages, true)) {
    wikipedia_error(400, 'Nepovolený jazyk Wikipedie.');
}

if ($action === 'search') {
    $query = trim((string) ($_GET['q'] ?? ''));
    if ($query === '' || mb_strlen($query) > 200) wikipedia_error(400, 'Neplatný vyhledávací dotaz.');
    $limit = max(1, min(5, (int) ($_GET['limit'] ?? 1)));
    $url = 'https://' . $language . '.wikipedia.org/w/rest.php/v1/search/page?q=' . rawurlencode($query) . '&limit=' . $limit;
    [$body, $contentType] = wikipedia_fetch($url, 512 * 1024, 'application/json');
    if (!str_contains(strtolower($contentType), 'json') || json_decode($body, true) === null) wikipedia_error(502, 'Wikipedia vrátila neplatná data.');
    header('Content-Type: application/json; charset=utf-8');
    echo $body;
    exit;
}

if ($action === 'article') {
    $key = trim((string) ($_GET['key'] ?? ''));
    if ($key === '' || mb_strlen($key) > 300 || preg_match('/[\x00-\x1f]/', $key)) wikipedia_error(400, 'Neplatný klíč článku.');
    $url = 'https://' . $language . '.wikipedia.org/api/rest_v1/page/html/' . rawurlencode($key);
    [$body, $contentType] = wikipedia_fetch($url, 2 * 1024 * 1024, 'text/html');
    if (!str_contains(strtolower($contentType), 'html')) wikipedia_error(502, 'Wikipedia vrátila neočekávaný formát.');
    header('Content-Type: text/html; charset=utf-8');
    echo vevit_wikipedia_sanitize_html($body);
    exit;
}

if ($action === 'parse') {
    $title = trim((string) ($_GET['title'] ?? ''));
    if ($title === '' || mb_strlen($title) > 300 || preg_match('/[\x00-\x1f]/', $title)) {
        wikipedia_error(400, 'Neplatný název článku.');
    }
    $url = 'https://' . $language . '.wikipedia.org/w/api.php?action=parse&page=' . rawurlencode($title)
        . '&prop=text%7Csections%7Cdisplaytitle&mobileformat=1&format=json&redirects=1';
    [$body, $contentType] = wikipedia_fetch($url, 2 * 1024 * 1024, 'application/json');
    $decoded = json_decode($body, true);
    if (!str_contains(strtolower($contentType), 'json') || !is_array($decoded)) {
        wikipedia_error(502, 'Wikipedia vrátila neplatná data.');
    }
    if (isset($decoded['error']) || !is_array($decoded['parse'] ?? null) || !is_array($decoded['parse']['text'] ?? null)) {
        wikipedia_error(404, 'Článek nebyl nalezen.');
    }

    $parse = $decoded['parse'];
    $sections = [];
    foreach (is_array($parse['sections'] ?? null) ? $parse['sections'] : [] as $section) {
        if (!is_array($section)) continue;
        $sections[] = [
            'anchor' => mb_substr(strip_tags((string) ($section['anchor'] ?? '')), 0, 300),
            'line' => mb_substr(html_entity_decode(strip_tags((string) ($section['line'] ?? '')), ENT_QUOTES | ENT_HTML5, 'UTF-8'), 0, 500),
            'toclevel' => (int) ($section['toclevel'] ?? 0),
        ];
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'title' => mb_substr(html_entity_decode(strip_tags((string) ($parse['displaytitle'] ?? $title)), ENT_QUOTES | ENT_HTML5, 'UTF-8'), 0, 500),
        'content' => vevit_wikipedia_sanitize_html((string) ($parse['text']['*'] ?? '')),
        'sections' => $sections,
        'pageid' => isset($parse['pageid']) ? (int) $parse['pageid'] : null,
        'lang' => $language,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

wikipedia_error(400, 'Neplatná akce proxy.');
