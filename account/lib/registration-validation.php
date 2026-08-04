<?php
declare(strict_types=1);

/**
 * Validate a public nickname. Keep this policy identical in the registration
 * endpoint and the availability lookup so the UI never promises an unusable ID.
 */
function registerNicknameIsValid(string $nickname): bool {
  $normalized = registerNormalizeNickname($nickname);
  if ($normalized === null) return false;
  $length = function_exists('mb_strlen') ? mb_strlen($normalized, 'UTF-8') : strlen($normalized);
  return $length >= 2 && $length <= 30 && preg_match('/\A[\p{L}\p{M}\p{N} ._\'’-]+\z/uD', $normalized) === 1;
}

function registerNormalizeNickname(string $nickname): ?string {
  $nickname = trim($nickname);
  $nickname = preg_replace('/\s+/u', ' ', $nickname);
  if (!is_string($nickname) || $nickname === '' || preg_match('/[\p{Cc}\p{Cf}]/u', $nickname) === 1) return null;
  if (class_exists('Normalizer')) $nickname = Normalizer::normalize($nickname, Normalizer::FORM_C);
  return is_string($nickname) ? $nickname : null;
}

function registerNicknameLookupKey(string $nickname): ?string {
  $nickname = registerNormalizeNickname($nickname);
  if ($nickname === null || !function_exists('mb_strtolower')) return null;
  return mb_strtolower($nickname, 'UTF-8');
}

/**
 * Return a client-safe password validation error, or null for an acceptable
 * bcrypt password. strlen is deliberate: bcrypt's 72-byte input ceiling is
 * byte-based, not character-based.
 */
function registerPasswordError(string $password): ?string {
  if (strlen($password) < 8) {
    return 'Heslo musí mít alespoň 8 znaků.';
  }
  if (strlen($password) > 72) {
    return 'Heslo je příliš dlouhé.';
  }
  if (preg_match('/[A-Z]/', $password) !== 1
    || preg_match('/[a-z]/', $password) !== 1
    || preg_match('/\\d/', $password) !== 1
    || preg_match('/[^A-Za-z0-9]/', $password) !== 1) {
    return 'Heslo nesplňuje bezpečnostní požadavky.';
  }

  return null;
}
