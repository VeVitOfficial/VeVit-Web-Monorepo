#!/usr/bin/env php
<?php
/** Export the canonical PHP registry to deterministic public JSON. */
require_once __DIR__ . '/../includes/registry.php';

function export_fail(string $message): void {
    fwrite(STDERR, "Registry export failed: {$message}\n");
    exit(1);
}

const VERIFIED_LEVELS = ['none', 'structural', 'browser_smoke', 'happy_path'];
const REQUIREMENT_KEYS = ['browser_features', 'local_assets', 'php_extensions', 'external_services', 'hosting_constraints'];

function validate_tool(array $tool, array &$seen): void {
    $required = ['slug', 'name', 'description', 'category', 'processing_location', 'icon', 'new', 'keywords', 'aliases', 'status', 'availability', 'requirements', 'privacy_note', 'declared_test_target'];
    foreach ($required as $field) if (!array_key_exists($field, $tool)) export_fail("{$tool['slug']}: missing {$field}");
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $tool['slug'])) export_fail("invalid slug {$tool['slug']}");
    if (isset($seen[$tool['slug']])) export_fail("duplicate slug {$tool['slug']}");
    $seen[$tool['slug']] = true;
    if (!in_array($tool['category'], CATEGORY_ORDER, true)) export_fail("{$tool['slug']}: unknown category");
    if (!in_array($tool['processing_location'], ['client', 'vevit_server', 'external_ai'], true)) export_fail("{$tool['slug']}: invalid processing location");
    if (!in_array($tool['status'], TOOL_STATUSES, true) || !in_array($tool['availability'], TOOL_AVAILABILITY, true)) export_fail("{$tool['slug']}: invalid status or availability");
    if ($tool['status'] === 'working' && $tool['availability'] !== 'available') export_fail("{$tool['slug']}: working must be available");
    if ($tool['status'] === 'limited' && !in_array($tool['availability'], ['requires_external_service', 'requires_browser_support'], true)) export_fail("{$tool['slug']}: limited availability mismatch");
    if ($tool['status'] === 'experimental' && !in_array($tool['availability'], ['available', 'requires_external_service'], true)) export_fail("{$tool['slug']}: experimental availability mismatch");
    if ($tool['status'] === 'coming_soon' && !in_array($tool['availability'], ['not_implemented', 'requires_external_service'], true)) export_fail("{$tool['slug']}: coming_soon availability mismatch");
    if ($tool['status'] === 'unavailable_on_wedos' && $tool['availability'] !== 'unavailable_on_wedos') export_fail("{$tool['slug']}: WEDOS availability mismatch");
    if ($tool['status'] === 'broken' && $tool['availability'] === 'available' && trim((string)($tool['note'] ?? '')) === '') export_fail("{$tool['slug']}: broken available requires an explanation");
    if (!is_bool($tool['new']) || !is_array($tool['keywords']) || !is_array($tool['aliases'])) export_fail("{$tool['slug']}: invalid metadata types");
    if (!in_array($tool['declared_test_target'], TOOL_TEST_TARGETS, true)) export_fail("{$tool['slug']}: invalid declared test target");
    foreach (REQUIREMENT_KEYS as $key) {
        if (!isset($tool['requirements'][$key]) || !is_array($tool['requirements'][$key])) export_fail("{$tool['slug']}: invalid requirements.{$key}");
    }
    if (!array_key_exists('verified', $tool['requirements']) || !is_bool($tool['requirements']['verified'])) export_fail("{$tool['slug']}: invalid requirements.verified");
}

function source_digest(array $tools): string {
    $public = array_map(static function (array $tool): array {
        $copy = public_tool_metadata($tool);
        unset($copy['verified_test_level']);
        return $copy;
    }, $tools);
    return hash('sha256', json_encode($public, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
}

function verification_levels(array $tools, string $digest): array {
    $levels = array_fill_keys(array_column($tools, 'slug'), 'none');
    $path = __DIR__ . '/../reports/hub-tool-baseline.json';
    if (!is_file($path)) return $levels;
    try {
        $report = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable) {
        return $levels;
    }
    if (($report['schema_version'] ?? null) !== 1 || !hash_equals($digest, (string)($report['registry_digest'] ?? ''))) return $levels;
    foreach (($report['verified_test_levels'] ?? []) as $slug => $level) {
        if (isset($levels[$slug]) && in_array($level, VERIFIED_LEVELS, true)) $levels[$slug] = $level;
    }
    return $levels;
}

function public_payload(array $tools, array $categories, array $levels): array {
    return [
        'schema_version' => 1,
        'source_digest' => source_digest($tools),
        'categories' => $categories,
        'tools' => array_map(static function (array $tool) use ($levels): array {
            $public = public_tool_metadata($tool);
            $public['verified_test_level'] = $levels[$tool['slug']] ?? 'none';
            return $public;
        }, $tools),
    ];
}

function encode_json(array $payload): string {
    try {
        return json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n";
    } catch (Throwable $error) {
        export_fail('JSON encoding failed');
    }
}

function atomic_write(string $target, string $contents): void {
    $directory = dirname($target);
    if (!is_dir($directory) && !mkdir($directory, 0755, true)) export_fail('cannot create output directory');
    $temporary = tempnam($directory, '.tools-');
    if ($temporary === false) export_fail('cannot create temporary output');
    try {
        if (file_put_contents($temporary, $contents, LOCK_EX) === false || !rename($temporary, $target)) export_fail('atomic write failed');
    } finally {
        if (is_file($temporary)) unlink($temporary);
    }
}

$tools = all_tools();
$seen = [];
foreach ($tools as $tool) validate_tool($tool, $seen);
usort($tools, fn(array $a, array $b): int => strcmp($a['slug'], $b['slug']));
$categories = array_map(fn(string $id): array => ['id' => $id, 'name' => CATEGORY_LABELS[$id], 'description' => CATEGORY_DESCRIPTIONS[$id], 'color' => CATEGORY_COLORS[$id]], CATEGORY_ORDER);
$levels = verification_levels($tools, source_digest($tools));
$payload = public_payload($tools, $categories, $levels);
$indexPayload = $payload;
require_once __DIR__ . '/../includes/icons.php';
$iconNames = ['Box', 'ChevronDown', 'LogIn', 'Wrench', 'Zap', 'ShieldCheck', 'Gift', 'Search', 'ArrowLeft', 'Bug', 'Send', 'Server', 'Sparkles'];
foreach ($tools as $tool) $iconNames[] = $tool['icon'];
$indexPayload['icons'] = [];
foreach (array_values(array_unique($iconNames)) as $name) $indexPayload['icons'][$name] = icon_svg($name, 24);
$json = encode_json($payload);
$indexJson = encode_json($indexPayload);
$mode = $argv[1] ?? '';
if ($mode === '--stdout') {
    echo $json;
    exit(0);
}
if ($mode !== '' && $mode !== '--check') export_fail('unknown option');
$target = __DIR__ . '/../assets/data/tools.json';
$indexTarget = __DIR__ . '/../assets/data/tools-index.json';
if ($mode === '--check') {
    foreach ([$target => $json, $indexTarget => $indexJson] as $path => $expected) {
        if (!is_file($path) || !hash_equals($expected, (string)file_get_contents($path))) export_fail('generated dataset is missing or stale: ' . basename($path));
    }
    exit(0);
}
atomic_write($target, $json);
atomic_write($indexTarget, $indexJson);
