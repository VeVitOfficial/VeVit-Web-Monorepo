<?php
declare(strict_types=1);
require_once __DIR__ . '/registration-validation.php';

function normalizeE164Phone(string $input): ?string {
  $value = preg_replace('/[\s().-]+/', '', trim($input));
  if (!is_string($value) || preg_match('/[^0-9+]/', $value) === 1) return null;
  if (str_starts_with($value, '00420')) $value = '+420' . substr($value, 5);
  if (preg_match('/\A[0-9]{9}\z/D', $value) === 1) $value = '+420' . $value;
  if (preg_match('/\A\+420[0-9]{9}\z/D', $value) !== 1) return null;
  return $value;
}

/** @return array{kind:'email'|'phone'|'nickname',value:string}|null */
function classifyLoginIdentifier(string $input): ?array {
  $value = trim($input);
  if ($value === '') return null;
  if (filter_var($value, FILTER_VALIDATE_EMAIL)) return ['kind' => 'email', 'value' => strtolower($value)];
  $phone = normalizeE164Phone($value);
  if ($phone !== null) return ['kind' => 'phone', 'value' => $phone];
  $nickname = registerNormalizeNickname($value);
  if ($nickname !== null && registerNicknameIsValid($nickname)) {
    return ['kind' => 'nickname', 'value' => $nickname];
  }
  return null;
}
