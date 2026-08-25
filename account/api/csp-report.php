<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/csp-report.php';

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    exit;
}
$length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($length > 65536) {
    http_response_code(413);
    exit;
}
$contentType = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
if (!in_array($contentType, ['application/csp-report', 'application/reports+json', 'application/json'], true)) {
    http_response_code(415);
    exit;
}
$raw = file_get_contents('php://input', false, null, 0, 65537);
if (!is_string($raw) || strlen($raw) > 65536) {
    http_response_code(413);
    exit;
}
$reports = csp_report_parse($raw);
if ($reports === []) {
    http_response_code(400);
    exit;
}
// Agregace ukládá pouze normalizovaná pole bez query parametrů.
$clientAddress = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (!csp_report_store($reports, csp_report_storage_dir(), $clientAddress)) {
    http_response_code(429);
    exit;
}
http_response_code(204);
