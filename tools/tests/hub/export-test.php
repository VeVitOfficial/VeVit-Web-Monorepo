<?php
declare(strict_types=1);
require __DIR__ . '/test-lib.php';
require HUB_ROOT . '/includes/registry.php';

$output = '';
hub_assert(hub_command([PHP_BINARY, 'scripts/export-tools.php'], $output) === 0, 'export failed: ' . $output);
$first = (string)file_get_contents(HUB_ROOT . '/assets/data/tools.json');
$firstIndex = (string)file_get_contents(HUB_ROOT . '/assets/data/tools-index.json');
hub_assert(hub_command([PHP_BINARY, 'scripts/export-tools.php'], $output) === 0, 'second export failed: ' . $output);
hub_assert($first === (string)file_get_contents(HUB_ROOT . '/assets/data/tools.json'), 'tools.json is not deterministic');
hub_assert($firstIndex === (string)file_get_contents(HUB_ROOT . '/assets/data/tools-index.json'), 'tools-index.json is not deterministic');
hub_assert(hub_command([PHP_BINARY, 'scripts/export-tools.php', '--check'], $output) === 0, '--check failed: ' . $output);
$dataset = hub_json(HUB_ROOT . '/assets/data/tools.json');
$generatorDataset = hub_json(HUB_ROOT . '/assets/data/tools-index.json');
$tools = all_tools();
hub_assert(($dataset['schema_version'] ?? null) === 1, 'tools.json schema version');
hub_assert(count($dataset['tools'] ?? []) === count($tools), 'tools.json tool count differs from registry');
hub_assert(count(array_unique(array_column($dataset['tools'], 'slug'))) === count($tools), 'tools.json duplicate slug');
hub_assert(($dataset['source_digest'] ?? '') === ($generatorDataset['source_digest'] ?? null), 'datasets source digests differ');
hub_assert(($generatorDataset['icons'] ?? []) !== [], 'tools-index.json missing icons');
foreach ($dataset['tools'] as $tool) {
    hub_assert(isset($tool['verified_test_level']) && in_array($tool['verified_test_level'], HUB_VERIFIED_LEVELS, true), $tool['slug'] . ' invalid generated verified level');
    hub_assert(!array_key_exists('note', $tool) && !array_key_exists('desc', $tool) && !array_key_exists('loc', $tool), $tool['slug'] . ' exposes internal fields');
}
echo "PASS export: " . count($tools) . " tools\n";
