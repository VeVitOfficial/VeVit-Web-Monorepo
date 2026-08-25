<?php
declare(strict_types=1);

final class MigrationRunner
{
    public function __construct(private readonly PDO $pdo)
    {
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function apply(string $filename, string $sql): string
    {
        if (!preg_match('/^\d{12,}_[a-z0-9_]+\.sql$/', $filename) || str_contains($filename, 'preflight')) {
            throw new InvalidArgumentException('Only versioned change migrations may be applied.');
        }
        $checksum = hash('sha256', $sql);
        $this->pdo->exec('CREATE TABLE IF NOT EXISTS store_schema_migrations(version VARCHAR(255) PRIMARY KEY,checksum CHAR(64) NOT NULL,applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
        $check = $this->pdo->prepare('SELECT checksum FROM store_schema_migrations WHERE version=?');
        $check->execute([$filename]);
        $existing = $check->fetchColumn();
        if (is_string($existing)) {
            if (!hash_equals($existing, $checksum)) throw new RuntimeException('Applied migration checksum differs.');
            return 'skipped';
        }

        $body = trim($sql);
        if (preg_match('/^BEGIN;\s*(.*)\s*COMMIT;$/is', $body, $match)) $body = $match[1];
        $this->pdo->beginTransaction();
        try {
            $lock = $this->pdo->prepare('SELECT pg_advisory_xact_lock(hashtext(?))');
            $lock->execute([$filename]);
            $check->execute([$filename]);
            $raced = $check->fetchColumn();
            if (is_string($raced)) {
                if (!hash_equals($raced, $checksum)) throw new RuntimeException('Applied migration checksum differs.');
                $this->pdo->commit();
                return 'skipped';
            }
            $this->pdo->exec($body);
            $insert = $this->pdo->prepare('INSERT INTO store_schema_migrations(version,checksum) VALUES(?,?)');
            $insert->execute([$filename, $checksum]);
            $this->pdo->commit();
            return 'applied';
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        }
    }
}
