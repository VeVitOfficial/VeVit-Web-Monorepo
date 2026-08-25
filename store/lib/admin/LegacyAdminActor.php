<?php

declare(strict_types=1);

final class LegacyAdminActor
{
    /** @param array<string,mixed> $session */
    public static function establish(array &$session, int $now): void
    {
        $session['_store_admin_audit_raw'] = bin2hex(random_bytes(32));
        $session['_store_admin_authenticated_at'] = $now;
    }

    /** @param array<string,mixed> $session */
    public static function fromSession(array $session): ActorContext
    {
        $raw = $session['_store_admin_audit_raw'] ?? null;
        if (!is_string($raw) || !preg_match('/^[a-f0-9]{64}$/', $raw)) {
            throw new RuntimeException('Admin audit session is unavailable.');
        }
        return new ActorContext('legacy_shared_admin', null, hash('sha256', $raw), 'legacy_admin_session');
    }

    /** @param array<string,mixed> $session */
    public static function isRecentlyAuthenticated(array $session, int $now, int $windowSeconds): bool
    {
        $at = $session['_store_admin_authenticated_at'] ?? null;
        return is_int($at) && $windowSeconds > 0 && $at <= $now && ($now - $at) <= $windowSeconds;
    }

    /** @param array<string,mixed> $session */
    public static function destroy(array &$session): void
    {
        unset($session['_store_admin_audit_raw'], $session['_store_admin_authenticated_at']);
    }
}
