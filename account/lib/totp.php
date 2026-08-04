<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/vendor/autoload.php';
require_once __DIR__ . '/auth-helpers.php';

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\SvgWriter;
use OTPHP\TOTP;
use Psr\Clock\ClockInterface;

final class VevitTotpClock implements ClockInterface {
  public function __construct(private readonly int $timestamp) {}
  public function now(): DateTimeImmutable {
    return (new DateTimeImmutable('@' . $this->timestamp))->setTimezone(new DateTimeZone('UTC'));
  }
}

function totpObject(string $secret, int $timestamp, int $digits = 6): TOTP {
  return TOTP::create($secret, 30, 'sha1', $digits, 0, new VevitTotpClock($timestamp));
}

function totpCodeAt(string $secret, int $timestamp, int $digits = 6): string {
  return totpObject($secret, $timestamp, $digits)->at($timestamp);
}

function generateTotpSecret(): string {
  return TOTP::generate(new VevitTotpClock(time()), 20)->getSecret();
}

function totpProvisioningUri(string $secret, string $label): string {
  $totp = totpObject($secret, time())
    ->withLabel(mb_substr(trim($label), 0, 80, 'UTF-8'))
    ->withIssuer('VEVIT')
    ->withIssuerIncludedAsParameter(true);
  return $totp->getProvisioningUri() . '&algorithm=SHA1&digits=6&period=30';
}

function totpQrDataUri(string $uri): string {
  $result = (new SvgWriter())->write(new QrCode(data: $uri, size: 240, margin: 8));
  return 'data:image/svg+xml;base64,' . base64_encode($result->getString());
}

function verifyTotpWindow(string $secret, string $code, int $timestamp, ?int $lastStep): ?int {
  if (preg_match('/\A[0-9]{6}\z/D', $code) !== 1) return null;
  $currentStep = intdiv($timestamp, 30);
  foreach ([-1, 0, 1] as $offset) {
    $step = $currentStep + $offset;
    if ($step < 0 || ($lastStep !== null && $step <= $lastStep)) continue;
    if (hash_equals(totpCodeAt($secret, $step * 30), $code)) return $step;
  }
  return null;
}

function _totpEncryptionKey(array $cfg): string {
  $encoded = $cfg['TOTP_ENCRYPTION_KEY'] ?? '';
  $key = is_string($encoded) ? base64_decode($encoded, true) : false;
  if (!is_string($key) || strlen($key) !== 32) throw new RuntimeException('totp_configuration');
  return $key;
}

function encryptTotpSecret(string $secret, array $cfg): string {
  $key = _totpEncryptionKey($cfg);
  $adapter = $GLOBALS['_TOTP_CRYPTO_ADAPTER'] ?? null;
  if (is_callable($adapter)) return $adapter('encrypt', $secret, $key);
  if (!function_exists('sodium_crypto_secretbox')) throw new RuntimeException('totp_configuration');
  $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
  return 'v1.' . rtrim(strtr(base64_encode($nonce . sodium_crypto_secretbox($secret, $nonce, $key)), '+/', '-_'), '=');
}

function decryptTotpSecret(string $stored, array $cfg): string {
  $key = _totpEncryptionKey($cfg);
  $adapter = $GLOBALS['_TOTP_CRYPTO_ADAPTER'] ?? null;
  if (is_callable($adapter)) return $adapter('decrypt', $stored, $key);
  if (!function_exists('sodium_crypto_secretbox') || !str_starts_with($stored, 'v1.')) throw new RuntimeException('totp_configuration');
  $encoded = strtr(substr($stored, 3), '-_', '+/');
  $encoded .= str_repeat('=', (4 - strlen($encoded) % 4) % 4);
  $bytes = base64_decode($encoded, true);
  if (!is_string($bytes) || strlen($bytes) <= SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) throw new RuntimeException('totp_ciphertext');
  $nonce = substr($bytes, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
  $plain = sodium_crypto_secretbox_open(substr($bytes, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), $nonce, $key);
  if (!is_string($plain)) throw new RuntimeException('totp_ciphertext');
  return $plain;
}

function generateRecoveryCodes(int $count = 10): array {
  $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  $codes = [];
  while (count($codes) < $count) {
    $raw = '';
    for ($i = 0; $i < 12; $i++) $raw .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    $codes[$raw] = substr($raw, 0, 4) . '-' . substr($raw, 4, 4) . '-' . substr($raw, 8, 4);
  }
  return array_values($codes);
}

function hashRecoveryCodes(array $codes): array {
  return array_map(static fn(string $code): string => password_hash($code, PASSWORD_BCRYPT), $codes);
}

function totpMethod(array $cfg, string $userId): ?array {
  $result = _auth_find_one($cfg, 'user_totp_methods', ['user_id' => $userId], 'user_id,secret_ciphertext,enabled_at,last_verified_step,updated_at');
  return is_array($result['data'] ?? null) ? $result['data'] : null;
}

function totpIsActive(array $cfg, string $userId): bool {
  $result = _auth_filtered_get($cfg, 'user_totp_methods', [
    ['user_id', 'eq', $userId],
    ['enabled_at', 'not.is', 'null'],
  ], 'user_id', 1);
  return is_array($result['data'] ?? null) && count($result['data']) === 1;
}

function createTotpLoginChallenge(array $cfg, string $userId, bool $remember = false, string $destination = '/account'): ?string {
  $id = bin2hex(random_bytes(24));
  $insert = _auth_insert($cfg, 'auth_challenges', [
    'id' => $id,
    'user_id' => $userId,
    'kind' => 'login_totp',
    'payload' => ['remember' => $remember, 'destination' => str_starts_with($destination, '/') && !str_starts_with($destination, '//') ? $destination : '/account'],
    'expires_at' => gmdate('Y-m-d\TH:i:s\Z', time() + 300),
  ]);
  return isset($insert['error']) ? null : $id;
}

function decodeChallengePayload(mixed $payload): array {
  if (is_array($payload)) return $payload;
  if (is_string($payload)) {
    $decoded = json_decode($payload, true);
    if (is_array($decoded)) return $decoded;
  }
  return [];
}
