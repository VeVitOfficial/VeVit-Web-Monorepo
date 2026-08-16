<?php
declare(strict_types=1);

$htaccessPath = dirname(__DIR__) . '/store/.htaccess';
$htaccess = file_get_contents($htaccessPath);

if ($htaccess === false) {
    fwrite(STDERR, "FAIL: nelze nacist store/.htaccess\n");
    exit(1);
}

if (preg_match('/^\s*php_(?:value|flag)\b/mi', $htaccess) === 1) {
    fwrite(STDERR, "FAIL: store/.htaccess obsahuje php_value/php_flag; na WEDOS PHP CGI/FPM to zpusobi HTTP 500 jeste pred spustenim PHP.\n");
    exit(1);
}

fwrite(STDOUT, "store-wedos-htaccess-test: PASS\n");
