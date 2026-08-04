#!/usr/bin/env php
<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];
$skipDirectories = ['.git', 'node_modules', 'vendor', 'uploads', 'logs', '.cache', '.playwright-cli'];
$skipExtensions = ['wasm', 'woff', 'woff2', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'ico', 'pdf', 'zip', 'gz'];
$dummyMarkers = ['replace-', 'example', 'test-key', 'test-value', '_test_', 'dummy', 'placeholder', 'your-project', 'your_', 'changeme'];

$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
foreach ($iterator as $file) {
    if (!$file->isFile()) continue;
    $relative = substr($file->getPathname(), strlen($root) + 1);
    $parts = explode(DIRECTORY_SEPARATOR, $relative);
    if (array_intersect($skipDirectories, $parts) !== []) continue;
    if (in_array(strtolower($file->getExtension()), $skipExtensions, true)) continue;
    if ($file->getSize() > 5 * 1024 * 1024) continue;
    $contents = file_get_contents($file->getPathname());
    if (!is_string($contents)) continue;

    $patterns = [
        'JWT token' => '~\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b~',
        'Supabase secret key' => '~\bsb_secret_[A-Za-z0-9_-]{10,}\b~',
        'hardcoded service role' => '~(?:SUPABASE_SERVICE_ROLE|service_role)["\']?\s*(?:=>|=)\s*["\']([^"\']{8,})["\']~i',
    ];
    foreach ($patterns as $label => $pattern) {
        if (preg_match_all($pattern, $contents, $matches, PREG_OFFSET_CAPTURE) < 1) continue;
        foreach ($matches[0] as $index => [$match, $offset]) {
            $candidate = strtolower((string) ($matches[1][$index][0] ?? $match));
            if (array_filter($dummyMarkers, static fn(string $marker): bool => str_contains($candidate, $marker)) !== []) continue;
            $line = substr_count(substr($contents, 0, $offset), "\n") + 1;
            $failures[] = "{$relative}:{$line}: {$label}";
        }
    }
}

if ($failures !== []) {
    fwrite(STDERR, "secret-scan: FAIL\n" . implode("\n", $failures) . "\n");
    exit(1);
}
fwrite(STDOUT, "secret-scan: PASS\n");
