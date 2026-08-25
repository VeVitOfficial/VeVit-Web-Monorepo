<?php
declare(strict_types=1);
require __DIR__ . '/test-lib.php';
require HUB_ROOT . '/includes/registry.php';

$output = '';
hub_assert(hub_command(['python3', 'scripts/generate-index.py'], $output) === 0, 'index generation failed: ' . $output);
$first = (string)file_get_contents(HUB_ROOT . '/index.html');
hub_assert(hub_command(['python3', 'scripts/generate-index.py'], $output) === 0, 'second index generation failed: ' . $output);
hub_assert($first === (string)file_get_contents(HUB_ROOT . '/index.html'), 'index.html is not deterministic');
$datasetPath = HUB_ROOT . '/assets/data/tools-index.json';
$hiddenDatasetPath = $datasetPath . '.task1-test';
hub_assert(rename($datasetPath, $hiddenDatasetPath), 'cannot temporarily hide generator dataset');
try {
    hub_assert(hub_command(['python3', 'scripts/generate-index.py'], $output) !== 0, 'generator must fail without structured dataset');
    hub_assert($first === (string)file_get_contents(HUB_ROOT . '/index.html'), 'generator failure overwrote index.html');
} finally {
    hub_assert(rename($hiddenDatasetPath, $datasetPath), 'cannot restore generator dataset');
}
$html = (string)file_get_contents(HUB_ROOT . '/index.html');
foreach (['data-slug=', 'data-category=', 'data-processing-location=', 'data-status=', 'data-new='] as $attribute) hub_assert(substr_count($html, $attribute) >= count(all_tools()), 'missing generated ' . $attribute);
preg_match_all('/class="tool-card"[^>]*data-slug="([^"]+)"/', $html, $matches);
$rendered = $matches[1] ?? [];
hub_assert(count(array_unique($rendered)) === count(all_tools()), 'generated index does not contain every unique tool slug');
hub_assert(count($rendered) > count(all_tools()), 'new-tools section is expected to repeat visual cards; test invariant no longer documents the distinction');
hub_assert(!str_contains($html, 'VeVit Store') && !str_contains($html, 'store/api/health'), 'index contains removed Store content');
foreach (['pdf-password' => 'Nedostupné na WEDOS', 'screenshot-tool' => 'Nedostupné na WEDOS', 'ai-image-gen' => 'Připravujeme'] as $slug => $label) {
    hub_assert(str_contains($html, 'data-slug="' . $slug . '"') && str_contains($html, $label), 'informational card missing truthful status for ' . $slug);
}
echo 'PASS index: unique=' . count(array_unique($rendered)) . ' rendered_cards=' . count($rendered) . "\n";
