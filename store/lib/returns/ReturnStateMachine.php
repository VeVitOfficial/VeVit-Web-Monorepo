<?php
declare(strict_types=1);
final class ReturnStateMachine
{
    private const T=['requested'=>['approved','rejected','cancelled'],'approved'=>['waiting_for_goods','cancelled'],'waiting_for_goods'=>['received','cancelled'],'received'=>['inspected'],'inspected'=>['refund_pending','completed','rejected'],'refund_pending'=>['completed'],'rejected'=>[],'completed'=>[],'cancelled'=>[]];
    /** @param array<string,mixed> $data */
    public function assertTransition(string $from,string $to,array $data):void
    {
        if($from===$to)return;
        if(!isset(self::T[$from])||!in_array($to,self::T[$from],true))throw new DomainException("Forbidden return transition {$from} -> {$to}");
        if($to==='received'&&empty($data['received_at']))throw new DomainException('Received time is required.');
        if($to==='inspected'&&empty($data['inspected_at']))throw new DomainException('Inspection time is required.');
        if($to==='completed'){
            if(empty($data['completed_at']))throw new DomainException('Completion time is required.');
            if(($data['decision']??null)==='refund'&&(($data['refund_status']??null)!=='confirmed'||empty($data['refund_evidence_id'])))throw new DomainException('Trusted refund evidence is required.');
        }
    }
}
