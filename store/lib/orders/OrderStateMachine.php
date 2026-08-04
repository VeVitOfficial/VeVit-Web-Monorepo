<?php
declare(strict_types=1);

final class OrderStateMachine
{
    /** @var array<string,list<string>> */
    private const PAYMENT_TRANSITIONS = [
        'pending_checkout' => ['pending_checkout', 'awaiting_payment', 'cancelled'],
        'awaiting_payment' => ['awaiting_payment', 'paid', 'failed', 'cancelled', 'manual_review'],
        'failed' => ['failed', 'awaiting_payment', 'cancelled'],
        'paid' => ['paid', 'refunded'],
        'cancelled' => ['cancelled'],
        'refunded' => ['refunded'],
        'manual_review' => ['manual_review', 'paid', 'refunded'],
        'legacy_unknown' => ['legacy_unknown'],
    ];

    /** @var array<string,list<string>> */
    private const FULFILLMENT_TRANSITIONS = [
        'pending' => ['pending', 'ready', 'manual_review', 'cancelled'],
        'ready' => ['ready', 'processing', 'manual_review', 'cancelled'],
        'processing' => ['processing', 'fulfilled', 'manual_review'],
        'fulfilled' => ['fulfilled'],
        'manual_review' => ['manual_review', 'ready', 'cancelled'],
        'cancelled' => ['cancelled'],
        'legacy_unknown' => ['legacy_unknown'],
    ];

    public function canTransitionPayment(string $from, string $to): bool
    {
        return in_array($to, self::PAYMENT_TRANSITIONS[$from] ?? [], true);
    }

    public function canTransitionFulfillment(string $from, string $to): bool
    {
        return in_array($to, self::FULFILLMENT_TRANSITIONS[$from] ?? [], true);
    }

    public function assertPayment(string $from, string $to): void
    {
        if (!$this->canTransitionPayment($from, $to)) {
            throw new DomainException("Forbidden payment transition {$from} -> {$to}");
        }
    }

    public function assertFulfillment(string $from, string $to): void
    {
        if (!$this->canTransitionFulfillment($from, $to)) {
            throw new DomainException("Forbidden fulfillment transition {$from} -> {$to}");
        }
    }

    public function orderStatusFor(string $payment, string $fulfillment): string
    {
        if ($fulfillment === 'manual_review' || $payment === 'manual_review') return 'manual_review';
        if ($payment === 'paid') return $fulfillment === 'processing' ? 'processing' : 'paid';
        if ($payment === 'awaiting_payment') return 'awaiting_payment';
        if ($payment === 'cancelled') return 'cancelled';
        return 'pending_checkout';
    }
}
