<?php
declare(strict_types=1);

require_once __DIR__ . '/auth-helpers.php';
require_once dirname(__DIR__, 2) . '/shared/i18n/locale.php';

const OAUTH_PROVIDERS = ['google', 'github', 'discord'];
const OAUTH_STATE_TTL_SECONDS = 600;

function oauth_provider_allowed(string $provider): bool {
  return in_array($provider, OAUTH_PROVIDERS, true);
}

function oauth_base64url(string $bytes): string {
  return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

function oauth_pkce_challenge(string $verifier): string {
  return oauth_base64url(hash('sha256', $verifier, true));
}

function oauth_safe_error_code(string $code): string {
  $allowed = [
    'oauth_cancelled', 'oauth_invalid_state', 'oauth_exchange_failed',
    'oauth_profile_failed', 'oauth_email_missing', 'oauth_email_unverified',
    'account_already_exists', 'oauth_configuration_error',
  ];
  return in_array($code, $allowed, true) ? $code : 'oauth_failed';
}

function oauth_error_message(string $code): string {
  return match (oauth_safe_error_code($code)) {
    'oauth_cancelled' => 'Přihlášení bylo zrušeno.',
    'oauth_invalid_state' => 'Přihlášení nebylo dokončeno. Zkuste to znovu.',
    'oauth_exchange_failed' => 'Přihlášení přes externí službu se nepodařilo.',
    'oauth_profile_failed' => 'Údaje účtu se nepodařilo načíst. Zkuste to znovu.',
    'oauth_email_missing' => 'Externí služba neposkytla e-mailovou adresu.',
    'oauth_email_unverified' => 'Použijte u externí služby ověřený e-mail.',
    'account_already_exists' => 'Účet s tímto e-mailem již existuje. Přihlaste se původní metodou a účet propojte v nastavení.',
    'oauth_configuration_error' => 'Přihlášení přes tuto službu nyní není dostupné.',
    default => 'Přihlášení se nepodařilo. Zkuste to prosím znovu.',
  };
}

function oauth_app_url(array $cfg): string {
  $url = $cfg['APP_BASE_URL'] ?? $cfg['APP_URL'] ?? '';
  return is_string($url) ? rtrim($url, '/') : '';
}

function oauth_callback_url(array $cfg, string $provider): string {
  if (!oauth_provider_allowed($provider)) return '';
  $base = oauth_app_url($cfg);
  return $base === '' ? '' : $base . '/api/oauth/' . $provider . '/callback.php';
}

function oauth_provider_config(array $cfg, string $provider): ?array {
  if (!oauth_provider_allowed($provider)) return null;
  $prefix = strtoupper($provider);
  $id = $cfg[$prefix . '_CLIENT_ID'] ?? null;
  $secret = $cfg[$prefix . '_CLIENT_SECRET'] ?? null;
  $callback = oauth_callback_url($cfg, $provider);
  if (!is_string($id) || $id === '' || !is_string($secret) || $secret === '' || $callback === '') return null;
  return ['client_id' => $id, 'client_secret' => $secret, 'callback' => $callback];
}

function oauth_redirect_to_login(string $error): never {
  $lang = vv_resolve_locale();
  vv_locale_cookie($lang);
  $dest = vv_locale_redirect_target('/account/login', $lang) . '?error=' . rawurlencode(oauth_safe_error_code($error));
  header('Cache-Control: no-store');
  header('Location: ' . $dest, true, 302);
  exit;
}

/** @return array{http:int,body:string,error:?string} */
function oauth_http(string $method, string $url, array $headers = [], ?array $form = null): array {
  $ch = curl_init($url);
  $body = $form === null ? null : http_build_query($form, '', '&', PHP_QUERY_RFC3986);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
  ];
  if ($body !== null) $opts[CURLOPT_POSTFIELDS] = $body;
  curl_setopt_array($ch, $opts);
  $raw = curl_exec($ch);
  $response = [
    'http' => (int) curl_getinfo($ch, CURLINFO_HTTP_CODE),
    'body' => is_string($raw) ? $raw : '',
    'error' => ($error = curl_error($ch)) !== '' ? $error : null,
  ];
  curl_close($ch);
  return $response;
}

/** @return array<string,mixed>|null */
function oauth_json_response(array $response): ?array {
  if ($response['error'] !== null || $response['http'] < 200 || $response['http'] >= 300) return null;
  $data = json_decode($response['body'], true);
  return is_array($data) ? $data : null;
}

