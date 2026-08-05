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

$storage = sys_get_temp_dir() . '/vevit-csp-test-' . bin2hex(random_bytes(6));
mkdir($storage, 0700, true);
$now = new DateTimeImmutable('2026-08-05T10:00:00+00:00');
if (!csp_report_store($reports, $storage, '198.51.100.7', $now)) {
    throw new RuntimeException('CSP report se neuložil.');
}
if (!csp_report_store($reports, $storage, '198.51.100.7', $now)) {
    throw new RuntimeException('Duplicitní CSP report se neagregoval.');
}
$daily = json_decode((string) file_get_contents($storage . '/violations-2026-08-05.json'), true, 32, JSON_THROW_ON_ERROR);
if (count($daily) !== 1 || (int) (reset($daily)['count'] ?? 0) !== 2) {
    throw new RuntimeException('Deduplikace CSP reportu nefunguje.');
}
file_put_contents($storage . '/violations-2026-07-01.json', '{}');
touch($storage . '/violations-2026-07-01.json', $now->getTimestamp() - 20 * 86400);
csp_report_rotate($storage, $now, 14);
if (is_file($storage . '/violations-2026-07-01.json')) {
    throw new RuntimeException('Rotace CSP reportů nefunguje.');
}
foreach (glob($storage . '/*') ?: [] as $file) unlink($file);
rmdir($storage);

fwrite(STDOUT, "csp-report-test: PASS\n");
