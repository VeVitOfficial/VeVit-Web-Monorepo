<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/oauth.php';
require_once __DIR__ . '/../../lib/totp.php';

function oauth_callback_run(string $provider): never {
  if (!oauth_provider_allowed($provider)) oauth_redirect_to_login('oauth_configuration_error');
  $cfg = auth_load_config();

  if (isset($_GET['error'])) {
    $state = $_GET['state'] ?? '';
    if (is_string($state)) oauth_consume_attempt($cfg, $state);
    oauth_redirect_to_login('oauth_cancelled');
  }
  $state = $_GET['state'] ?? '';
  $code = $_GET['code'] ?? '';
  if (!is_string($state) || !is_string($code) || $code === '' || strlen($code) > 4096) {
    oauth_redirect_to_login('oauth_invalid_state');
  }
  $attempt = oauth_consume_attempt($cfg, $state);
  if (!is_array($attempt) || ($attempt['provider'] ?? null) !== $provider) oauth_redirect_to_login('oauth_invalid_state');
  $verifier = $attempt['code_verifier'] ?? null;
  if (!is_string($verifier) || $verifier === '') oauth_redirect_to_login('oauth_invalid_state');

  $token = oauth_exchange_code($cfg, $provider, $code, $verifier);
  if (!is_array($token)) oauth_redirect_to_login('oauth_exchange_failed');
  $profile = oauth_provider_profile($provider, $token['access_token']);
  if (!is_array($profile)) oauth_redirect_to_login('oauth_email_unverified');

  $initiatedUserId = $attempt['initiated_user_id'] ?? null;
  if (is_string($initiatedUserId) && $initiatedUserId !== '') {
    $identity = _auth_find_one($cfg, 'oauth_identities', ['provider' => $provider, 'provider_user_id' => $profile['id']], 'user_id');
    if (isset($identity['error'])) oauth_redirect_to_login('oauth_profile_failed');
    if (is_array($identity['data'] ?? null) && ($identity['data']['user_id'] ?? null) !== $initiatedUserId) oauth_redirect_to_login('oauth_profile_failed');
    if (str_starts_with((string)($attempt['destination'] ?? ''),'twofa_reauth:')) {
      if (!is_array($identity['data'] ?? null)) oauth_redirect_to_login('oauth_profile_failed');
      $twofaAction=substr((string)$attempt['destination'],strlen('twofa_reauth:'));
      if(!in_array($twofaAction,['setup','regenerate','disable'],true))oauth_redirect_to_login('oauth_invalid_state');
      $reauthId=bin2hex(random_bytes(24));
      $reauth=_auth_insert($cfg,'auth_challenges',['id'=>$reauthId,'user_id'=>$initiatedUserId,'kind'=>'totp_setup','payload'=>['purpose'=>'oauth_reauth','action'=>$twofaAction],'expires_at'=>gmdate('c',time()+300)]);
      if(isset($reauth['error']))oauth_redirect_to_login('oauth_profile_failed');
      header('Cache-Control: no-store');header('Location: /account/security?twofa_reauth='.rawurlencode($reauthId).'&twofa_action='.rawurlencode($twofaAction),true,302);exit;
    }
    if (!is_array($identity['data'] ?? null)) {
      $linked = _auth_insert($cfg, 'oauth_identities', ['user_id' => $initiatedUserId, 'provider' => $provider, 'provider_user_id' => $profile['id'], 'provider_email' => $profile['email']]);
      if (isset($linked['error'])) oauth_redirect_to_login('oauth_profile_failed');
      logActivity($cfg, $initiatedUserId, 'oauth_connect', 'OAuth ' . $provider);
    }
    header('Cache-Control: no-store'); header('Location: /account/connections', true, 302); exit;
  }

  $identity = _auth_find_one($cfg, 'oauth_identities', [
    'provider' => $provider,
    'provider_user_id' => $profile['id'],
  ], 'user_id');
  if (isset($identity['error'])) oauth_redirect_to_login('oauth_profile_failed');
  $userId = is_array($identity['data'] ?? null) ? ($identity['data']['user_id'] ?? null) : null;

  if (!is_string($userId) || $userId === '') {
    $existing = _auth_find_one($cfg, 'users', ['email' => $profile['email']], 'id');
    if (isset($existing['error'])) oauth_redirect_to_login('oauth_profile_failed');
    if (is_array($existing['data'] ?? null)) oauth_redirect_to_login('account_already_exists');

    $newId = bin2hex(random_bytes(16));
    $created = sb_rpc($cfg, 'create_oauth_user_and_identity', [
      'p_user_id' => $newId,
      'p_email' => $profile['email'],
      'p_full_name' => $profile['name'],
      'p_avatar_url' => $profile['avatar_url'],
      'p_provider' => $provider,
      'p_provider_user_id' => $profile['id'],
      'p_provider_email' => $profile['email'],
    ]);
    $createdId = $created['data'] ?? null;
    if (is_array($createdId)) $createdId = $createdId[0] ?? null;
    if (!is_string($createdId) || $createdId === '') oauth_redirect_to_login('oauth_profile_failed');
    $userId = $createdId;
  }

  $user = _auth_find_one($cfg, 'users', ['id' => $userId], 'id,email,full_name,nickname');
  if (!is_array($user['data'] ?? null)) oauth_redirect_to_login('oauth_profile_failed');
  if (totpIsActive($cfg, $userId)) {
    $challenge = createTotpLoginChallenge($cfg, $userId, false, oauth_profile_is_complete($user['data']) ? '/account' : '/onboarding');
    if ($challenge === null) oauth_redirect_to_login('oauth_profile_failed');
    header('Cache-Control: no-store');
    header('Location: /account/verify-2fa.php?challenge=' . rawurlencode($challenge), true, 302);
    exit;
  }
  createSession($cfg, $userId, false);
  logActivity($cfg, $userId, 'login', 'OAuth ' . $provider);

  $destination = oauth_profile_is_complete($user['data']) ? '/account' : '/onboarding';
  header('Cache-Control: no-store');
  header('Location: ' . $destination, true, 302);
  exit;
}
