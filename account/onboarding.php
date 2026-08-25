<?php
declare(strict_types=1);
require_once __DIR__ . '/lib/auth-helpers.php';
$cfg = auth_load_config();
$authResult = _auth_require_result($cfg);
if ($authResult['code'] === 503) {
  http_response_code(503);
  header('Content-Type: text/html; charset=utf-8');
  exit('Služba je dočasně nedostupná. Zkuste to prosím za chvíli.');
}
if ($authResult['code'] === 401) { header('Location: /account/login', true, 302); exit; }
$user = $authResult['user'];
$name = htmlspecialchars((string) ($user['full_name'] ?? ''), ENT_QUOTES, 'UTF-8');
?>
<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title data-i18n="auth.onboarding.docTitle">Dokončit profil — VEVIT</title><link rel="icon" href="/account/images/icon.ico" type="image/x-icon"><link rel="stylesheet" href="/account/assets/styles.css"><style>
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-sans)}.wrap{min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(100%,480px);padding:32px;border:1px solid var(--card-border);border-radius:20px;background:var(--card);box-shadow:0 24px 70px #0006}.field{display:grid;gap:8px;margin:18px 0}.input{width:100%;box-sizing:border-box}.error{color:#fda4af;font-size:13px;min-height:18px}.btn{width:100%;justify-content:center;margin-top:8px}</style></head><body><main class="wrap"><section class="card" aria-labelledby="title"><div class="auth-brand"><span class="brand-mark">v</span><span class="brand-name">vevit</span></div><h1 id="title" data-i18n="auth.onboarding.title">Dokončete svůj profil</h1><p class="auth-sub" data-i18n="auth.onboarding.sub">Ještě potřebujeme jméno a jedinečnou přezdívku.</p><form id="form"><label class="field"><span data-i18n="auth.onboarding.name">Jméno a příjmení</span><input class="input" id="name" required autocomplete="name" value="<?= $name ?>"></label><label class="field"><span data-i18n="auth.onboarding.nickname">Přezdívka</span><input class="input input--mono" id="nickname" required autocomplete="username" autocapitalize="none"></label><p class="error" id="error" role="alert" aria-live="polite"></p><button class="btn btn--primary" type="submit" data-i18n="auth.onboarding.submit">Pokračovat do účtu</button></form></section></main><script src="/account/assets/i18n.js?v=20260824b"></script><script src="/account/assets/auth-i18n.js?v=20260824b"></script><script src="/account/assets/onboarding.js?v=20260824b"></script></body></html>
