<?php
declare(strict_types=1);

$nginx = file_get_contents(__DIR__ . '/../nginx-vevit.conf');
$headers = file_get_contents(__DIR__ . '/../config/nginx/security-headers-report-only.conf');
$sandbox = file_get_contents(__DIR__ . '/../config/nginx/security-headers-sandbox-report-only.conf');
if (!is_string($nginx) || !is_string($headers) || !is_string($sandbox)) throw new RuntimeException('Nginx konfiguraci nelze načíst.');

foreach ([
    'location ~ /config\.php$',
    'location ^~ /shared/',
    'location = /account/api/csp-report.php',
    'location = /edu/sandbox-frame.html',
    'security-headers-report-only.conf',
    'security-headers-sandbox-report-only.conf',
] as $required) {
    if (!str_contains($nginx, $required)) throw new RuntimeException('Nginx postrádá kontrakt: ' . $required);
}
foreach (["script-src 'self'", "style-src 'self' 'unsafe-inline'", "object-src 'none'", "frame-ancestors 'none'", 'report-uri /account/api/csp-report.php'] as $directive) {
    if (!str_contains($headers, $directive)) throw new RuntimeException('CSP postrádá direktivu: ' . $directive);
}
if (str_contains($headers, "'unsafe-eval'") || !str_contains($sandbox, "worker-src 'self' blob:") || !str_contains($sandbox, "frame-ancestors 'self'")) {
    throw new RuntimeException('CSP sandbox profil porušuje schválený kontrakt.');
}

fwrite(STDOUT, "nginx-security-config-test: PASS\n");
