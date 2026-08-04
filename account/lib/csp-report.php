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
