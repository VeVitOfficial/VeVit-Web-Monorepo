<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/auth-helpers.php';
require_once __DIR__ . '/../../lib/phone-identity.php';
require_once __DIR__ . '/../../lib/registration-validation.php';
require_once __DIR__ . '/../../lib/phone-registration.php';
require_once __DIR__ . '/../../lib/twilio-verify.php';

function _phone_register_start_run(array $cfg): never {
  beginJson($cfg);
  if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'POST') {
    header('Allow: POST');
    jsonErr('Method not allowed', 405);
  }
  requirePhoneRegistrationOrigin($cfg);

  $ip = clientIp($cfg);
  if (!checkRateLimit($cfg, $ip, 'phone_register_start', 5, 10)) {
    jsonErr('Kód se nepodařilo odeslat. Zkuste to později.', 429);
  }
  logAttempt($cfg, $ip, 'phone_register_start');
  $body = jsonBody();

  $fullName = trim((string) ($body['full_name'] ?? ''));
  $nickname = registerNormalizeNickname((string) ($body['nickname'] ?? ''));
  $nicknameKey = $nickname === null ? null : registerNicknameLookupKey($nickname);
  $phone = normalizeE164Phone((string) ($body['phone'] ?? ''));
  $password = (string) ($body['password'] ?? '');
  $confirmation = (string) ($body['password_confirmation'] ?? '');
  $nameLength = function_exists('mb_strlen') ? mb_strlen($fullName, 'UTF-8') : strlen($fullName);

  if ($nameLength < 2 || $nameLength > 120) jsonErr('Zkontrolujte zadané jméno.', 422, 'full_name');
  if ($nickname === null || $nicknameKey === null || !registerNicknameIsValid($nickname)) {
    jsonErr('Zkontrolujte zadanou přezdívku.', 422, 'nickname');
  }
  if ($phone === null) jsonErr('Neplatné telefonní číslo.', 422, 'phone');
  $passwordError = registerPasswordError($password);
  if ($passwordError !== null) jsonErr($passwordError, 422, 'password');
  if (!hash_equals($password, $confirmation)) jsonErr('Hesla se neshodují.', 422, 'password_confirmation');

  foreach ([['phone_e164' => $phone], ['nickname_normalized' => $nicknameKey]] as $filter) {
    $lookup = _auth_find_one($cfg, 'users', $filter, 'id');
    if (isset($lookup['error'])) jsonErr('Registraci se nepodařilo ověřit.', 503);
    if (($lookup['data'] ?? null) !== null) jsonErr(phoneRegistrationPublicError(), 409);
  }
  $recentPhone = _auth_filtered_get(
    $cfg,
    'pending_phone_registrations',
    [
      ['phone_e164', 'eq', $phone],
      ['expires_at', 'gt', gmdate('Y-m-d\TH:i:s\Z')],
    ],
    'id',
    1
  );
  if (!is_array($recentPhone['data'] ?? null) || count($recentPhone['data']) > 0) {
    jsonErr('Kód se nepodařilo odeslat. Zkuste to později.', 429);
  }

  $id = bin2hex(random_bytes(24));
  $hash = password_hash($password, PASSWORD_BCRYPT);
  if (!is_string($hash)) jsonErr('Registraci se nepodařilo zahájit.', 500);
  $now = time();
  $insert = _auth_insert($cfg, 'pending_phone_registrations', [
    'id' => $id,
    'full_name' => $fullName,
    'nickname' => $nickname,
    'nickname_normalized' => $nicknameKey,
    'phone_e164' => $phone,
    'password_hash' => $hash,
    'expires_at' => gmdate('Y-m-d\TH:i:s\Z', $now + 600),
    'last_sent_at' => gmdate('Y-m-d\TH:i:s\Z', $now),
  ]);
  if (isset($insert['error'])) jsonErr('Registraci se nepodařilo zahájit.', 503);

  $sent = sendTwilioVerification($phone, $cfg);
  if (($sent['ok'] ?? false) !== true) {
    _auth_delete($cfg, 'pending_phone_registrations', ['id' => $id]);
    jsonErr('Kód se nepodařilo odeslat. Zkuste to později.', 503);
  }

  jsonOk(['redirect' => '/verify-phone.php?challenge=' . rawurlencode($id)], 201);
}

if (!defined('PHONE_REGISTER_START_NO_MAIN')) {
  _phone_register_start_run(auth_load_config());
}
