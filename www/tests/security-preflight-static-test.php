<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$apps = ['account', 'store', 'tools', 'edu', 'home'];
$failures = [];
$checked = 0;

function preflight_source_files(string $root, array $apps): iterable
{
    foreach ($apps as $app) {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($root . '/' . $app, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if (!$file->isFile()) continue;
            $path = $file->getPathname();
            $relative = substr($path, strlen($root) + 1);
            if (preg_match('~/(?:tests|docs|vendor|node_modules|database|reports)/~', '/' . $relative)) continue;
            if (preg_match('~(?:\.min\.js|\.wasm|\.json|\.md)$~', $relative)) continue;
            if (!preg_match('~\.(?:html|php|js)$~', $relative)) continue;
            yield [$relative, $path];
        }
    }
}

function preflight_add_matches(
    array &$failures,
    string $relative,
    string $contents,
    string $label,
    string $pattern
): void {
    if (preg_match_all($pattern, $contents, $matches, PREG_OFFSET_CAPTURE) < 1) return;
    foreach ($matches[0] as [$match, $offset]) {
        $line = substr_count(substr($contents, 0, $offset), "\n") + 1;
        $failures[] = sprintf('%s:%d: %s (%s)', $relative, $line, $label, trim($match));
    }
}

foreach (preflight_source_files($root, $apps) as [$relative, $path]) {
    $contents = file_get_contents($path);
    if (!is_string($contents)) {
        $failures[] = $relative . ': unreadable';
        continue;
    }
    $checked++;

    if (preg_match('~\.(?:html|php)$~', $relative)) {
        preflight_add_matches(
            $failures,
            $relative,
            $contents,
            'inline script is incompatible with script-src self',
            '~<script\b(?![^>]*\bsrc\s*=)[^>]*>~i'
        );
        preflight_add_matches(
            $failures,
            $relative,
            $contents,
            'inline event handler is forbidden',
            '~\s(on(?:abort|auxclick|beforeinput|blur|change|click|error|focus|input|keydown|keypress|keyup|load|mousedown|mouseenter|mouseleave|mousemove|mouseout|mouseover|mouseup|reset|resize|scroll|submit|touchend|touchmove|touchstart))\s*=~i'
        );
        preflight_add_matches(
            $failures,
            $relative,
            $contents,
            'third-party script must be vendored',
            '~<script\b[^>]*\bsrc\s*=\s*["\']https?://[^"\']+["\'][^>]*>~i'
        );
    }

    if (str_ends_with($relative, '.js')) {
        preflight_add_matches(
            $failures,
            $relative,
            $contents,
            'dynamic code execution is forbidden',
            '~\b(?:new\s+Function|eval\s*\()~'
        );
    }
}

$frontendRoots = [
    'account/assets', 'account', 'store/assets', 'store', 'tools/assets',
    'tools/index.html', 'edu/js', 'edu/legacy', 'home/assets', 'home/index.html',
    'home/support.html',
];
foreach ($frontendRoots as $entry) {
    $path = $root . '/' . $entry;
    if (!file_exists($path)) continue;
    $files = is_dir($path)
        ? new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS))
        : [new SplFileInfo($path)];
    foreach ($files as $file) {
        if (!$file->isFile() || !preg_match('~\.(?:js|html|php)$~', $file->getFilename())) continue;
        $relative = substr($file->getPathname(), strlen($root) + 1);
        if (preg_match('~/(?:tests|docs|api|lib|vendor)/~', '/' . $relative)) continue;
        $contents = file_get_contents($file->getPathname());
        if (!is_string($contents)) continue;
        preflight_add_matches(
            $failures,
            $relative,
            $contents,
            'frontend root /api contract is forbidden',
            '~["\']/api/(?!account/)~'
        );
    }
}

if ($failures !== []) {
    fwrite(STDERR, "security-preflight-static: FAIL\n" . implode("\n", $failures) . "\n");
    exit(1);
}

fwrite(STDOUT, "security-preflight-static: PASS ({$checked} source files)\n");
