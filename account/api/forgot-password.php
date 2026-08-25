<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
require_once __DIR__ . '/../lib/anti-bot.php';
require_once __DIR__ . '/../lib/identifier-backoff.php';

/**
 * Handle one forgot-password request.
 */
function _forgot_password_run(array $cfg, ?string $rawBody = null): never {
  beginJson($cfg);
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') jsonErr('Method not allowed', 405);

  $ip = clientIp($cfg);
  if (!checkRateLimit($cfg, $ip, 'forgot_password', 3, 60)) {
    logAttempt($cfg, $ip, 'forgot_password');
    jsonErr('Příliš mnoho pokusů. Zkuste to za hodinu.', 429);
  }
  logAttempt($cfg, $ip, 'forgot_password');

  if ($rawBody === null) {
    $input = file_get_contents('php://input');
    $rawBody = is_string($input) ? $input : '';
  }
  $body = json_decode($rawBody, true);
  hpRequireAntiBotPassed(is_array($body) ? $body : []);
  if (!is_array($body)) {
    jsonErr('Invalid JSON body');
  }

  $email = strtolower(trim((string)($body['email'] ?? '')));
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonOk(['ok' => true]); // Don't reveal validation errors
  }

  // Per-identifier progressive backoff, keyed only on the normalized email
  // and checked before any users-table lookup — identical for a real inbox
  // and a made-up one, so it can never become an enumeration oracle and
  // can't be used to mail-bomb one victim by rotating the source IP.
  $identifierHash = identifierBackoffHash('forgot_password', $email);
  $identifierAllowed = identifierBackoffAllowed($cfg, $identifierHash, 'forgot_password_identifier');
  identifierBackoffRecord($cfg, $identifierHash, 'forgot_password_identifier');
  if (!$identifierAllowed) {
    jsonErr('Příliš mnoho pokusů. Zkuste to za hodinu.', 429);
  }

  $res = _auth_find_one($cfg, 'users', ['email' => $email], 'id,email,full_name');
  if (isset($res['data']) && $res['data'] !== null) {
    $user      = $res['data'];
    $rawToken  = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $rawToken);
    $expires   = date('Y-m-d\TH:i:s\Z', time() + 3600);

    _auth_update($cfg, 'users', ['id' => $user['id']], [
      'reset_token_hash'       => $tokenHash,
      'reset_token_expires_at' => $expires,
    ]);

    $link     = rtrim($cfg['APP_URL'], '/') . '/reset-password.html?token=' . rawurlencode($rawToken);
    $name     = $user['full_name'] ?? 'uživateli';
    $subject  = 'Obnova hesla · vevit';
    $body_txt = "Dobrý den, {$name},\n\n"
      . "Pro obnovu hesla klikněte na odkaz níže (platný 1 hodinu):\n"
      . "{$link}\n\n"
      . "Pokud jste o obnovu hesla nežádali, tento e-mail ignorujte.\n\n"
      . "— Tým vevit";

    $headers = [
      "From: {$cfg['MAIL_FROM_NAME']} <{$cfg['MAIL_FROM']}>",
      'Content-Type: text/plain; charset=UTF-8',
      'MIME-Version: 1.0',
    ];

    @mail($user['email'], $subject, $body_txt, implode("\r\n", $headers));
  }

  // Always return success — never reveal whether email exists
  jsonOk(['ok' => true]);
}

if (!defined('FORGOT_PASSWORD_ENDPOINT_NO_MAIN')) {
  _forgot_password_run(auth_load_config());
}
