<?php
declare(strict_types=1);

/**
 * Ensure a newly deployed account page cannot reuse an obsolete cached app.
 *
 * Run from the repository root:
 *   php tests/index-cache-bust-test.php
 */

$html = file_get_contents(__DIR__ . '/../index.html');
if (!is_string($html)) {
  fwrite(STDERR, "Unable to load index.html\n");
  exit(1);
}

if (!preg_match('/<script src="\/assets\/app\.js\?v=[^"]+"><\/script>/', $html)) {
  fwrite(STDERR, "FAIL index page must version its application script\n");
  exit(1);
}

if (!preg_match('/<link rel="stylesheet" href="\/assets\/styles\.css\?v=[^"]+">/', $html)) {
  fwrite(STDERR, "FAIL index page must version its stylesheet\n");
  exit(1);
}

fwrite(STDOUT, "PASS index page versions its application assets\n");
