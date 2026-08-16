<?php
declare(strict_types=1);

final class AdminMutationGuard
{
    /** @param array<string,mixed> $session */
    public static function actor(array $session): ActorContext
    {
        if (($session['admin'] ?? false) !== true) throw new DomainException('Admin authentication required.');
        return LegacyAdminActor::fromSession($session);
    }

    /** @param array<string,mixed> $session */
    public static function recent(array $session, int $now, int $windowSeconds): bool
    {
        return LegacyAdminActor::isRecentlyAuthenticated($session, $now, $windowSeconds);
    }

    public static function requiresRecentAuthentication(string $entity, string $target): bool
    {
        return in_array($entity . ':' . $target, [
            'claim:rejected',
            'claim:resolved',
            'return:completed',
            'delivery:delivered',
            'delivery:cancelled',
        ], true);
    }
}
