<?php

declare(strict_types=1);

final class DownloadAccessException extends RuntimeException
{
    public string $errorCode;

    public function __construct(string $errorCode = 'download_unavailable')
    {
        $this->errorCode = $errorCode;
        parent::__construct('Stažení není k dispozici.');
    }
}

final class DownloadService
{
    private DateTimeImmutable $now;
    private string $storagePath;

    public function __construct(DateTimeImmutable $now, string $storagePath)
    {
        $this->now = $now;
        $this->storagePath = $storagePath;
    }

    /** @param array<string,mixed> $grant @return array{path:string,filename:string,mime:string} */
    public function validateGrant(array $grant, string $rawToken): array
    {
        $invalid = empty($grant['token_hash']) || !hash_equals((string) $grant['token_hash'], hash('sha256', $rawToken));
        $invalid = $invalid || !in_array((string) ($grant['order_status'] ?? ''), ['paid', 'processing', 'shipped', 'delivered'], true);
        $invalid = $invalid || (isset($grant['payment_status']) && (string) $grant['payment_status'] !== 'paid');
        $invalid = $invalid || !empty($grant['entitlement_revoked_at']);
        $invalid = $invalid || (string) ($grant['product_type'] ?? '') !== 'digital';
        $invalid = $invalid || (!self::databaseBoolean($grant['product_is_active'] ?? false) && !self::databaseBoolean($grant['allow_inactive_access'] ?? false));
        $invalid = $invalid || !empty($grant['item_cancelled_at']) || !empty($grant['revoked_at']);
        $invalid = $invalid || (int) ($grant['download_count'] ?? 0) >= (int) ($grant['max_downloads'] ?? 0);
        try {
            $invalid = $invalid || new DateTimeImmutable((string) ($grant['expires_at'] ?? '')) <= $this->now;
        } catch (Throwable) {
            $invalid = true;
        }
        if ($invalid) {
            throw new DownloadAccessException();
        }

        $relativePath = (string) ($grant['download_file'] ?? '');
        if ($relativePath === '' || str_starts_with($relativePath, '/') || str_contains($relativePath, '..') || str_contains($relativePath, "\0") || preg_match('#^[a-z][a-z0-9+.-]*://#i', $relativePath)) {
            throw new DownloadAccessException();
        }
        $base = realpath($this->storagePath);
        $path = $base === false ? false : realpath($base . DIRECTORY_SEPARATOR . $relativePath);
        if ($base === false || $path === false || !is_file($path) || !is_readable($path) || !str_starts_with($path, $base . DIRECTORY_SEPARATOR)) {
            throw new DownloadAccessException();
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path) ?: 'application/octet-stream';
        return ['path' => $path, 'filename' => basename($path), 'mime' => $mime];
    }

    public static function revokeOrderGrants(PDO $pdo, int $orderId, string $reason): int
    {
        $reason = mb_substr(trim($reason), 0, 255);
        if ($orderId < 1 || $reason === '') {
            throw new InvalidArgumentException('Order and revocation reason are required.');
        }
        $statement = $pdo->prepare('UPDATE store_download_grants SET revoked_at = NOW(), revocation_reason = ? WHERE order_id = ? AND revoked_at IS NULL');
        $statement->execute([$reason, $orderId]);
        return $statement->rowCount();
    }

    private static function databaseBoolean(mixed $value): bool
    {
        return $value === true || $value === 1 || $value === '1' || $value === 't' || $value === 'true';
    }
}
