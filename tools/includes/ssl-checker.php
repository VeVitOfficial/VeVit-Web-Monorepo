<?php
declare(strict_types=1);

/*
 * Policy and transport for the public SSL certificate checker.
 * DNS is resolved once and the TLS stream is opened directly to the approved
 * address, with the original hostname retained exclusively for SNI and TLS
 * name verification. This prevents a second DNS lookup from enabling rebinding.
 */

const SSL_CHECK_EXPIRES_SOON_DAYS = 14;

function ssl_normalize_hostname(string $value): ?string {
    $value = trim($value);
    if ($value === '' || strlen($value) > 253) return null;
    if (preg_match('/[\/:?#@\[\]]/', $value)) return null;
    if (filter_var($value, FILTER_VALIDATE_IP)) return null;
    $value = rtrim(strtolower($value), '.');
    if ($value === '' || !str_contains($value, '.')) return null;
    foreach (explode('.', $value) as $label) {
        if ($label === '' || strlen($label) > 63 || !preg_match('/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/', $label)) return null;
    }
    return $value;
}

function ssl_ip_in_cidr(string $ip, string $network, int $prefix): bool {
    $packedIp = @inet_pton($ip);
    $packedNetwork = @inet_pton($network);
    if ($packedIp === false || $packedNetwork === false || strlen($packedIp) !== strlen($packedNetwork)) return false;
    $whole = intdiv($prefix, 8);
    $bits = $prefix % 8;
    if ($whole > 0 && substr($packedIp, 0, $whole) !== substr($packedNetwork, 0, $whole)) return false;
    if ($bits === 0) return true;
    $mask = (0xFF << (8 - $bits)) & 0xFF;
    return (ord($packedIp[$whole]) & $mask) === (ord($packedNetwork[$whole]) & $mask);
}

function ssl_is_public_ip(string $ip): bool {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        foreach ([
            ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
            ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
            ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
            ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
            ['224.0.0.0', 4], ['240.0.0.0', 4]
        ] as [$network, $prefix]) {
            if (ssl_ip_in_cidr($ip, $network, $prefix)) return false;
        }
        return true;
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        foreach ([
            ['::', 128], ['::1', 128], ['::ffff:0:0', 96], ['64:ff9b::', 96],
            ['100::', 64], ['2001::', 32], ['2001:2::', 48], ['2001:10::', 28],
            ['2001:db8::', 32], ['2002::', 16], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]
        ] as [$network, $prefix]) {
            if (ssl_ip_in_cidr($ip, $network, $prefix)) return false;
        }
        return true;
    }
    return false;
}

function ssl_default_resolver(string $host): array {
    if (!function_exists('dns_get_record')) return [];
    $records = @dns_get_record($host, DNS_A | DNS_AAAA);
    if (!is_array($records)) return [];
    $ips = [];
    foreach ($records as $record) {
        $ip = $record['ip'] ?? $record['ipv6'] ?? null;
        if (is_string($ip) && filter_var($ip, FILTER_VALIDATE_IP)) $ips[] = $ip;
    }
    return array_values(array_unique($ips));
}

function ssl_classify_transport_error(string $error): string {
    $error = strtolower($error);
    if (str_contains($error, 'peer certificate') || str_contains($error, 'peer name') || str_contains($error, 'hostname')) return 'hostname_mismatch';
    if (str_contains($error, 'expired')) return 'expired';
    if (str_contains($error, 'certificate') || str_contains($error, 'verify') || str_contains($error, 'ca ')) return 'untrusted_chain';
    return 'unreachable';
}

function ssl_default_connector(string $ip, string $hostname): array {
    if (!extension_loaded('openssl')) return ['ok' => false, 'error' => 'verification unavailable'];
    $errorNumber = 0;
    $errorString = '';
    $context = stream_context_create(['ssl' => [
        'capture_peer_cert' => true,
        'verify_peer' => true,
        'verify_peer_name' => true,
        'peer_name' => $hostname,
        'SNI_enabled' => true,
        'SNI_server_name' => $hostname,
        'disable_compression' => true,
    ]]);
    $remote = @stream_socket_client('ssl://' . $ip . ':443', $errorNumber, $errorString, 10, STREAM_CLIENT_CONNECT, $context);
    if (!$remote) return ['ok' => false, 'error' => $errorString];
    $params = stream_context_get_params($remote);
    fclose($remote);
    $certificate = $params['options']['ssl']['peer_certificate'] ?? null;
    if (!$certificate) return ['ok' => false, 'error' => 'certificate unavailable'];
    $parsed = @openssl_x509_parse($certificate);
    if (!is_array($parsed)) return ['ok' => false, 'error' => 'certificate parse failed'];
    return ['ok' => true, 'certificate' => $parsed];
}

function ssl_check_host(string $input, ?callable $resolver = null, ?callable $connector = null): array {
    $hostname = ssl_normalize_hostname($input);
    if ($hostname === null) return ['status' => 'dns_rejected'];
    if (!extension_loaded('openssl')) return ['status' => 'verification_unavailable'];
    $resolver ??= 'ssl_default_resolver';
    $ips = $resolver($hostname);
    if (!is_array($ips) || !$ips) return ['status' => 'unreachable'];
    foreach ($ips as $ip) {
        if (!is_string($ip) || !ssl_is_public_ip($ip)) return ['status' => 'dns_rejected'];
    }
    $connector ??= 'ssl_default_connector';
    $transport = $connector($ips[0], $hostname);
    if (!is_array($transport) || empty($transport['ok'])) {
        $error = (string)($transport['error'] ?? '');
        return ['status' => $error === 'verification unavailable' ? 'verification_unavailable' : ssl_classify_transport_error($error)];
    }
    $certificate = $transport['certificate'] ?? [];
    $validTo = isset($certificate['validTo_time_t']) ? (int)$certificate['validTo_time_t'] : 0;
    if ($validTo <= 0) return ['status' => 'verification_unavailable'];
    $now = time();
    if ($validTo < $now) return ['status' => 'expired'];
    $daysLeft = (int)floor(($validTo - $now) / 86400);
    return [
        'status' => $daysLeft < SSL_CHECK_EXPIRES_SOON_DAYS ? 'expires_soon' : 'verified',
        'certificate' => $certificate,
        'days_left' => $daysLeft,
    ];
}