function oauth_authorization_url(array $cfg, string $provider, string $state, string $challenge): string {
  $providerCfg = oauth_provider_config($cfg, $provider);
  if ($providerCfg === null) return '';
  $params = match ($provider) {
    'google' => [
      'client_id' => $providerCfg['client_id'], 'redirect_uri' => $providerCfg['callback'],
      'response_type' => 'code', 'scope' => 'openid email profile', 'state' => $state,
      'code_challenge' => $challenge, 'code_challenge_method' => 'S256', 'prompt' => 'select_account',
    ],
    'github' => [
      'client_id' => $providerCfg['client_id'], 'redirect_uri' => $providerCfg['callback'],
      'scope' => 'read:user user:email', 'state' => $state,
      'code_challenge' => $challenge, 'code_challenge_method' => 'S256',
    ],
    'discord' => [
      'client_id' => $providerCfg['client_id'], 'redirect_uri' => $providerCfg['callback'],
      'response_type' => 'code', 'scope' => 'identify email', 'state' => $state,
      'code_challenge' => $challenge, 'code_challenge_method' => 'S256',
    ],
    default => [],
  };
  $base = match ($provider) {
    'google' => 'https://accounts.google.com/o/oauth2/v2/auth',
    'github' => 'https://github.com/login/oauth/authorize',
    'discord' => 'https://discord.com/oauth2/authorize',
  };
  return $base . '?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
}

/** @return array<string,mixed>|null */
function oauth_exchange_code(array $cfg, string $provider, string $code, string $verifier): ?array {
  $providerCfg = oauth_provider_config($cfg, $provider);
  if ($providerCfg === null) return null;
  $url = match ($provider) {
    'google' => 'https://oauth2.googleapis.com/token',
    'github' => 'https://github.com/login/oauth/access_token',
    'discord' => 'https://discord.com/api/oauth2/token',
  };
  $headers = ['Accept: application/json', 'Content-Type: application/x-www-form-urlencoded'];
  $data = oauth_json_response(oauth_http('POST', $url, $headers, [
    'client_id' => $providerCfg['client_id'], 'client_secret' => $providerCfg['client_secret'],
    'code' => $code, 'redirect_uri' => $providerCfg['callback'], 'grant_type' => 'authorization_code',
    'code_verifier' => $verifier,
  ]));
  return is_array($data) && is_string($data['access_token'] ?? null) && $data['access_token'] !== '' ? $data : null;
}

/** @return array{id:string,email:string,name:string,avatar_url:string}|null */
function oauth_provider_profile(string $provider, string $accessToken): ?array {
  $headers = ['Accept: application/json', 'Authorization: Bearer ' . $accessToken];
  if ($provider === 'google') {
    $data = oauth_json_response(oauth_http('GET', 'https://openidconnect.googleapis.com/v1/userinfo', $headers));
    if (!is_array($data) || ($data['email_verified'] ?? false) !== true) return null;
    return oauth_profile_values($data['sub'] ?? null, $data['email'] ?? null, $data['name'] ?? null, $data['picture'] ?? null);
  }
  if ($provider === 'github') {
    $user = oauth_json_response(oauth_http('GET', 'https://api.github.com/user', array_merge($headers, ['User-Agent: VEVIT OAuth'])));
    if (!is_array($user) || (!is_int($user['id'] ?? null) && !is_string($user['id'] ?? null))) return null;
    $emails = oauth_json_response(oauth_http('GET', 'https://api.github.com/user/emails', array_merge($headers, ['User-Agent: VEVIT OAuth'])));
    $email = null;
    if (is_array($emails)) foreach ($emails as $item) {
      if (is_array($item) && ($item['primary'] ?? false) === true && ($item['verified'] ?? false) === true && is_string($item['email'] ?? null)) { $email = $item['email']; break; }
    }
    return oauth_profile_values((string) $user['id'], $email, $user['name'] ?? $user['login'] ?? null, $user['avatar_url'] ?? null);
  }
  if ($provider === 'discord') {
    $data = oauth_json_response(oauth_http('GET', 'https://discord.com/api/users/@me', $headers));
    if (!is_array($data) || ($data['verified'] ?? false) !== true) return null;
    return oauth_profile_values($data['id'] ?? null, $data['email'] ?? null, $data['global_name'] ?? $data['username'] ?? null, $data['avatar'] ?? null);
  }
  return null;
}

/** @return array{id:string,email:string,name:string,avatar_url:string}|null */
function oauth_profile_values(mixed $id, mixed $email, mixed $name, mixed $avatar): ?array {
  if (!is_string($id) || $id === '' || !is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) return null;
  return [
    'id' => $id, 'email' => strtolower($email),
    'name' => is_string($name) ? trim($name) : '',
    'avatar_url' => is_string($avatar) && filter_var($avatar, FILTER_VALIDATE_URL) ? $avatar : '',
  ];
}

function oauth_consume_attempt(array $cfg, string $state): ?array {
  if (strlen($state) < 32 || strlen($state) > 256) return null;
  $res = sb_rpc($cfg, 'consume_oauth_attempt', ['p_state_hash' => hash('sha256', $state)]);
  $data = $res['data'] ?? null;
  return is_array($data) && isset($data[0]) && is_array($data[0]) ? $data[0] : null;
}

function oauth_profile_is_complete(array $user): bool {
  return is_string($user['full_name'] ?? null) && trim($user['full_name']) !== ''
    && is_string($user['nickname'] ?? null) && trim($user['nickname']) !== '';
}
