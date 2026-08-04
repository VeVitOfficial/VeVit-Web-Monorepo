<?php
declare(strict_types=1);

require_once __DIR__ . '/../account/lib/csp-report.php';

$payload = json_encode(['csp-report' => [
    'document-uri' => 'https://vevit.cz/tools/demo?token=secret#fragment',
    'blocked-uri' => 'https://evil.example/script.js?credential=secret',
    'source-file' => 'https://vevit.cz/assets/app.js?session=secret',
    'effective-directive' => 'script-src-elem',
    'violated-directive' => "script-src 'self'",
    'status-code' => 200,
    'line-number' => 42,
    'unknown-secret-field' => 'must-not-be-logged',
]], JSON_THROW_ON_ERROR);
$reports = csp_report_parse($payload);
if (count($reports) !== 1) throw new RuntimeException('CSP report nebyl zpracován.');
$encoded = json_encode($reports, JSON_THROW_ON_ERROR);
foreach (['token=secret', 'credential=secret', 'session=secret', 'must-not-be-logged'] as $secret) {
    if (str_contains($encoded, $secret)) throw new RuntimeException('CSP report propustil citlivý údaj: ' . $secret);
}
if (($reports[0]['document_uri'] ?? '') !== 'https://vevit.cz/tools/demo') throw new RuntimeException('Document URL nebylo normalizováno.');
if (($reports[0]['effective_directive'] ?? '') !== 'script-src-elem') throw new RuntimeException('Direktiva se ztratila.');

$modern = csp_report_parse(json_encode([['type' => 'csp-violation', 'body' => ['documentURL' => 'https://vevit.cz/home?x=1', 'blockedURL' => 'inline', 'effectiveDirective' => 'script-src-elem']]], JSON_THROW_ON_ERROR));
if (count($modern) !== 1 || $modern[0]['blocked_uri'] !== 'inline') throw new RuntimeException('Reporting API formát selhal.');
if (csp_report_parse('{invalid') !== []) throw new RuntimeException('Neplatné JSON musí failovat zavřeně.');

fwrite(STDOUT, "csp-report-test: PASS\n");
