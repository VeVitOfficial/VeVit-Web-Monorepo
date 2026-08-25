<?php
declare(strict_types=1);

final class ClaimStateMachine
{
    private const TRANSITIONS = [
        'submitted' => ['under_review','waiting_for_customer','cancelled'],
        'under_review' => ['waiting_for_customer','accepted','rejected','cancelled'],
        'waiting_for_customer' => ['under_review','accepted','rejected','cancelled'],
        'accepted' => ['resolved','cancelled'],
        'rejected' => [], 'resolved' => [], 'cancelled' => [],
    ];

    /** @param array<string,mixed> $data */
    public function assertTransition(string $from, string $to, array $data): void
    {
        if ($from === $to) return;
        if (!isset(self::TRANSITIONS[$from]) || !in_array($to, self::TRANSITIONS[$from], true)) throw new DomainException("Forbidden claim transition {$from} -> {$to}");
        $hasApproved = (int) ($data['approved_quantity'] ?? 0) > 0 || (is_array($data['approved_items'] ?? null) && $data['approved_items'] !== []);
        if ($to === 'resolved' && (empty($data['resolution_outcome']) || !$hasApproved)) throw new DomainException('Resolved claim requires an approved outcome.');
    }
}
