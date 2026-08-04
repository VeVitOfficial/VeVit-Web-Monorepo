<?php
declare(strict_types=1);
require __DIR__ . '/test-lib.php';
require HUB_ROOT . '/includes/registry.php';
require HUB_ROOT . '/includes/icons.php';

$baseline = hub_baseline();
$tools = all_tools();
$slugs = [];
$statusCounts = [];
foreach ($tools as $tool) {
    foreach (['slug', 'name', 'description', 'category', 'processing_location', 'icon', 'new', 'keywords', 'aliases', 'status', 'availability', 'requirements', 'privacy_note', 'declared_test_target'] as $field) {
        hub_assert(array_key_exists($field, $tool), $tool['slug'] . ' missing ' . $field);
    }
    hub_assert(!isset($tool['verified_test_level']), $tool['slug'] . ' must not manually maintain verified_test_level');
    hub_assert((bool)preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $tool['slug']), 'invalid slug ' . $tool['slug']);
    hub_assert(!isset($slugs[$tool['slug']]), 'duplicate slug ' . $tool['slug']);
    $slugs[$tool['slug']] = true;
    hub_assert(in_array($tool['category'], CATEGORY_ORDER, true), $tool['slug'] . ' invalid category');
    hub_assert(in_array($tool['processing_location'], ['client', 'vevit_server', 'external_ai'], true), $tool['slug'] . ' invalid processing location');
    hub_assert(icon_svg($tool['icon']) !== '', $tool['slug'] . ' missing icon ' . $tool['icon']);
    hub_assert(is_bool($tool['new']) && is_array($tool['keywords']) && is_array($tool['aliases']), $tool['slug'] . ' invalid metadata type');
    hub_assert(in_array($tool['status'], TOOL_STATUSES, true), $tool['slug'] . ' invalid status');
    hub_assert(in_array($tool['availability'], TOOL_AVAILABILITY, true), $tool['slug'] . ' invalid availability');
    $pair = $tool['status'] . '+' . $tool['availability'];
    $statusCounts[$pair] = ($statusCounts[$pair] ?? 0) + 1;
    if ($tool['status'] === 'working') hub_assert($tool['availability'] === 'available', $tool['slug'] . ' working must be available');
    if ($tool['status'] === 'limited') hub_assert(in_array($tool['availability'], ['requires_external_service', 'requires_browser_support'], true), $tool['slug'] . ' invalid limited combination');
    if ($tool['status'] === 'experimental') hub_assert(in_array($tool['availability'], ['available', 'requires_external_service'], true), $tool['slug'] . ' invalid experimental combination');
    if ($tool['status'] === 'coming_soon') hub_assert(in_array($tool['availability'], ['not_implemented', 'requires_external_service'], true), $tool['slug'] . ' invalid coming_soon combination');
    if ($tool['status'] === 'unavailable_on_wedos') hub_assert($tool['availability'] === 'unavailable_on_wedos', $tool['slug'] . ' invalid WEDOS combination');
    if ($tool['status'] === 'broken' && $tool['availability'] === 'available') hub_assert(trim((string)($tool['note'] ?? '')) !== '', $tool['slug'] . ' broken available needs note');
    foreach (HUB_REQUIREMENT_KEYS as $key) hub_assert(isset($tool['requirements'][$key]) && is_array($tool['requirements'][$key]), $tool['slug'] . ' invalid requirements.' . $key);
    hub_assert(isset($tool['requirements']['verified']) && is_bool($tool['requirements']['verified']), $tool['slug'] . ' invalid requirements.verified');
}
hub_assert(count($tools) === $baseline['expected_unique_tool_count'], 'registry count ' . count($tools) . ' differs from approved baseline ' . $baseline['expected_unique_tool_count'] . ': ' . $baseline['expected_unique_tool_count_reason']);
hub_assert(count($slugs) === count($tools), 'registry unique slug count differs from registry count');
foreach ($baseline['informational_slugs'] as $slug) {
    $tool = get_tool($slug);
    hub_assert($tool !== null, 'missing informational tool ' . $slug);
}
echo json_encode(['ok' => true, 'tool_count' => count($tools), 'status_counts' => $statusCounts], JSON_UNESCAPED_UNICODE) . "\n";
