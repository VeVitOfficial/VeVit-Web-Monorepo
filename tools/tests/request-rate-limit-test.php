<?php
require_once __DIR__ . '/../includes/request-rate-limit.php';

function expect_rate(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

$directory = sys_get_temp_dir() . '/vevit-rate-limit-test-' . bin2hex(random_bytes(4));
mkdir($directory, 0700, true);
try {
    $one = request_rate_limit_consume('test', '203.0.113.5', 60, 2, $directory);
    $two = request_rate_limit_consume('test', '203.0.113.5', 60, 2, $directory);
    $three = request_rate_limit_consume('test', '203.0.113.5', 60, 2, $directory);
    expect_rate($one === ['allowed' => true, 'available' => true], 'first request should pass');
    expect_rate($two === ['allowed' => true, 'available' => true], 'second request should pass');
    expect_rate($three === ['allowed' => false, 'available' => true], 'third request should be limited');
    $unavailable = request_rate_limit_consume('test', '203.0.113.5', 60, 2, $directory . '/missing');
    expect_rate($unavailable === ['allowed' => false, 'available' => false], 'missing storage must be reported');
    echo "request rate limit tests: PASS\n";
} finally {
    foreach (glob($directory . '/*') ?: [] as $file) unlink($file);
    rmdir($directory);
}
