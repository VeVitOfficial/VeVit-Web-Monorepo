<?php
declare(strict_types=1);
require __DIR__ . '/test-lib.php';
require HUB_ROOT . '/includes/registry.php';

$server = hub_start_server();
try {
    $base = $server[2];
    $tested = 0;
    foreach (all_tools() as $tool) {
        $response = hub_http($base . '/tools/' . rawurlencode($tool['slug']));
        hub_assert($response['status'] === 200, $tool['slug'] . ' expected HTTP 200, got ' . $response['status']);
        hub_assert(!preg_match('/(?:Fatal error|Parse error|Uncaught (?:Error|Exception))/i', $response['body']), $tool['slug'] . ' exposes PHP fatal error');
        $text = html_entity_decode(strip_tags($response['body']), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        hub_assert(str_contains($text, $tool['name']), $tool['slug'] . ' missing expected title');
        $informational = in_array($tool['status'], ['coming_soon', 'unavailable_on_wedos', 'broken'], true);
        if ($informational) {
            hub_assert(str_contains($response['body'], 'tool-placeholder'), $tool['slug'] . ' missing information state');
            hub_assert(!str_contains($response['body'], 'id="tool-root"'), $tool['slug'] . ' renders an active working area');
            hub_assert(!str_contains($response['body'], '/tools/assets/js/tools/' . $tool['slug'] . '.js'), $tool['slug'] . ' loads a non-existent tool script');
        } else {
            hub_assert(str_contains($response['body'], 'id="tool-root"'), $tool['slug'] . ' missing main work area');
        }
        $tested++;
    }
    foreach (['/tools/not-a-real-tool', '/tools/%2e%2e%2fregistry'] as $path) hub_assert(hub_http($base . $path)['status'] === 404, $path . ' must return 404');
    echo "PASS route smoke: {$tested} routes\n";
} finally {
    hub_stop_server($server);
}
