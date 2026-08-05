<?php
// Ověřuje, že všech 9 FFmpeg nástrojů má status 'working' v registry
// a že ffmpeg-wrapper.js má ENABLED = true.
// CI: php tests/ffmpeg-tools-structural-test.php
declare(strict_types=1);
chdir(__DIR__ . '/..');
require_once 'tools/includes/registry.php';

$failures = 0;
$ffmpegSlugs = ['audio-convert', 'audio-trim-normalize', 'video-convert', 'video-compress',
                'video-trim', 'video-extract-audio', 'video-to-gif', 'video-merge', 'video-target-size'];

foreach ($ffmpegSlugs as $slug) {
    $tool = get_tool($slug);
    if (!$tool) {
        printf("FAIL registry: %s neexistuje\n", $slug);
        $failures++;
        continue;
    }
    if ($tool['status'] !== 'working') {
        printf("FAIL status: %s má status '%s', očekáváno 'working'\n", $slug, $tool['status']);
        $failures++;
    } else {
        printf("PASS registry: %s status=working\n", $slug);
    }
}

$wrapper = file_get_contents('tools/assets/js/lib/ffmpeg-wrapper.js');
if (!$wrapper) {
    printf("FAIL: ffmpeg-wrapper.js nenalezen\n");
    $failures++;
} elseif (!preg_match('/var ENABLED\s*=\s*true/', $wrapper)) {
    printf("FAIL wrapper: ENABLED není true\n");
    $failures++;
} else {
    printf("PASS wrapper: ENABLED=true\n");
}

// Verifikuj, že tools/.htaccess obsahuje scoped wasm-unsafe-eval pro všech 9 slugů
$htaccess = file_get_contents('tools/.htaccess');
$missing = [];
foreach ($ffmpegSlugs as $slug) {
    if (strpos($htaccess, $slug) === false) {
        $missing[] = $slug;
    }
}
if ($missing) {
    printf("FAIL htaccess: tools/.htaccess neobsahuje: %s\n", implode(', ', $missing));
    $failures++;
} else {
    printf("PASS htaccess: wasm-unsafe-eval SetEnvIf pokrývá všech 9 nástrojů\n");
}

if ($failures > 0) {
    printf("\nffmpeg-tools-structural-test: FAIL (%d selhání)\n", $failures);
    exit(1);
}
printf("\nffmpeg-tools-structural-test: PASS\n");
