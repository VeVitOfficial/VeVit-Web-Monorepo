<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/auth-helpers.php';
require_once __DIR__ . '/../lib/phone-identity.php';
require_once __DIR__ . '/../lib/totp.php';
require_once __DIR__ . '/../lib/anti-bot.php';
require_once __DIR__ . '/../lib/identifier-backoff.php';
require_once dirname(__DIR__, 2) . '/shared/i18n/locale.php';

const LOGIN_DUMMY_PASSWORD_HASH =
  '$2y$12$DzmTmvnGr67voF.jFaQkhupI0djuR7dlzsQpzxUTQP2AZkjoNbj4W';

/**
 * Return the stored bcrypt hash or a valid dummy hash for equivalent work.
 */
function _login_password_hash(mixed $user): string {
  if (is_array($user)) {
    $hash = $user['password'] ?? null;
    if (is_string($hash)) {
      $info = password_get_info($hash);
      if (($info['algoName'] ?? null) === 'bcrypt') {
        return $hash;
      }
    }
  }

  return LOGIN_DUMMY_PASSWORD_HASH;
}

/**
 * Verify credentials without allowing a missing user to skip bcrypt work.
 */
function _login_credentials_match(mixed $user, string $password): bool {
  $verified = password_verify($password, _login_password_hash($user));
  $hasUser = (
    is_array($user)
    && isset($user['id'])
    && is_string($user['id'])
    && $user['id'] !== ''
  );

  return $hasUser && $verified;
}

/** A provider-only account intentionally has no local password. */
function _login_is_provider_only_account(mixed $user): bool {
  return is_array($user)
    && isset($user['id'])
    && is_string($user['id'])
    && $user['id'] !== ''
    && (!isset($user['password']) || $user['password'] === null || $user['password'] === '');
}

/**
 * Columns that are safe to expose in the login response.
 */
function _login_safe_user_columns(): string {
  return implode(',', [
    'id',
    'email',
    'nickname',
    'full_name',
    'tier',
    'tier_expires',
    'role',
    'avatar_url',
    'level',
    'xp',
    'language',
    'two_factor_enabled',
  ]);
}

/**
 * Handle one login request.
 */
