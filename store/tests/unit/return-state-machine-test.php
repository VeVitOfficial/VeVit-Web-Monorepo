<?php
declare(strict_types=1);
require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/returns/ReturnStateMachine.php';
$machine = new ReturnStateMachine();
$allowed=[['requested','approved',[]],['requested','rejected',[]],['requested','cancelled',[]],['approved','waiting_for_goods',[]],['approved','cancelled',[]],['waiting_for_goods','cancelled',[]],['received','inspected',['inspected_at'=>'2026-07-30T10:00:00Z']],['inspected','refund_pending',[]],['inspected','rejected',[]],['inspected','completed',['completed_at'=>'2026-07-30T10:00:00Z','decision'=>'replacement']],['refund_pending','completed',['completed_at'=>'2026-07-30T10:00:00Z','decision'=>'replacement']]];
foreach($allowed as[$from,$to,$data])$machine->assertTransition($from,$to,$data);
$machine->assertTransition('waiting_for_goods','received',['received_at'=>'2026-07-30T10:00:00Z']);
$machine->assertTransition('refund_pending','completed',['completed_at'=>'2026-07-30T11:00:00Z','decision'=>'refund','refund_status'=>'confirmed','refund_evidence_id'=>'re_1']);
foreach ([['completed','requested',[]],['refund_pending','completed',['decision'=>'refund','refund_status'=>'confirmed']]] as [$from,$to,$data]) {
    try { $machine->assertTransition($from,$to,$data); test_assert_true(false,'invalid return transition must fail'); } catch (DomainException) {}
}
test_complete('return-state-machine-test');
