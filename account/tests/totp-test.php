<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/totp.php';

function totpAssert(bool $condition, string $message): void {
  if (!$condition) throw new RuntimeException($message);
}
function totpSame(mixed $expected, mixed $actual, string $message): void {
  if ($expected !== $actual) throw new RuntimeException($message . ': ' . var_export($actual, true));
}

$rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
foreach ([
  59 => '94287082',
  1111111109 => '07081804',
  1111111111 => '14050471',
  1234567890 => '89005924',
  2000000000 => '69279037',
  20000000000 => '65353130',
] as $timestamp => $expected) {
  totpSame($expected, totpCodeAt($rfcSecret, $timestamp, 8), 'RFC 6238 vector');
}
$uri = totpProvisioningUri($rfcSecret, 'user@example.test');
totpSame('/VEVIT:user@example.test', rawurldecode((string) parse_url($uri, PHP_URL_PATH)), 'standard issuer label');
totpAssert(str_contains($uri, 'issuer=VEVIT'), 'issuer query parameter');
totpAssert(str_contains($uri, 'algorithm=SHA1'), 'SHA1 query parameter');

$GLOBALS['_TOTP_CRYPTO_ADAPTER'] = static function (string $operation, string $value, string $key): string {
  return $operation === 'encrypt'
    ? 'v1.test.' . base64_encode(strrev($value))
    : strrev((string) base64_decode(substr($value, 8), true));
};
$cfg = ['TOTP_ENCRYPTION_KEY' => base64_encode(str_repeat('k', 32))];
$ciphertext = encryptTotpSecret($rfcSecret, $cfg);
totpAssert(!str_contains($ciphertext, $rfcSecret), 'secret must not be plaintext');
totpSame($rfcSecret, decryptTotpSecret($ciphertext, $cfg), 'encrypted secret round trip');
unset($GLOBALS['_TOTP_CRYPTO_ADAPTER']);

$codes = generateRecoveryCodes(10);
totpSame(10, count($codes), 'recovery code count');
totpSame(10, count(array_unique($codes)), 'recovery codes unique');
foreach ($codes as $code) totpAssert(preg_match('/\\A[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\\z/D', $code) === 1, 'recovery format');
$hashes = hashRecoveryCodes($codes);
totpSame(10, count($hashes), 'recovery hash count');
totpAssert(password_verify($codes[0], $hashes[0]), 'recovery hash verification');
totpAssert(!str_contains($hashes[0], $codes[0]), 'recovery code not plaintext');

$used = verifyTotpWindow($rfcSecret, totpCodeAt($rfcSecret, 1234567890), 1234567890, null);
totpAssert(is_int($used), 'valid TOTP returns time step');
totpAssert(verifyTotpWindow($rfcSecret, totpCodeAt($rfcSecret, 1234567890), 1234567890, $used) === null, 'time step replay rejected');

foreach ([
  'api/2fa/setup-start.php',
  'api/2fa/setup-confirm.php',
  'api/2fa/login-verify.php',
  'api/2fa/recovery-verify.php',
  'api/2fa/recovery-regenerate.php',
  'api/2fa/disable.php',
  'api/2fa/status.php',
  'verify-2fa.php',
  'sql/migrations/011_totp_2fa.sql',
] as $path) totpAssert(is_file(__DIR__ . '/../' . $path), "missing {$path}");

$login = (string) file_get_contents(__DIR__ . '/../api/login.php');
$oauth = (string) file_get_contents(__DIR__ . '/../api/oauth/callback-common.php');
$migration = (string) file_get_contents(__DIR__ . '/../sql/migrations/011_totp_2fa.sql');
totpAssert(str_contains($login, 'createTotpLoginChallenge'), 'password login must gate active 2FA');
totpAssert(str_contains($oauth, 'createTotpLoginChallenge'), 'OAuth login must gate active 2FA');
totpAssert(str_contains($migration, 'jsonb_array_length(p_hashes)<>10'), 'activation atomically requires ten recovery hashes');
totpAssert(str_contains($migration, 'session_token<>p_current_token'), 'disable atomically revokes other sessions');

fwrite(STDOUT, "PASS RFC 6238, encrypted secrets, recovery codes and 2FA contracts\n");
