<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/delivery/DeliveryStateMachine.php';
$machine = new DeliveryStateMachine();
$allowed=[['pending','prepared',[]],['pending','cancelled',[]],['prepared','cancelled',[]],['handed_to_carrier','in_transit',[]],['handed_to_carrier','delivery_exception',[]],['in_transit','delivery_exception',[]],['delivery_exception','prepared',[]],['delivery_exception','handed_to_carrier',['shipped_at'=>'2026-07-30T10:00:00Z','carrier_code'=>'ppl','tracking_number'=>'X']],['delivery_exception','cancelled',[]]];
foreach($allowed as[$from,$to,$data])$machine->assertTransition($from,$to,$data);
$machine->assertTransition('prepared','handed_to_carrier',['shipped_at'=>'2026-07-30T10:00:00Z','carrier_code'=>'ppl','tracking_number'=>'X1']);
$machine->assertTransition('in_transit','delivered',['delivered_at'=>'2026-07-31T10:00:00Z']);
try { $machine->assertTransition('in_transit','delivered',[]); test_assert_true(false,'delivery time is required'); } catch (DomainException) {}
test_complete('delivery-state-machine-test');
