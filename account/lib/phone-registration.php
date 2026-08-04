<?php
declare(strict_types=1);

function phoneRegistrationChallengeIsValid(string $id): bool {
  return preg_match('/\A[0-9a-f]{48}\z/D', $id) === 1;
}

function maskCzechPhone(string $phone): string {
  if (preg_match('/\A\+420([0-9]{3})([0-9]{3})([0-9]{2})([0-9])\z/D', $phone, $m) !== 1) {
    return '+420 *** *** ***';
  }
  return '+420 ' . $m[1] . ' *** **' . $m[4];
}

function phoneRegistrationExpired(array $pending): bool {
  $expires = strtotime((string) ($pending['expires_at'] ?? ''));
  return $expires === false || $expires <= time();
}

function phoneRegistrationPublicError(): string {
  return 'Telefonní registraci se nepodařilo dokončit. Zkuste to znovu.';
}

function requirePhoneRegistrationOrigin(array $cfg): void {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
  $allowed = $cfg['ALLOWED_ORIGIN'] ?? null;
  if (!is_string($origin) || !is_string($allowed) || $origin === '' || $allowed === '' || !hash_equals($allowed, $origin)) {
    jsonErr('Origin not allowed', 403);
  }
}
