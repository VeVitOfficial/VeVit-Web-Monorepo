<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/orders/CaseQuantityAvailability.php';

$available = CaseQuantityAvailability::eligible(5, 1, 1, 1, 0);
test_assert_same(2, $available, 'eligible quantity subtracts final and active claim/return amounts');
test_assert_same(0, CaseQuantityAvailability::eligible(1, 1, 0, 0, 0), 'final consumption remains unavailable');
try {
    CaseQuantityAvailability::eligible(1, 1, 1, 0, 0);
    test_assert_true(false, 'negative eligibility must fail');
} catch (DomainException) {
    test_assert_true(true, 'over-allocation is rejected');
}
test_complete('case-quantity-availability-test');
