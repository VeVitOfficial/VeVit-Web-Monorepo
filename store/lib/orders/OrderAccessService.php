<?php

declare(strict_types=1);

final class OrderAccessService
{
    private DateTimeImmutable $now;

    public function __construct(DateTimeImmutable $now)
    {
        $this->now = $now;
    }

    /** @param array<string,mixed> $order @param array<string,mixed>|null $user */
    public function canAccess(array $order, ?array $user, ?string $guestGrant, bool $isAdmin, ?string $requestedPublicId = null): bool
    {
        if ($requestedPublicId !== null && !hash_equals((string) ($order['public_id'] ?? ''), $requestedPublicId)) {
            return false;
        }
        if ($isAdmin) {
            return true;
        }
        if ($user !== null && isset($order['user_id']) && $order['user_id'] !== null && hash_equals((string) $order['user_id'], (string) ($user['id'] ?? ''))) {
            return true;
        }
        if ($guestGrant === null || $guestGrant === '' || empty($order['guest_grant_hash']) || empty($order['guest_grant_expires_at'])) {
            return false;
        }
        try {
            $expiresAt = new DateTimeImmutable((string) $order['guest_grant_expires_at']);
        } catch (Throwable) {
            return false;
        }
        return $expiresAt > $this->now && hash_equals((string) $order['guest_grant_hash'], hash('sha256', $guestGrant));
    }

    public static function sessionGrant(?string $publicId): ?string
    {
        if ($publicId === null || !preg_match('/^[a-f0-9]{32}$/', $publicId)) {
            return null;
        }
        $grant = $_SESSION['_store_order_grants'][$publicId]['grant'] ?? null;
        return is_string($grant) ? $grant : null;
    }
}
