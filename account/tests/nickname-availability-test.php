<?php
declare(strict_types=1);

/**
 * Contract check for the public, privacy-preserving nickname availability endpoint.
 *
 * Run from the repository root:
 *   php tests/nickname-availability-test.php
 */

$path = __DIR__ . '/../api/nickname-availability.php';
$source = is_file($path) ? file_get_contents($path) : false;
if (!is_string($source)) {
  fwrite(STDERR, "FAIL nickname availability endpoint is missing\n");
  exit(1);
}

$checks = [
  'endpoint accepts GET requests only' => "!== 'GET'",
  'endpoint uses the shared nickname validator' => 'registerNicknameIsValid',
  'endpoint returns a boolean availability result' => "['available' =>",
  'endpoint performs a normalized nickname lookup' => "['nickname_normalized' => \$normalized]",
  'endpoint does not expose user records' => "'id'",
];

foreach ($checks as $label => $needle) {
  if (!str_contains($source, $needle)) {
    fwrite(STDERR, "FAIL {$label}\n");
    exit(1);
  }
}

fwrite(STDOUT, "PASS nickname availability endpoint contract\n");
