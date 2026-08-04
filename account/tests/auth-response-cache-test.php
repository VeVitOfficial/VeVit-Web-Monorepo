<?php
declare(strict_types=1);

/**
 * Authenticated HTML and JSON responses must not be cached by a browser or
 * intermediary because their content and session state are user-specific.
 */

$files = [
  'index.php' => __DIR__ . '/../index.php',
  'lib/auth-helpers.php' => __DIR__ . '/../lib/auth-helpers.php',
];

foreach ($files as $label => $path) {
  $source = file_get_contents($path);
  if (!is_string($source) || !str_contains($source, "Cache-Control: no-store, private, max-age=0")) {
    fwrite(STDERR, "FAIL {$label} must prevent private response caching\n");
    exit(1);
  }
}

fwrite(STDOUT, "PASS authenticated responses prevent stale cache reuse\n");
