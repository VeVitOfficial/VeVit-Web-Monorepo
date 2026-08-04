<?php
declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/orders/SnapshotIntegrity.php';

$left = ['b' => 2, 'a' => ['z' => 1, 'x' => 2], 'items' => [['b' => 2, 'a' => 1]]];
$right = ['items' => [['a' => 1, 'b' => 2]], 'a' => ['x' => 2, 'z' => 1], 'b' => 2];
test_assert_same(SnapshotIntegrity::hash($left), SnapshotIntegrity::hash($right), 'JSONB key reordering does not invalidate a snapshot');
$right['b'] = 3;
test_assert_true(SnapshotIntegrity::hash($left) !== SnapshotIntegrity::hash($right), 'content mutation changes snapshot hash');

test_complete('snapshot-integrity-test');
