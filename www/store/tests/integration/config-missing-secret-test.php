<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

$command = sprintf(
    '%s -d display_errors=1 %s',
    escapeshellarg(PHP_BINARY),
    escapeshellarg(__DIR__ . '/../../config.php')
);
exec($command, $lines, $exitCode);
$output = implode("\n", $lines);

test_assert_true(str_contains($output, 'Služba je dočasně nedostupná.'), 'missing secret must return a generic public error');
test_assert_true(!str_contains($output, 'config_secret.php'), 'missing secret response must not expose the secret file path');
test_assert_true(!str_contains($output, 'Fatal error'), 'missing secret response must not expose a PHP fatal error');

test_complete('config-missing-secret-test');
