<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$required = [
    'assets/css/vevit-tailwind.css', 'assets/fonts/vevit-fonts.css',
    'assets/vendor/lucide/lucide.min.js', 'assets/vendor/katex/katex.min.js',
    'assets/vendor/katex/katex.min.css', 'assets/vendor/prism/prism.js',
    'assets/vendor/prism/prism-tomorrow.min.css', 'assets/vendor/markjs/mark.min.js',
];
$failures = [];
foreach ($required as $relative) {
    if (!is_file($root . '/' . $relative) || filesize($root . '/' . $relative) === 0) {
        $failures[] = "chybí lokální asset {$relative}";
    }
}

foreach (['account', 'store', 'tools', 'edu', 'home'] as $app) {
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/' . $app, FilesystemIterator::SKIP_DOTS));
    foreach ($files as $file) {
        if (!$file->isFile() || !preg_match('/\.(?:html|php)$/', $file->getFilename())) continue;
        $relative = substr($file->getPathname(), strlen($root) + 1);
        if (preg_match('~/(?:tests|docs|vendor|node_modules)/~', '/' . $relative)) continue;
        $source = file_get_contents($file->getPathname());
        if (is_string($source) && preg_match('~<(?:script|link)\b[^>]*(?:src|href)=["\']https?://~i', $source)) {
            $failures[] = "{$relative}: vzdálený script nebo stylesheet";
        }
    }
}

$fontCss = file_get_contents($root . '/assets/fonts/vevit-fonts.css');
if (!is_string($fontCss) || preg_match('~url\(https?://~i', $fontCss)) {
    $failures[] = 'font CSS stále odkazuje mimo origin';
}

if ($failures !== []) {
    fwrite(STDERR, "local-assets-test: FAIL\n" . implode("\n", $failures) . "\n");
    exit(1);
}
fwrite(STDOUT, "local-assets-test: PASS\n");
