<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/auth-helpers.php';
require_once __DIR__ . '/../lib/registration-validation.php';

/**
 * Normalize allow-listed profile fields and return field-specific errors.
 *
 * @return array{
 *   patch:array<string,string>,
 *   errors:list<array{field:string,message:string}>
 * }
 */
function profile_update_prepare_patch(array $body, array $currentUser): array {
  $limits = [
    'full_name' => 100,
    'nickname' => 30,
    'bio' => 300,
    'phone' => 40,
    'location' => 100,
    'birth_date' => 10,
    'company_name' => 150,
    'ico' => 32,
    'dic' => 32,
    'billing_address' => 300,
    'language' => 10,
  ];
  $patch = [];
  $errors = [];

  foreach ($limits as $field => $limit) {
    if (!array_key_exists($field, $body)) {
      continue;
    }
    if (!is_string($body[$field])) {
      $errors[] = ['field' => $field, 'message' => 'Hodnota pole není platná.'];
      continue;
    }
    $value = $field === 'nickname'
      ? registerNormalizeNickname($body[$field])
      : trim($body[$field]);
    if ($value === null || (function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value)) > $limit) {
      $errors[] = ['field' => $field, 'message' => 'Hodnota pole je příliš dlouhá.'];
      continue;
    }
    $patch[$field] = $value;
  }

  if (array_key_exists('full_name', $patch) && strlen($patch['full_name']) < 2) {
    $errors[] = ['field' => 'full_name', 'message' => 'Jméno musí mít alespoň 2 znaky.'];
  }

  if (
    array_key_exists('nickname', $patch)
    && !registerNicknameIsValid($patch['nickname'])
  ) {
    $errors[] = [
      'field' => 'nickname',
      'message' => 'Přezdívka musí mít 2–30 povolených znaků.',
    ];
  }

  if (array_key_exists('birth_date', $patch) && $patch['birth_date'] !== '') {
    $parts = explode('-', $patch['birth_date']);
    $validDate = (
      count($parts) === 3
      && preg_match('/\A\d{4}-\d{2}-\d{2}\z/D', $patch['birth_date']) === 1
      && checkdate((int) $parts[1], (int) $parts[2], (int) $parts[0])
    );
    if (!$validDate) {
      $errors[] = ['field' => 'birth_date', 'message' => 'Datum narození není platné.'];
    }
  }

  return ['patch' => $patch, 'errors' => $errors];
}

function profile_update_run(array $cfg): never {
  beginJson($cfg);
  $method = $_SERVER['REQUEST_METHOD'] ?? '';
  if ($method !== 'PATCH' && $method !== 'POST') {
    header('Allow: PATCH, POST');
    jsonErr('Method not allowed', 405);
  }

  $user = requireAuth($cfg);
  $prepared = profile_update_prepare_patch(jsonBody(), $user);
  $patch = $prepared['patch'];
  $errors = $prepared['errors'];

  if ($patch === [] && $errors === []) {
    jsonErr('Nebyla odeslána žádná podporovaná změna.', 422);
  }
  if ($errors !== []) {
    jsonErr($errors[0]['message'], 422, $errors[0]['field']);
  }

  if (
    array_key_exists('nickname', $patch)
    && $patch['nickname'] !== (string) ($user['nickname'] ?? '')
  ) {
    $normalized = registerNicknameLookupKey($patch['nickname']);
    if ($normalized === null) jsonErr('Přezdívku se nepodařilo zpracovat.', 503, 'nickname');
    $existing = _auth_find_one($cfg, 'users', ['nickname_normalized' => $normalized], 'id');
    if (isset($existing['error'])) {
      jsonErr('Dostupnost přezdívky se nepodařilo ověřit.', 503, 'nickname');
    }
    if (
      is_array($existing['data'] ?? null)
      && ($existing['data']['id'] ?? null) !== $user['id']
    ) {
      jsonErr('Tato přezdívka je již obsazená.', 409, 'nickname');
    }
    $patch['nickname_normalized'] = $normalized;
  }

  $result = _auth_update($cfg, 'users', ['id' => $user['id']], $patch);
  if (isset($result['error'])) {
    if (($result['code'] ?? '') === '23505') {
      jsonErr('Tato přezdívka je již obsazená.', 409, 'nickname');
    }
    jsonErr('Změny se nepodařilo uložit.', 500);
  }

  logActivity($cfg, (string) $user['id'], 'profile_update', 'Profil byl upraven');
  jsonOk(['user' => array_merge($user, $patch)]);
}

if (!defined('PROFILE_UPDATE_NO_MAIN')) {
  profile_update_run(auth_load_config());
}
