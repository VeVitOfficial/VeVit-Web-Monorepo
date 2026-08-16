<?php
declare(strict_types=1);

final class AuditService
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @param array<string,mixed> $data @return array<string,mixed> */
    public static function sanitize(array $data): array
    {
        $result = [];
        foreach ($data as $key => $value) {
            if (preg_match('/(?:password|cookie|token|grant|authorization|file_content)/i', (string) $key)) continue;
            $safeKey = substr(preg_replace('/[\x00-\x1F\x7F]/', '', (string) $key) ?? '', 0, 128);
            if ($safeKey === '') continue;
            if (is_array($value)) $result[$safeKey] = self::sanitize($value);
            elseif (is_string($value)) $result[$safeKey] = substr(preg_replace('/[\x00-\x1F\x7F]/', ' ', $value) ?? '', 0, 2048);
            elseif (is_int($value) || is_float($value) || is_bool($value) || $value === null) $result[$safeKey] = $value;
        }
        return $result;
    }

    /** @param array<string,mixed> $metadata */
    public function record(
        string $publicId,
        string $entityType,
        int $entityId,
        string $action,
        string $outcome,
        AuditActor $actor,
        string $correlationId,
        ?string $oldState = null,
        ?string $newState = null,
        array $metadata = [],
        ?string $idempotencyKeyHash = null,
    ): void {
        $statement = $this->pdo->prepare(
            'INSERT INTO store_audit_events
             (public_id, entity_type, entity_id, action, outcome, old_state, new_state,
              actor_type, actor_user_id, actor_session_id, auth_source, correlation_id,
              idempotency_key_hash, metadata)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)'
        );
        $statement->execute([
            $publicId, $entityType, $entityId, $action, $outcome, $oldState, $newState,
            $actor->type, $actor->userId, $actor->sessionId, $actor->authSource,
            $correlationId, $idempotencyKeyHash,
            json_encode(self::sanitize($metadata), JSON_THROW_ON_ERROR),
        ]);
    }
}
