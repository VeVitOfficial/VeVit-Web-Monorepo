<?php
declare(strict_types=1);

function csp_report_clean_url(mixed $value): string
{
    if (!is_string($value)) return '';
    $value = trim($value);
    if ($value === '' || in_array($value, ['inline', 'eval', 'self'], true)) return mb_substr($value, 0, 500);
    $parts = parse_url($value);
    if ($parts === false || !isset($parts['scheme'], $parts['host'])) return mb_substr($value, 0, 500);
    $scheme = strtolower((string) $parts['scheme']);
    if (!in_array($scheme, ['http', 'https'], true)) return $scheme . ':';
    $port = isset($parts['port']) ? ':' . (int) $parts['port'] : '';
    return mb_substr($scheme . '://' . strtolower((string) $parts['host']) . $port . (string) ($parts['path'] ?? '/'), 0, 500);
}

/** @return list<array<string, int|string>> */
function csp_report_parse(string $raw): array
{
    try {
        $decoded = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        return [];
    }
    if (!is_array($decoded)) return [];
    $candidates = array_is_list($decoded) ? $decoded : [$decoded];
    $reports = [];
    foreach (array_slice($candidates, 0, 20) as $candidate) {
        if (!is_array($candidate)) continue;
        $body = is_array($candidate['csp-report'] ?? null)
            ? $candidate['csp-report']
            : (is_array($candidate['body'] ?? null) ? $candidate['body'] : null);
        if ($body === null) continue;
        $reports[] = [
            'document_uri' => csp_report_clean_url($body['document-uri'] ?? $body['documentURL'] ?? ''),
            'blocked_uri' => csp_report_clean_url($body['blocked-uri'] ?? $body['blockedURL'] ?? ''),
            'source_file' => csp_report_clean_url($body['source-file'] ?? $body['sourceFile'] ?? ''),
            'effective_directive' => mb_substr((string) ($body['effective-directive'] ?? $body['effectiveDirective'] ?? ''), 0, 100),
            'violated_directive' => mb_substr((string) ($body['violated-directive'] ?? ''), 0, 300),
            'disposition' => mb_substr((string) ($body['disposition'] ?? 'report'), 0, 20),
            'status_code' => (int) ($body['status-code'] ?? $body['statusCode'] ?? 0),
            'line_number' => (int) ($body['line-number'] ?? $body['lineNumber'] ?? 0),
            'column_number' => (int) ($body['column-number'] ?? $body['columnNumber'] ?? 0),
        ];
    }
    return $reports;
}

function csp_report_storage_dir(): string
{
    $configured = getenv('CSP_REPORT_STORAGE_DIR');
    if (is_string($configured) && trim($configured) !== '') return rtrim(trim($configured), '/');
    return dirname(__DIR__, 3) . '/csp-reports';
}

function csp_report_rotate(string $directory, DateTimeImmutable $now, int $retentionDays = 14): void
{
    $cutoff = $now->getTimestamp() - max(1, $retentionDays) * 86400;
    foreach (glob($directory . '/violations-*.json') ?: [] as $file) {
        $mtime = filemtime($file);
        if ($mtime !== false && $mtime < $cutoff) @unlink($file);
    }
    foreach (glob($directory . '/rate-*.json') ?: [] as $file) {
        $mtime = filemtime($file);
        if ($mtime !== false && $mtime < $now->getTimestamp() - 7200) @unlink($file);
    }
}

/** @param list<array<string, int|string>> $reports */
function csp_report_store(
    array $reports,
    string $directory,
    string $clientAddress,
    ?DateTimeImmutable $now = null,
    int $rateLimit = 120
): bool {
    $now ??= new DateTimeImmutable('now', new DateTimeZone('UTC'));
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) return false;
    if (!is_writable($directory)) return false;

    $minute = $now->format('YmdHi');
    $clientHash = hash('sha256', $clientAddress);
    $ratePath = $directory . '/rate-' . $minute . '.json';
    $rateHandle = @fopen($ratePath, 'c+');
    if ($rateHandle === false || !flock($rateHandle, LOCK_EX)) {
        if (is_resource($rateHandle)) fclose($rateHandle);
        return false;
    }
    $rateRaw = stream_get_contents($rateHandle);
    $rates = is_string($rateRaw) ? json_decode($rateRaw, true) : null;
    if (!is_array($rates)) $rates = [];
    $current = (int) ($rates[$clientHash] ?? 0);
    if ($current + count($reports) > $rateLimit) {
        flock($rateHandle, LOCK_UN);
        fclose($rateHandle);
        return false;
    }
    $rates[$clientHash] = $current + count($reports);
    rewind($rateHandle);
    ftruncate($rateHandle, 0);
    fwrite($rateHandle, json_encode($rates, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    fflush($rateHandle);
    flock($rateHandle, LOCK_UN);
    fclose($rateHandle);
    @chmod($ratePath, 0600);

    $dailyPath = $directory . '/violations-' . $now->format('Y-m-d') . '.json';
    $handle = @fopen($dailyPath, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) fclose($handle);
        return false;
    }
    $raw = stream_get_contents($handle);
    $aggregate = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_array($aggregate)) $aggregate = [];
    foreach ($reports as $report) {
        $key = hash('sha256', implode("\n", [
            (string) ($report['document_uri'] ?? ''),
            (string) ($report['blocked_uri'] ?? ''),
            (string) ($report['effective_directive'] ?? ''),
        ]));
        if (!isset($aggregate[$key]) && count($aggregate) >= 10000) continue;
        $firstSeen = (string) ($aggregate[$key]['first_seen_at'] ?? $now->format(DATE_ATOM));
        $aggregate[$key] = $report + [
            'first_seen_at' => $firstSeen,
            'last_seen_at' => $now->format(DATE_ATOM),
            'count' => (int) ($aggregate[$key]['count'] ?? 0) + 1,
        ];
        $aggregate[$key]['first_seen_at'] = $firstSeen;
        $aggregate[$key]['last_seen_at'] = $now->format(DATE_ATOM);
        $aggregate[$key]['count'] = (int) ($aggregate[$key]['count'] ?? 0);
    }
    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($aggregate, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    @chmod($dailyPath, 0600);
    csp_report_rotate($directory, $now, 14);
    return true;
}
