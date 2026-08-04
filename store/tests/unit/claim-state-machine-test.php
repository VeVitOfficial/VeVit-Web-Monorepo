<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/claims/ClaimStateMachine.php';

$machine = new ClaimStateMachine();
$allowed=[['submitted','under_review',[]],['submitted','waiting_for_customer',[]],['submitted','cancelled',[]],['under_review','waiting_for_customer',[]],['under_review','accepted',[]],['under_review','rejected',[]],['under_review','cancelled',[]],['waiting_for_customer','under_review',[]],['waiting_for_customer','accepted',[]],['waiting_for_customer','rejected',[]],['waiting_for_customer','cancelled',[]],['accepted','cancelled',[]]];
foreach($allowed as[$from,$to,$data])$machine->assertTransition($from,$to,$data);
$machine->assertTransition('accepted', 'resolved', ['resolution_outcome' => 'replacement', 'approved_quantity' => 1]);
try {
    $machine->assertTransition('resolved', 'submitted', []);
    test_assert_true(false, 'final claim cannot reopen');
} catch (DomainException) {
    test_assert_true(true, 'final claim transition is rejected');
}
try {
    $machine->assertTransition('accepted', 'resolved', []);
    test_assert_true(false, 'resolved claim requires outcome');
} catch (DomainException) {
    test_assert_true(true, 'missing resolution data is rejected');
}
test_complete('claim-state-machine-test');
