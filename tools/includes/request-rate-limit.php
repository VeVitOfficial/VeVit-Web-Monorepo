<?php
/**
 * Small, file-backed fixed-window limiter for stateful or costly endpoints.
 *
 * The return value distinguishes an exceeded limit from unavailable storage so
 * callers can fail closed only where that is a safe policy decision.
 */
function request_rate_limit_consume(
    string $namespace,
    string $subject,
    int $windowSeconds,
    int $maximum,
    ?string $directory = null
): array {
    $directory = $directory ?? sys_get_temp_dir();
    if ($namespace === '' || $subject === '' || $windowSeconds < 1 || $maximum < 1
        || !is_dir($directory) || !is_writable($directory)) {
        return ['allowed' => false, 'available' => false];
    }

    $file = rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR
        . 'vevit-tools-rl-' . hash('sha256', $namespace . "\0" . $subject) . '.json';
    $handle = @fopen($file, 'c+');
    if ($handle === false) return ['allowed' => false, 'available' => false];

    try {
        if (!@flock($handle, LOCK_EX)) return ['allowed' => false, 'available' => false];
        $now = time();
        rewind($handle);
        $decoded = json_decode((string)stream_get_contents($handle), true);
        $record = ['start' => $now, 'count' => 0];
        if (is_array($decoded) && isset($decoded['start'], $decoded['count'])
            && $now - (int)$decoded['start'] < $windowSeconds) {
            $record = ['start' => (int)$decoded['start'], 'count' => (int)$decoded['count']];
        }
        if ($record['count'] >= $maximum) return ['allowed' => false, 'available' => true];

        $record['count']++;
        $encoded = json_encode($record, JSON_UNESCAPED_SLASHES);
        if ($encoded === false || !rewind($handle) || !@ftruncate($handle, 0)
            || fwrite($handle, $encoded) === false || !@fflush($handle)) {
            return ['allowed' => false, 'available' => false];
        }
        return ['allowed' => true, 'available' => true];
    } finally {
        @flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function request_rate_limit_client_ip(): string {
    return (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}
