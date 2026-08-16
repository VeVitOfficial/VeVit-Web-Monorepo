<?php

declare(strict_types=1);

final class StoreRateLimitExceeded extends RuntimeException
{
    public function __construct(public readonly int $retryAfter)
    {
        parent::__construct('Rate limit exceeded.');
    }
}

final class StoreRateLimiter
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function consume(string $scope, string $identity, int $limit, int $windowSeconds): void
    {
        if (!preg_match('/^[a-z0-9_-]{1,64}$/', $scope)
            || $identity === ''
            || $limit < 1
            || $windowSeconds < 1
            || $windowSeconds > 86400) {
            throw new InvalidArgumentException('Invalid rate limit configuration.');
        }

        $this->pdo->exec(
            "DELETE FROM store_security_rate_limits
              WHERE key_hash IN (
                    SELECT key_hash
                      FROM store_security_rate_limits
                     WHERE expires_at < NOW() - INTERVAL '1 day'
                     ORDER BY expires_at
                     LIMIT 100
              )"
        );

        $keyHash = hash('sha256', $scope . "\0" . $identity);
        $statement = $this->pdo->prepare(
            "INSERT INTO store_security_rate_limits
                (key_hash, scope, request_count, window_started_at, expires_at, updated_at)
             VALUES (?, ?, 1, NOW(), NOW() + (?::integer * INTERVAL '1 second'), NOW())
             ON CONFLICT (key_hash) DO UPDATE SET
                request_count = CASE
                    WHEN store_security_rate_limits.expires_at <= NOW() THEN 1
                    ELSE store_security_rate_limits.request_count + 1
                END,
                window_started_at = CASE
                    WHEN store_security_rate_limits.expires_at <= NOW() THEN NOW()
                    ELSE store_security_rate_limits.window_started_at
                END,
                expires_at = CASE
                    WHEN store_security_rate_limits.expires_at <= NOW()
                        THEN NOW() + (?::integer * INTERVAL '1 second')
                    ELSE store_security_rate_limits.expires_at
                END,
                updated_at = NOW()
             RETURNING request_count,
                       GREATEST(1, CEIL(EXTRACT(EPOCH FROM (expires_at - NOW()))))::integer AS retry_after"
        );
        $statement->execute([$keyHash, $scope, $windowSeconds, $windowSeconds]);
        $bucket = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$bucket || (int) $bucket['request_count'] > $limit) {
            throw new StoreRateLimitExceeded(max(1, (int) ($bucket['retry_after'] ?? $windowSeconds)));
        }
    }
}
