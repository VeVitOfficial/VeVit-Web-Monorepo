<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/ssl-checker.php';

$failures = [];
function ssl_test_assert(bool $condition, string $message): void {
    global $failures;
    if (!$condition) $failures[] = $message;
}

foreach ([
    '127.0.0.1', '0.0.0.0', '10.0.0.1', '100.64.0.1', '169.254.1.1',
    '172.16.0.1', '192.0.2.1', '192.168.1.1', '198.18.0.1',
    '198.51.100.1', '203.0.113.1', '224.0.0.1', '240.0.0.1',
    '::', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', 'ff00::1',
    '2001:db8::1', '2001:2::1', '2002::1', '64:ff9b::1'
] as $ip) {
    ssl_test_assert(!ssl_is_public_ip($ip), "unsafe IP accepted: $ip");
}
ssl_test_assert(ssl_is_public_ip('1.1.1.1'), 'public IPv4 rejected');
ssl_test_assert(ssl_is_public_ip('2606:4700:4700::1111'), 'public IPv6 rejected');

foreach (['localhost', '127.0.0.1', 'https://example.com', 'user@example.com', 'example.com:443', 'example.com/path'] as $value) {
    ssl_test_assert(ssl_normalize_hostname($value) === null, "invalid hostname accepted: $value");
}
ssl_test_assert(ssl_normalize_hostname('Example.COM.') === 'example.com', 'hostname normalization failed');

$connected = null;
$privateResolver = static fn(string $host): array => ['1.1.1.1', '10.0.0.5'];
$result = ssl_check_host('example.com', $privateResolver, static function (): array {
    throw new RuntimeException('connector must not run for unsafe DNS');
});
ssl_test_assert($result['status'] === 'dns_rejected', 'mixed DNS response was not rejected');

$publicResolver = static fn(string $host): array => ['1.1.1.1', '2606:4700:4700::1111'];
$result = ssl_check_host('example.com', $publicResolver, static function (string $ip, string $host) use (&$connected): array {
    $connected = [$ip, $host];
    return ['ok' => false, 'error' => 'certificate verify failed'];
});
ssl_test_assert($connected === ['1.1.1.1', 'example.com'], 'connector did not receive verified IP and original hostname');
ssl_test_assert($result['status'] === 'untrusted_chain', 'TLS verification error was not classified');

$result = ssl_check_host('example.com', $publicResolver, static function (): array {
    return ['ok' => true, 'certificate' => ['validTo_time_t' => time() + 3 * 86400]];
});
ssl_test_assert($result['status'] === 'expires_soon', 'near expiry verified certificate not classified');

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}
echo "ssl-checker tests: " . (count($failures) === 0 ? 'PASS' : 'FAIL') . PHP_EOL;
