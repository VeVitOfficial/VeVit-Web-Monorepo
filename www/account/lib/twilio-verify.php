<?php
declare(strict_types=1);

function _twilioVerifyConfig(?array $cfg): array {
  if ($cfg !== null) return $cfg;
  return function_exists('auth_load_config') ? auth_load_config() : [];
}

function twilioVerifyRequest(string $resource, array $body, ?array $cfg = null): array {
  $adapter = $GLOBALS['_TWILIO_VERIFY_ADAPTER'] ?? null;
  if (is_callable($adapter)) {
    $result = $adapter($resource, $body);
    return is_array($result) ? $result : ['ok' => false, 'approved' => false];
  }

  $cfg = _twilioVerifyConfig($cfg);
  foreach (['TWILIO_ACCOUNT_SID', 'TWILIO_API_KEY', 'TWILIO_API_KEY_SECRET', 'TWILIO_VERIFY_SERVICE_SID'] as $key) {
    if (!isset($cfg[$key]) || !is_string($cfg[$key]) || $cfg[$key] === '') {
      return ['ok' => false, 'approved' => false, 'error' => 'configuration'];
    }
  }
  if (!function_exists('curl_init')) return ['ok' => false, 'approved' => false, 'error' => 'transport'];

  $url = 'https://verify.twilio.com/v2/Services/'
    . rawurlencode($cfg['TWILIO_VERIFY_SERVICE_SID']) . $resource;
  $curl = curl_init($url);
  curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($body, '', '&', PHP_QUERY_RFC3986),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 12,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_USERPWD => $cfg['TWILIO_API_KEY'] . ':' . $cfg['TWILIO_API_KEY_SECRET'],
    CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/x-www-form-urlencoded'],
  ]);
  $raw = curl_exec($curl);
  $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
  $transportError = curl_errno($curl) !== 0;
  curl_close($curl);
  if ($transportError || !is_string($raw)) return ['ok' => false, 'approved' => false, 'error' => 'transport'];

  $decoded = json_decode($raw, true);
  if (!is_array($decoded)) return ['ok' => false, 'approved' => false, 'error' => 'response'];
  $ok = $status >= 200 && $status < 300;
  return ['ok' => $ok, 'approved' => $ok && ($decoded['status'] ?? '') === 'approved'];
}

function sendTwilioVerification(string $phoneE164, ?array $cfg = null): array {
  return twilioVerifyRequest('/Verifications', ['To' => $phoneE164, 'Channel' => 'sms'], $cfg);
}

function checkTwilioVerification(string $phoneE164, string $code, ?array $cfg = null): array {
  return twilioVerifyRequest('/VerificationCheck', ['To' => $phoneE164, 'Code' => $code], $cfg);
}
