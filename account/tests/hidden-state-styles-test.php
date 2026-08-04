<?php
declare(strict_types=1);

/**
 * Regression check: component display rules must never override HTML's hidden
 * state (the account splash and signed-out gate both use display:flex).
 */

$css = file_get_contents(__DIR__ . '/../assets/styles.css');
if (!is_string($css)) {
  fwrite(STDERR, "Unable to load assets/styles.css\n");
  exit(1);
}

if (!preg_match('/\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/', $css)) {
  fwrite(STDERR, "FAIL hidden elements must override component display rules\n");
  exit(1);
}

fwrite(STDOUT, "PASS hidden elements override component display rules\n");
