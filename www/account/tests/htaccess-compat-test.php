<?php
declare(strict_types=1);

/**
 * WEDOS-compatible Apache configuration checks.
 *
 * Run from the repository root:
 *   php tests/htaccess-compat-test.php
 */

$rules = file_get_contents(__DIR__ . '/../.htaccess');
if (!is_string($rules)) {
  fwrite(STDERR, "Unable to load .htaccess\n");
  exit(1);
}

if (str_contains($rules, '<DirectoryMatch')) {
  fwrite(STDERR, "FAIL .htaccess must not use DirectoryMatch\n");
  exit(1);
}

if (!str_contains($rules, 'RewriteRule ^lib/ - [F,L]')) {
  fwrite(STDERR, "FAIL .htaccess must block direct lib requests with RewriteRule\n");
  exit(1);
}
if (!str_contains($rules, 'RewriteRule ^vendor/ - [F,L]')) {
  fwrite(STDERR, "FAIL .htaccess must block direct Composer vendor requests\n");
  exit(1);
}

fwrite(STDOUT, "PASS .htaccess uses WEDOS-compatible library protection\n");
