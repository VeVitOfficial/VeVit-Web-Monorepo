<?php
// TLS certificate inspection with DNS-rebinding-safe direct-IP transport.
require_once __DIR__ . '/../includes/ssl-checker.php';
require_once __DIR__ . '/../includes/request-rate-limit.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
header('X-Content-Type-Options: nosniff');

function ssl_api_reply(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    ssl_api_reply(405, ['status' => 'invalid_request', 'message' => 'Pouze GET.']);
}

$rate = request_rate_limit_consume('ssl-check', request_rate_limit_client_ip(), 60, 10);
if (!$rate['available']) {
    ssl_api_reply(503, ['status' => 'verification_unavailable', 'message' => 'Kontrolu certifikátu se nyní nepodařilo bezpečně spustit.']);
}
if (!$rate['allowed']) {
    ssl_api_reply(429, ['status' => 'rate_limited', 'message' => 'Příliš mnoho kontrol. Zkuste to prosím za chvíli.']);
}

$check = ssl_check_host((string)($_GET['domain'] ?? ''));
$status = $check['status'];
if (!in_array($status, ['verified', 'expires_soon'], true)) {
    $messages = [
        'invalid_hostname' => 'Zadejte platný název veřejné domény bez protokolu a portu.',
        'dns_rejected' => 'Doména nevede výhradně na veřejně dostupný cíl.',
        'hostname_mismatch' => 'Certifikát neodpovídá zadanému názvu domény.',
        'untrusted_chain' => 'Certifikační řetězec se nepodařilo ověřit.',
        'expired' => 'Certifikát již není platný.',
        'unreachable' => 'K veřejnému TLS serveru se nyní nelze připojit.',
        'verification_unavailable' => 'Ověření TLS není na tomto serveru dostupné.',
    ];
    $code = in_array($status, ['invalid_hostname', 'dns_rejected'], true) ? 400
        : ($status === 'verification_unavailable' ? 503 : 502);
    ssl_api_reply($code, ['status' => $status, 'message' => $messages[$status] ?? 'Kontrola certifikátu selhala.']);
}

$parsed = $check['certificate'] ?? null;
if (!is_array($parsed)) {
    ssl_api_reply(502, ['status' => 'unreachable', 'message' => 'Certifikát nebylo možné přečíst.']);
}
function ssl_api_date(array $certificate, string $key): string {
    $value = $certificate[$key] ?? null;
    return is_numeric($value) ? gmdate('Y-m-d H:i:s \\U\\T\\C', (int)$value) : '—';
}
function ssl_api_field(array $group, string $key): string {
    return isset($group[$key]) && is_scalar($group[$key]) ? (string)$group[$key] : '—';
}

$san = [];
if (!empty($parsed['extensions']['subjectAltName']) && is_string($parsed['extensions']['subjectAltName'])) {
    preg_match_all('/DNS:([^,]+)/', $parsed['extensions']['subjectAltName'], $matches);
    $san = array_values(array_map('trim', $matches[1] ?? []));
}
$validTo = isset($parsed['validTo_time_t']) ? (int)$parsed['validTo_time_t'] : null;
$daysLeft = $validTo === null ? null : (int)floor(($validTo - time()) / 86400);
$subject = is_array($parsed['subject'] ?? null) ? $parsed['subject'] : [];
$issuer = is_array($parsed['issuer'] ?? null) ? $parsed['issuer'] : [];

ssl_api_reply(200, [
    'status' => $status,
    'subject' => ['CN' => ssl_api_field($subject, 'CN'), 'O' => ssl_api_field($subject, 'O'), 'OU' => ssl_api_field($subject, 'OU'), 'C' => ssl_api_field($subject, 'C')],
    'issuer' => ['CN' => ssl_api_field($issuer, 'CN'), 'O' => ssl_api_field($issuer, 'O'), 'C' => ssl_api_field($issuer, 'C')],
    'validFrom' => ssl_api_date($parsed, 'validFrom_time_t'),
    'validTo' => ssl_api_date($parsed, 'validTo_time_t'),
    'daysLeft' => $daysLeft,
    'serialNumber' => isset($parsed['serialNumber']) && is_scalar($parsed['serialNumber']) ? (string)$parsed['serialNumber'] : '—',
    'version' => isset($parsed['version']) ? ((int)$parsed['version'] + 1) : '—',
    'signatureType' => ssl_api_field($parsed, 'signatureTypeSN'),
    'san' => $san,
]);
