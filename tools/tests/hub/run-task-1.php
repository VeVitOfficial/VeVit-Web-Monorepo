<?php
declare(strict_types=1);
require __DIR__ . '/test-lib.php';
require HUB_ROOT . '/includes/registry.php';

$startedAt = gmdate('c');
$commands = [
    'registry' => [PHP_BINARY, 'tests/hub/registry-test.php'],
    'assets' => [PHP_BINARY, 'tests/hub/assets-test.php'],
    'security_baseline' => [PHP_BINARY, 'tests/hub/security-baseline-test.php'],
    'export_pre_report' => [PHP_BINARY, 'tests/hub/export-test.php'],
    'index' => [PHP_BINARY, 'tests/hub/index-generation-test.php'],
    'route_smoke' => [PHP_BINARY, 'tests/hub/route-smoke-test.php'],
    'ssl_regression' => [PHP_BINARY, 'tests/ssl-checker-test.php'],
    'rate_limit_regression' => [PHP_BINARY, 'tests/request-rate-limit-test.php'],
    'ux_redesign' => [PHP_BINARY, 'tests/ux-redesign-test.php'],
];
$results = [];
foreach ($commands as $name => $command) {
    $output = '';
    $code = hub_command($command, $output);
    $results[] = ['name' => $name, 'command' => implode(' ', array_map('escapeshellarg', $command)), 'exit_code' => $code, 'output' => trim($output), 'verification' => 'automatic'];
    if ($code !== 0) {
        fwrite(STDERR, $output);
        exit($code ?: 1);
    }
}

$tools = all_tools();
$source = array_map(static function (array $tool): array { return public_tool_metadata($tool); }, $tools);
usort($source, static fn(array $a, array $b): int => strcmp($a['slug'], $b['slug']));
$digest = hash('sha256', json_encode($source, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
$levels = array_fill_keys(array_column($tools, 'slug'), 'structural');
$report = [
    'schema_version' => 1,
    'started_at_utc' => $startedAt,
    'generated_at_utc' => gmdate('c'),
    'project_path' => realpath(HUB_ROOT) ?: HUB_ROOT,
    'registry_digest' => $digest,
    'tool_count' => count($tools),
    'verified_test_levels' => $levels,
    'test_results' => $results,
    'notes' => ['verified_test_level is generated from completed Task 1 structural checks; browser and happy-path tests were not performed.'],
];
$reportPath = HUB_ROOT . '/reports/hub-tool-baseline.json';
if (!is_dir(dirname($reportPath))) mkdir(dirname($reportPath), 0755, true);
$temporary = tempnam(dirname($reportPath), '.hub-report-');
if ($temporary === false || file_put_contents($temporary, json_encode($report, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n", LOCK_EX) === false || !rename($temporary, $reportPath)) hub_fail('cannot write baseline report');
$output = '';
hub_assert(hub_command([PHP_BINARY, 'scripts/export-tools.php'], $output) === 0, 'post-report export failed: ' . $output);
hub_assert(hub_command([PHP_BINARY, 'scripts/export-tools.php', '--check'], $output) === 0, 'post-report export check failed: ' . $output);
echo 'PASS Task 1 test runner: ' . count($results) . " checks; generated report and verified structural levels.\n";
