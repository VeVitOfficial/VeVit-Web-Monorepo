<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/phone-identity.php';
require_once __DIR__ . '/../lib/phone-registration.php';
require_once __DIR__ . '/../lib/twilio-verify.php';

function flowAssert(bool $condition, string $message): void {
  if (!$condition) {
    fwrite(STDERR, "FAIL {$message}\n");
    exit(1);
  }
}

flowAssert(normalizeE164Phone('111 222 333') === '+420111222333', 'local Czech phone normalization');
flowAssert(normalizeE164Phone('+420 111 222 333') === '+420111222333', 'international Czech phone normalization');
flowAssert(normalizeE164Phone('00420111222333') === '+420111222333', '00420 phone normalization');
flowAssert(maskCzechPhone('+420111222333') === '+420 111 *** **3', 'phone masking');
flowAssert(phoneRegistrationExpired(['expires_at' => gmdate('c', time() - 1)]), 'expired challenge detection');
flowAssert(!phoneRegistrationExpired(['expires_at' => gmdate('c', time() + 60)]), 'active challenge detection');
flowAssert(registerNicknameIsValid('Jiří Novák'), 'Unicode nickname');
flowAssert(registerNicknameLookupKey('  JIŘÍ   Novák ') === 'jiří novák', 'Unicode nickname lookup key');

$calls = [];
$GLOBALS['_TWILIO_VERIFY_ADAPTER'] = static function (string $resource, array $body) use (&$calls): array {
  $calls[] = [$resource, array_keys($body)];
  return ['ok' => true, 'approved' => $resource === '/VerificationCheck'];
};
flowAssert(sendTwilioVerification('+420111222333')['ok'] === true, 'mocked Twilio send');
flowAssert(checkTwilioVerification('+420111222333', '123456')['approved'] === true, 'mocked Twilio check');
flowAssert(count($calls) === 2, 'Twilio adapter invocation');
unset($GLOBALS['_TWILIO_VERIFY_ADAPTER']);

$migration = file_get_contents(__DIR__ . '/../sql/migrations/010_phone_registration_flow.sql');
$start = file_get_contents(__DIR__ . '/../api/phone/register-start.php');
$verify = file_get_contents(__DIR__ . '/../api/phone/register-verify.php');
$resend = file_get_contents(__DIR__ . '/../api/phone/register-resend.php');
$page = file_get_contents(__DIR__ . '/../verify-phone.php');
$register = file_get_contents(__DIR__ . '/../register.html');

foreach ([
  $start => 'start',
  $verify => 'verify',
  $resend => 'resend',
] as $endpointSource => $label) {
  preg_match_all("/logAttempt\\([^;]+?'([^']+)'\\s*\\)/", (string) $endpointSource, $matches);
  foreach ($matches[1] ?? [] as $action) {
    flowAssert(strlen($action) <= 20, "{$label} rate-limit action fits production varchar(20)");
  }
}

foreach ([
  [$migration, 'pending_phone_registrations', 'pending table'],
  [$migration, 'ENABLE ROW LEVEL SECURITY', 'RLS'],
  [$migration, 'REVOKE ALL', 'privilege revocation'],
  [$migration, 'complete_phone_registration', 'atomic completion RPC'],
  [$migration, "password_hash = repeat('*', 60)", 'used password hash scrubbing'],
  [$start, 'password_hash($password', 'password hashing'],
  [$start, '_auth_delete', 'failed send cleanup'],
  [$start, 'requirePhoneRegistrationOrigin', 'same-origin registration protection'],
  [$verify, 'checkTwilioVerification', 'Twilio check'],
  [$verify, 'createSession($cfg, $userId)', 'standard session'],
  [$resend, 'reserve_phone_registration_resend', 'atomic resend cooldown'],
  [$page, 'autocomplete="one-time-code"', 'OTP autocomplete'],
  [$register, 'phone-register-flow-v2', 'deployment marker'],
  [$register, 'api/phone/register-start.php', 'phone frontend endpoint'],
] as [$source, $needle, $label]) {
  flowAssert(is_string($source) && str_contains($source, $needle), $label);
}
flowAssert(!str_contains((string) $migration, '111222333'), 'no test records in migration');
flowAssert(!str_contains((string) $start, "'password' =>"), 'no plaintext password persistence');

fwrite(STDOUT, "PASS phone registration flow contracts and Twilio mock\n");
