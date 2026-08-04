<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$roots = ['account', 'store', 'tools', 'edu', 'home'];
$failures = [];

foreach ($roots as $app) {
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/' . $app, FilesystemIterator::SKIP_DOTS));
    foreach ($files as $file) {
        if (!$file->isFile() || !preg_match('/\.(?:js|html)$/', $file->getFilename())) continue;
        $relative = substr($file->getPathname(), strlen($root) + 1);
        if (preg_match('~/(?:api|lib|tests|docs|vendor|node_modules|reports)/~', '/' . $relative)) continue;
        $source = file_get_contents($file->getPathname());
        if (!is_string($source)) continue;
        if (preg_match_all('~["\'`]/api/~', $source, $matches, PREG_OFFSET_CAPTURE)) {
            foreach ($matches[0] as [$match, $offset]) {
                $line = substr_count(substr($source, 0, $offset), "\n") + 1;
                $failures[] = "{$relative}:{$line}: kořenový /api/ kontrakt";
            }
        }
    }
}

$expectations = [
    'account/assets/app.js' => '/account/api/',
    'home/assets/js/account-session.js' => '/account/api/me.php',
    'tools/assets/js/lib/ai-tool.js' => '/tools/api/ai/ollama',
    'edu/legacy/js/shared/api.js' => '/edu/legacy/api/',
];
foreach ($expectations as $relative => $needle) {
    $source = file_get_contents($root . '/' . $relative);
    if (!is_string($source) || !str_contains($source, $needle)) {
        $failures[] = "{$relative}: chybí očekávaná cesta {$needle}";
    }
}

if ($failures !== []) {
    fwrite(STDERR, "path-routing-test: FAIL\n" . implode("\n", $failures) . "\n");
    exit(1);
}
fwrite(STDOUT, "path-routing-test: PASS\n");
