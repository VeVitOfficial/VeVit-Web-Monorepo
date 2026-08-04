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
foreach ($reports as $report) {
    error_log('[csp-report] ' . json_encode($report, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}
http_response_code(204);
