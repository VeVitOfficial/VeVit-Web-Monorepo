<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

$ip = clientIp($cfg);
if (!checkRateLimit($cfg, $ip, 'forgot_password', 3, 60)) {
  logAttempt($cfg, $ip, 'forgot_password');
  jsonErr('Příliš mnoho pokusů. Zkuste to za hodinu.', 429);
}
logAttempt($cfg, $ip, 'forgot_password');

$body  = jsonBody();
$email = strtolower(trim((string)($body['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  jsonOk(['ok' => true]); // Don't reveal validation errors
}

$res = sb_find_one($cfg, 'users', ['email' => $email], 'id,email,full_name');
if (isset($res['data']) && $res['data'] !== null) {
  $user      = $res['data'];
  $rawToken  = bin2hex(random_bytes(32));
  $tokenHash = hash('sha256', $rawToken);
  $expires   = date('Y-m-d\TH:i:s\Z', time() + 3600);

  sb_update($cfg, 'users', ['id' => $user['id']], [
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