function _login_run(array $cfg, ?string $rawBody = null): never {
  beginJson($cfg);

  if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'POST') {
    header('Allow: POST');
    jsonErr('Method not allowed', 405);
  }

  $ip = clientIp($cfg);
  $action = 'login';
  $allowed = checkRateLimit($cfg, $ip, $action, 10, 15);
  logAttempt($cfg, $ip, $action);
  if (!$allowed) {
    jsonErr('Příliš mnoho pokusů. Zkuste to za chvíli.', 429);
  }

  if ($rawBody === null) {
    $input = file_get_contents('php://input');
    $rawBody = is_string($input) ? $input : '';
  }
  $payload = json_decode($rawBody, true);
  hpRequireAntiBotPassed(is_array($payload) ? $payload : []);
  $usesUnifiedIdentifier = is_array($payload) && array_key_exists('identifier', $payload);
  $rawIdentifier = is_array($payload) && is_string($payload['identifier'] ?? null)
    ? $payload['identifier']
    : (is_array($payload) && is_string($payload['email'] ?? null) ? $payload['email'] : '');
  $identifier = classifyLoginIdentifier($rawIdentifier);
  $password = is_array($payload) && is_string($payload['password'] ?? null)
    ? $payload['password']
    : '';
  $remember = is_array($payload) ? ($payload['remember'] ?? false) : false;
  if (!is_bool($remember)) {
    jsonErr('Neplatná volba zapamatování.');
  }
  if ($identifier === null || $password === '') {
    jsonErr($usesUnifiedIdentifier ? 'Neplatné přihlašovací údaje.' : 'Vyplňte e-mail a heslo.', $usesUnifiedIdentifier ? 401 : 400);
  }

  // Per-identifier progressive backoff. Keyed only on the normalized
  // identifier, checked and recorded before any users-table lookup, so an
  // existing account and a made-up one are throttled identically.
  $identifierHash = identifierBackoffHash('login', $identifier['kind'] . ':' . $identifier['value']);
  $identifierAllowed = identifierBackoffAllowed($cfg, $identifierHash, 'login_identifier');
  identifierBackoffRecord($cfg, $identifierHash, 'login_identifier');
  if (!$identifierAllowed) {
    jsonErr($usesUnifiedIdentifier ? 'Neplatné přihlašovací údaje.' : 'Příliš mnoho pokusů. Zkuste to za chvíli.', 429);
  }

  if ($identifier['kind'] === 'phone') {
    $lookup = _auth_find_one($cfg, 'users', ['phone_e164' => $identifier['value']], 'id,password,email,phone_verified_at');
  } elseif ($identifier['kind'] === 'nickname') {
    $nicknameKey = registerNicknameLookupKey($identifier['value']);
    $lookup = $nicknameKey === null
      ? ['data' => null]
      : _auth_find_one($cfg, 'users', ['nickname_normalized' => $nicknameKey], 'id,password,email');
  } else {
    $lookup = _auth_find_one($cfg, 'users', ['email' => $identifier['value']], 'id,password,email');
  }
  if (
    array_key_exists('error', $lookup)
    || !array_key_exists('data', $lookup)
  ) {
    jsonErr($usesUnifiedIdentifier ? 'Neplatné přihlašovací údaje.' : 'Chyba serveru.', $usesUnifiedIdentifier ? 401 : 500);
  }

  $user = $lookup['data'];
  if (
    $identifier['kind'] === 'phone'
    && (!is_array($user) || !is_string($user['phone_verified_at'] ?? null) || $user['phone_verified_at'] === '')
  ) {
    // Still run bcrypt below to avoid a verified/unverified enumeration oracle.
    _login_credentials_match($user, $password);
    jsonErr($usesUnifiedIdentifier ? 'Neplatné přihlašovací údaje.' : 'Nesprávný e-mail nebo heslo.', 401);
  }
  if (_login_is_provider_only_account($user) || !_login_credentials_match($user, $password)) {
    jsonErr($usesUnifiedIdentifier ? 'Neplatné přihlašovací údaje.' : 'Nesprávný e-mail nebo heslo.', 401);
  }

  $userId = $user['id'];
  if (totpIsActive($cfg, $userId)) {
    $challenge = createTotpLoginChallenge($cfg, $userId, $remember, '/account');
    if ($challenge === null) jsonErr('Dvoufázové ověření se nepodařilo zahájit.', 500);
    // Locale z cookie/URL/Accept-Lang (profil ještě nenačten). Po 2FA následuje
    // finální login, který přesměruje podle users.language.
    $twoFaLang = vv_resolve_locale();
    vv_locale_cookie($twoFaLang);
    $twoFaRedirect = vv_locale_redirect_target('/account/verify-2fa.php', $twoFaLang)
      . '?challenge=' . rawurlencode($challenge);
    jsonOk(['requires_2fa' => true, 'redirect' => $twoFaRedirect]);
  }
  createSession($cfg, $userId, $remember);
  logActivity($cfg, $userId, 'login', $ip);

  $safeColumns = _login_safe_user_columns();
  $profileResult = _auth_find_one(
    $cfg,
    'users',
    ['id' => $userId],
    $safeColumns
  );
  $profile = $profileResult['data'] ?? null;
  if (
    array_key_exists('error', $profileResult)
    || !is_array($profile)
    || !isset($profile['id'])
    || !is_string($profile['id'])
    || !hash_equals($userId, $profile['id'])
  ) {
    jsonErr('Chyba serveru.', 500);
  }

  $allowedKeys = array_flip(explode(',', $safeColumns));
  // Cross-device: redirect podle users.language (z DB) → /<lang>/<sekci>.
  $lang = vv_locale_valid($profile['language'] ?? 'cs');
  vv_locale_cookie($lang);
  $returnTo = vv_safe_return_to($payload['return_to'] ?? null, '/account');
  $redirect = vv_locale_redirect_target($returnTo, $lang);
  jsonOk(['user' => array_intersect_key($profile, $allowedKeys), 'redirect' => $redirect]);
}

if (!defined('LOGIN_ENDPOINT_NO_MAIN')) {
  _login_run(auth_load_config());
}
