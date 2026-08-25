<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/database/Transactional.php';

$pdo = new class extends PDO {
    public bool $committed = false;
    public bool $rolledBack = false;
    public function __construct() {}
    public function beginTransaction(): bool { return true; }
    public function commit(): bool { $this->committed = true; return true; }
    public function rollBack(): bool { $this->rolledBack = true; return true; }
    public function inTransaction(): bool { return !$this->committed && !$this->rolledBack; }
};

$value = Transactional::run($pdo, static fn (): string => 'ok');
test_assert_same('ok', $value, 'transaction returns operation value');
test_assert_same(true, $pdo->committed, 'transaction commits successful operation');

$failedPdo = new class extends PDO {
    public bool $rolledBack = false;
    public function __construct() {}
    public function beginTransaction(): bool { return true; }
    public function commit(): bool { return true; }
    public function rollBack(): bool { $this->rolledBack = true; return true; }
    public function inTransaction(): bool { return !$this->rolledBack; }
};
try {
    Transactional::run($failedPdo, static function (): never { throw new RuntimeException('audit insert failed'); });
    test_assert_true(false, 'failed operation must throw');
} catch (RuntimeException $exception) {
    test_assert_same('audit insert failed', $exception->getMessage(), 'transaction preserves failure');
}
test_assert_same(true, $failedPdo->rolledBack, 'transaction rolls back failed operation');

test_complete('transactional-test');
