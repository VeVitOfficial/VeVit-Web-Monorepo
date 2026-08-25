<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/audit/AuditService.php';

$data = AuditService::sanitize(['password' => 'x', 'cookie' => 'y', 'token' => 'z', 'safe' => 'ok', 'nested' => ['grant' => 'no']]);
test_assert_same(['safe' => 'ok', 'nested' => []], $data, 'audit sanitizer removes secrets recursively');
$clean = AuditService::sanitize(['user_agent' => "Browser\r\nInjected", 'long' => str_repeat('x', 5000)]);
test_assert_true(!str_contains($clean['user_agent'], "\n"), 'audit sanitizer strips header control characters');
test_assert_true(strlen($clean['long']) <= 2048, 'audit sanitizer bounds scalar strings');
test_complete('audit-service-test');
