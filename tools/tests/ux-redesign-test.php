<?php
declare(strict_types=1);

$root = dirname(__DIR__);
require $root . '/includes/registry.php';

function ux_assert(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL UX redesign: {$message}\n");
        exit(1);
    }
}

$tools = all_tools();
ux_assert(count($tools) === 107, 'registry must contain exactly 107 tools');

$templates = glob($root . '/includes/tools/*.php') ?: [];
$controllers = glob($root . '/assets/js/tools/*.js') ?: [];
ux_assert(count($templates) === 104, 'expected 104 interactive templates');
ux_assert(count($controllers) === 104, 'expected 104 interactive controllers');

$shell = file_get_contents($root . '/tools.php') ?: '';
foreach (['data-tool-state="idle"', 'tool-live-status', 'tool-steps', 'tool-trust', 'tool-ui-i18n'] as $hook) {
    ux_assert(str_contains($shell, $hook), "missing shared shell hook {$hook}");
}

$toolUi = file_get_contents($root . '/assets/js/lib/tool-ui.js') ?: '';
foreach (['function lifecycle(', 'function resultCard(', 'function forceDownload(', 'AbortController', 'MutationObserver'] as $hook) {
    ux_assert(str_contains($toolUi, $hook), "missing ToolUI capability {$hook}");
}

$referenceKeys = null;
foreach (['cs', 'en', 'de', 'es', 'uk', 'fr', 'sk'] as $locale) {
    $dictionary = require $root . '/lang/' . $locale . '.php';
    $keys = array_keys($dictionary);
    sort($keys);
    $referenceKeys ??= $keys;
    ux_assert($keys === $referenceKeys, "locale key mismatch for {$locale}");
    foreach (['tool_ui.state_idle', 'tool_ui.state_processing', 'tool_ui.result_ready', 'tool_page.processing_title'] as $key) {
        ux_assert(isset($dictionary[$key]) && $dictionary[$key] !== '', "{$locale} misses {$key}");
    }
}

$pilotHooks = [
    'pdf-rotate' => ['pr-preview', 'pr-selection'],
    'pdf-organize' => ['po-undo', 'pdf-page-grid'],
    'image-crop' => ['cr-result-preview', 'crop-fields', "['x' => 'X', 'y' => 'Y', 'w' => 'W', 'h' => 'H']"],
    'video-trim' => ['vt2-preview', 'vt2-cancel', 'vt2-start-range'],
    'json-formatter' => ['jf-download', 'jf-input-meta'],
    'ai-chat' => ['ai-starter', 'ai-new', 'ai-disclaimer'],
    'loan-calc' => ['ln-extra', 'loan-chart', 'ln-print'],
];
foreach ($pilotHooks as $slug => $hooks) {
    $template = file_get_contents($root . '/includes/tools/' . $slug . '.php') ?: '';
    foreach ($hooks as $hook) ux_assert(str_contains($template, $hook), "{$slug} misses {$hook}");
}

foreach (['ai-image-gen', 'pdf-password', 'screenshot-tool'] as $slug) {
    $tool = get_tool($slug);
    ux_assert($tool !== null && in_array($tool['status'], ['coming_soon', 'unavailable_on_wedos'], true), "{$slug} must remain information-only");
}

echo "PASS UX redesign: shared foundation, locale parity, 107 inventory and pilot hooks verified.\n";
