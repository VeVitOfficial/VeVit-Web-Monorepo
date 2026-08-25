<?php
declare(strict_types=1);

/**
 * Regression check for the password-reset request endpoint.
 *
 * Run from the repository root:
 *   php tests/forgot-password-endpoint-test.php
 */

$source = file_get_contents(__DIR__ . '/../api/forgot-password.php');
if (!is_string($source)) {
  fwrite(STDERR, "Unable to load api/forgot-password.php\n");
  exit(1);
}

if (!str_contains($source, '$ip = clientIp($cfg);')) {
  fwrite(STDERR, "FAIL forgot-password must pass its server configuration to clientIp\n");
  exit(1);
}

fwrite(STDOUT, "PASS forgot-password passes configuration to clientIp\n");
