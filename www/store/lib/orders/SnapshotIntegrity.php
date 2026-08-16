<?php
declare(strict_types=1);

final class SnapshotIntegrity
{
    /** @param array<string,mixed> $snapshot */
    public static function hash(array $snapshot): string
    {
        unset($snapshot['snapshot_hash']);
        return hash('sha256', json_encode(
            self::sortRecursively($snapshot),
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
        ));
    }

    private static function sortRecursively(mixed $value): mixed
    {
        if (!is_array($value)) return $value;
        if (!array_is_list($value)) ksort($value, SORT_STRING);
        foreach ($value as $key => $child) $value[$key] = self::sortRecursively($child);
        return $value;
    }
}
