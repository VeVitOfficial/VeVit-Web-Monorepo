<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/oauth.php';

$provider = strtolower((string) ($_GET['provider'] ?? ''));
if (!oauth_provider_allowed($provider)) oauth_redirect_to_login('oauth_configuration_error');

$cfg = auth_load_config();
if (oauth_provider_config($cfg, $provider) === null) oauth_redirect_to_login('oauth_configuration_error');

$mode = (string) ($_GET['mode'] ?? 'login');
$twofaAction = in_array((string) ($_GET['twofa_action'] ?? ''), ['setup','regenerate','disable'], true)
  ? (string) $_GET['twofa_action'] : 'setup';
$initiatedUserId = null;
if ($mode === 'connect' || $mode === 'twofa_reauth') {
  $initiatedUser = getCurrentUser($cfg);
  if ($initiatedUser === null) oauth_redirect_to_login('oauth_invalid_state');
  $initiatedUserId = $initiatedUser['id'];
}
$state = oauth_base64url(random_bytes(32));
$verifier = oauth_base64url(random_bytes(48));
$attempt = _auth_insert($cfg, 'oauth_attempts', [
  'state_hash' => hash('sha256', $state),
  'provider' => $provider,
  'code_verifier' => $verifier,
  'destination' => $mode === 'twofa_reauth' ? 'twofa_reauth:' . $twofaAction : '/account',
  'initiated_user_id' => $initiatedUserId,
  'expires_at' => gmdate('Y-m-d\\TH:i:s\\Z', time() + OAUTH_STATE_TTL_SECONDS),
  'created_at' => gmdate('Y-m-d\\TH:i:s\\Z'),
]);
if (isset($attempt['error'])) oauth_redirect_to_login('oauth_exchange_failed');

$url = oauth_authorization_url($cfg, $provider, $state, oauth_pkce_challenge($verifier));
if ($url === '') oauth_redirect_to_login('oauth_configuration_error');
header('Cache-Control: no-store');
header('Location: ' . $url, true, 302);
exit;
