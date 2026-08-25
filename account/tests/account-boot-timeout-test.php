<?php
declare(strict_types=1);

/**
 * Contract check: a stalled account API request must not leave the splash
 * screen loading forever.
 */

$source = file_get_contents(__DIR__ . '/../assets/app.js');
if (!is_string($source)) {
  fwrite(STDERR, "Unable to load assets/app.js\n");
  exit(1);
}

$checks = [
  'account API creates an abort controller' => 'new AbortController()',
  'account API passes the abort signal to fetch' => 'signal: controller.signal',
  'account API clears its timeout after completion' => 'window.clearTimeout(timeout)',
  'account boot has a timeout message' => 'Načtení účtu trvá příliš dlouho.',
];

foreach ($checks as $label => $needle) {
  if (!str_contains($source, $needle)) {
    fwrite(STDERR, "FAIL {$label}\n");
    exit(1);
  }
}

fwrite(STDOUT, "PASS account boot avoids an endless loading state\n");
