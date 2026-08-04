<?php
declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/orders/Money.php';

test_assert_same(12345, Money::decimalToMinor('123.45'), 'exact two-decimal conversion');
test_assert_same(12340, Money::decimalToMinor('123.4'), 'one decimal is padded');
test_assert_same(12300, Money::decimalToMinor('123'), 'whole number is exact');
foreach (['1.001', '-1.00', '1e2', 'NaN', ''] as $invalid) {
    try {
        Money::decimalToMinor($invalid);
        test_assert_true(false, "invalid money value {$invalid} must fail");
    } catch (InvalidArgumentException) {
    }
}
test_assert_same('123.45', Money::minorToDecimal(12345), 'minor conversion is exact');

test_complete('money-test');
