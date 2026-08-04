<?php
declare(strict_types=1);

$source = file_get_contents(__DIR__ . '/../edu/api/wikipedia.php');
if ($source === false) {
    throw new RuntimeException('Nelze načíst Wikipedia proxy.');
}

$required = [
    "['cs', 'en', 'de', 'uk', 'es']",
    'CURLOPT_FOLLOWLOCATION => false',
    'CURLOPT_CONNECTTIMEOUT => 2',
    'CURLOPT_TIMEOUT => 6',
    'CURLOPT_PROTOCOLS => CURLPROTO_HTTPS',
    "if (\$action === 'parse')",
    '2 * 1024 * 1024',
    'vevit_wikipedia_sanitize_html',
];
foreach ($required as $needle) {
    if (!str_contains($source, $needle)) {
        throw new RuntimeException("Wikipedia proxy postrádá bezpečnostní kontrakt: {$needle}");
    }
}

if (preg_match('~https://\s*[.\$\{]~', $source) === 1) {
    throw new RuntimeException('Wikipedia proxy skládá hostitele z neověřeného vstupu.');
}

fwrite(STDOUT, "wikipedia-proxy-contract-test: PASS\n");
