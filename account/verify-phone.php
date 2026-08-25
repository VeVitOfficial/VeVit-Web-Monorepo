<?php
declare(strict_types=1);
require_once __DIR__ . '/lib/auth-helpers.php';
require_once __DIR__ . '/lib/phone-registration.php';

header('Cache-Control: no-store, private, max-age=0');
$challenge = strtolower(trim((string) ($_GET['challenge'] ?? '')));
$maskedPhone = null;
$secondsUntilResend = 60;
if (phoneRegistrationChallengeIsValid($challenge)) {
  $cfg = auth_load_config();
  $result = _auth_find_one(
    $cfg,
    'pending_phone_registrations',
    ['id' => $challenge],
    'phone_e164,expires_at,last_sent_at,used_at'
  );
  $pending = $result['data'] ?? null;
  if (is_array($pending) && $pending['used_at'] === null && !phoneRegistrationExpired($pending)) {
    $maskedPhone = maskCzechPhone((string) $pending['phone_e164']);
    $lastSent = strtotime((string) ($pending['last_sent_at'] ?? ''));
    if ($lastSent !== false) $secondsUntilResend = max(0, 60 - (time() - $lastSent));
  }
}
?>
<!doctype html>
<html lang="cs">
<head>
  <link rel="icon" href="/account/images/icon.ico" type="image/x-icon">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title data-i18n="auth.verifyphone.docTitle">Ověření telefonu – VEVIT</title>
  <style>
    :root{--bg:#070908;--card:#101311;--line:#273029;--text:#f4f7f4;--muted:#a2aba4;--green:#39e079;--red:#ff6b6b}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;display:grid;place-items:center;padding:24px}
    .card{width:min(100%,460px);padding:32px;border:1px solid var(--line);border-radius:20px;background:var(--card);box-shadow:0 24px 70px #0008}
    .brand{font-weight:800;letter-spacing:.12em;color:var(--green);margin-bottom:28px}h1{font-size:28px;margin:0 0 12px}p{color:var(--muted);line-height:1.55}.phone{color:var(--text);font-weight:700;letter-spacing:.04em}
    label{display:block;font-size:14px;font-weight:650;margin:24px 0 8px}input{width:100%;height:54px;border:1px solid var(--line);border-radius:12px;background:#080b09;color:var(--text);font:700 24px/1 monospace;letter-spacing:.35em;text-align:center;padding:0 12px;outline:none}
    input:focus-visible{border-color:var(--green);box-shadow:0 0 0 3px #39e07922}.primary,.secondary{width:100%;height:48px;border-radius:12px;font-weight:750;cursor:pointer}
    .primary{margin-top:18px;border:0;background:var(--green);color:#041108}.secondary{margin-top:10px;border:1px solid var(--line);background:transparent;color:var(--text)}
    button:disabled{opacity:.5;cursor:not-allowed}.status{min-height:24px;margin:14px 0 0;font-size:14px}.status.error{color:var(--red)}.status.ok{color:var(--green)}
    .back{display:block;text-align:center;margin-top:18px;color:var(--muted);text-decoration:none}.back:hover,.back:focus-visible{color:var(--green)}
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">VEVIT</div>
    <?php if ($maskedPhone === null): ?>
      <h1 data-i18n="auth.verifyphone.expiredTitle">Ověření vypršelo</h1>
      <p data-i18n="auth.verifyphone.expiredDesc">Registraci je potřeba zahájit znovu.</p>
      <a class="back" href="/account/register.html?mode=phone" data-i18n="auth.verifyphone.back">Zpět na registraci</a>
      <script src="/account/assets/i18n.js?v=20260824b"></script>
      <script src="/account/assets/auth-i18n.js?v=20260824b"></script>
    <?php else: ?>
      <h1 data-i18n="auth.verifyphone.title">Ověřte telefonní číslo</h1>
      <p data-i18n="auth.verifyphone.desc">Poslali jsme vám šestimístný ověřovací kód.</p>
      <p class="phone"><?= htmlspecialchars($maskedPhone, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
      <form id="verifyForm" data-challenge="<?= htmlspecialchars($challenge, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" data-resend-delay="<?= (int) $secondsUntilResend ?>" novalidate>
        <label for="verificationCode" data-i18n="auth.verifyphone.code">Ověřovací kód</label>
        <input id="verificationCode" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="••••••" required>
        <button id="verifyButton" class="primary" type="submit" data-i18n="auth.verifyphone.submit">Ověřit a vytvořit účet</button>
      </form>
      <button id="resendButton" class="secondary" type="button" data-i18n="auth.verifyphone.resend">Poslat kód znovu</button>
      <p id="status" class="status" role="alert" aria-live="polite"></p>
      <a class="back" href="/account/register.html?mode=phone" data-i18n="auth.verifyphone.changePhone">Změnit telefonní číslo</a>
      <script src="/account/assets/i18n.js?v=20260824b"></script>
      <script src="/account/assets/auth-i18n.js?v=20260824b"></script>
      <script src="/account/assets/verify-phone.js?v=20260824b"></script>
    <?php endif; ?>
  </main>
</body>
</html>
