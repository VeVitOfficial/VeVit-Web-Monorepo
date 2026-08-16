<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/auth-helpers.php';
require_once __DIR__ . '/../../lib/phone-registration.php';
require_once __DIR__ . '/../../lib/twilio-verify.php';

function _phone_register_verify_run(array $cfg): never {
  beginJson($cfg);
  if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'POST') {
    header('Allow: POST');
    jsonErr('Method not allowed', 405);
  }
  requirePhoneRegistrationOrigin($cfg);
  $ip = clientIp($cfg);
  if (!checkRateLimit($cfg, $ip, 'phone_reg_verify', 12, 10)) jsonErr('Příliš mnoho pokusů.', 429);
  logAttempt($cfg, $ip, 'phone_reg_verify');

  $body = jsonBody();
  $id = strtolower(trim((string) ($body['challenge'] ?? '')));
  $code = trim((string) ($body['code'] ?? ''));
  if (!phoneRegistrationChallengeIsValid($id) || preg_match('/\A[0-9]{6}\z/D', $code) !== 1) {
    jsonErr('Kód je neplatný.', 422);
  }

  $lookup = _auth_find_one(
    $cfg,
    'pending_phone_registrations',
    ['id' => $id],
    'id,phone_e164,expires_at,attempts,used_at'
  );
  $pending = $lookup['data'] ?? null;
  if (!is_array($pending) || $pending['used_at'] !== null || phoneRegistrationExpired($pending)) {
    jsonErr('Platnost kódu vypršela.', 410);
  }
  if ((int) ($pending['attempts'] ?? 0) >= 6) jsonErr('Příliš mnoho pokusů. Požádejte o nový kód.', 429);

  $checked = checkTwilioVerification((string) $pending['phone_e164'], $code, $cfg);
  if (($checked['ok'] ?? false) !== true || ($checked['approved'] ?? false) !== true) {
    sb_rpc($cfg, 'record_phone_registration_failure', ['p_challenge_id' => $id]);
    jsonErr('Kód je neplatný nebo vypršel.', 422);
  }

  $userId = bin2hex(random_bytes(16));
  $completed = sb_rpc($cfg, 'complete_phone_registration', [
    'p_challenge_id' => $id,
    'p_user_id' => $userId,
  ]);
  if (isset($completed['error'])) jsonErr(phoneRegistrationPublicError(), 409);

  createSession($cfg, $userId);
  logActivity($cfg, $userId, 'login', 'Telefonní registrace dokončena.');
  jsonOk(['redirect' => '/account'], 201);
}

if (!defined('PHONE_REGISTER_VERIFY_NO_MAIN')) {
  _phone_register_verify_run(auth_load_config());
}
