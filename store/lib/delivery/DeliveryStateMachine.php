<?php
declare(strict_types=1);
final class DeliveryStateMachine
{
    private const T=['pending'=>['prepared','cancelled'],'prepared'=>['handed_to_carrier','cancelled'],'handed_to_carrier'=>['in_transit','delivery_exception'],'in_transit'=>['delivered','delivery_exception'],'delivery_exception'=>['prepared','handed_to_carrier','cancelled'],'delivered'=>[],'cancelled'=>[]];
    /** @param array<string,mixed> $data */
    public function assertTransition(string $from,string $to,array $data):void
    {
        if($from===$to)return;
        if(!isset(self::T[$from])||!in_array($to,self::T[$from],true))throw new DomainException("Forbidden delivery transition {$from} -> {$to}");
        if($to==='handed_to_carrier'&&(empty($data['shipped_at'])||empty($data['carrier_code'])||empty($data['tracking_number'])))throw new DomainException('Carrier handoff data is required.');
        if($to==='delivered'&&empty($data['delivered_at']))throw new DomainException('Delivery time is required.');
    }
}
