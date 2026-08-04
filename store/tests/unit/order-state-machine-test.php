<?php
declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/orders/OrderStateMachine.php';

$machine = new OrderStateMachine();
test_assert_true($machine->canTransitionPayment('pending_checkout', 'awaiting_payment'), 'checkout may start awaiting payment');
test_assert_true($machine->canTransitionPayment('awaiting_payment', 'paid'), 'verified payment may become paid');
test_assert_true($machine->canTransitionPayment('paid', 'paid'), 'same final state is an idempotent no-op');
test_assert_true(!$machine->canTransitionPayment('paid', 'failed'), 'late failure may not overwrite paid');
test_assert_true(!$machine->canTransitionPayment('cancelled', 'paid'), 'cancelled order may not become paid automatically');
test_assert_true($machine->canTransitionFulfillment('pending', 'ready'), 'paid order may become ready');
test_assert_true($machine->canTransitionFulfillment('pending', 'manual_review'), 'stock conflict may require review');
test_assert_true(!$machine->canTransitionFulfillment('fulfilled', 'pending'), 'fulfilled order may not regress');
test_assert_same('paid', $machine->orderStatusFor('paid', 'ready'), 'ready paid order has paid display state');
test_assert_same('manual_review', $machine->orderStatusFor('paid', 'manual_review'), 'stock conflict has manual review display state');

test_complete('order-state-machine-test');
