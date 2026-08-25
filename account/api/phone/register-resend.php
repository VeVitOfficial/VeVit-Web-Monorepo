<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/auth-helpers.php';
require_once __DIR__ . '/../../lib/phone-registration.php';
require_once __DIR__ . '/../../lib/twilio-verify.php';

function _phone_register_resend_run(array $cfg): never {
  beginJson($cfg);
  if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'POST') {
    header('Allow: POST');
    jsonErr('Method not allowed', 405);
  }
  requirePhoneRegistrationOrigin($cfg);
  $ip = clientIp($cfg);
  if (!checkRateLimit($cfg, $ip, 'phone_reg_resend', 5, 60)) {
    jsonErr('Kód se nepodařilo odeslat. Zkuste to později.', 429);
  }
  logAttempt($cfg, $ip, 'phone_reg_resend');
  $body = jsonBody();
  $id = strtolower(trim((string) ($body['challenge'] ?? '')));
  if (!phoneRegistrationChallengeIsValid($id)) jsonErr('Ověření není platné.', 422);

  $lookup = _auth_find_one(
    $cfg,
    'pending_phone_registrations',
    ['id' => $id],
    'id,phone_e164,expires_at,used_at'
  );
  $pending = $lookup['data'] ?? null;
  if (!is_array($pending) || $pending['used_at'] !== null || phoneRegistrationExpired($pending)) {
    jsonErr('Platnost ověření vypršela.', 410);
  }

  $reserved = sb_rpc($cfg, 'reserve_phone_registration_resend', ['p_challenge_id' => $id]);
  if (($reserved['data'] ?? null) !== true) jsonErr('Další kód lze poslat až za chvíli.', 429);
  $sent = sendTwilioVerification((string) $pending['phone_e164'], $cfg);
  if (($sent['ok'] ?? false) !== true) jsonErr('Kód se nepodařilo odeslat. Zkuste to později.', 503);
  jsonOk(['message' => 'Nový kód byl odeslán.']);
}

if (!defined('PHONE_REGISTER_RESEND_NO_MAIN')) {
  _phone_register_resend_run(auth_load_config());
}
