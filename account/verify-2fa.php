<?php
declare(strict_types=1);
require_once __DIR__ . '/lib/auth-helpers.php';
require_once __DIR__ . '/lib/totp-endpoint.php';
header('Cache-Control: no-store, private, max-age=0');
$challenge=strtolower(trim((string)($_GET['challenge']??'')));
$valid=false;
if(totpChallengeId($challenge)!==null){$cfg=auth_load_config();$valid=loadTotpChallenge($cfg,$challenge,'login_totp')!==null;}
?>
<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title data-i18n="auth.verify2fa.docTitle">Dvoufázové ověření · VEVIT</title><link rel="icon" href="/account/images/icon.ico" type="image/x-icon">
<style>:root{--bg:#070908;--card:#101311;--line:#273029;--text:#f4f7f4;--muted:#a2aba4;--green:#39e079;--red:#ff6b6b}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;padding:24px}.card{width:min(100%,440px);padding:32px;border:1px solid var(--line);border-radius:20px;background:var(--card)}h1{margin:0 0 10px}p{color:var(--muted)}label{display:block;margin:22px 0 8px}input{width:100%;height:52px;border:1px solid var(--line);border-radius:12px;background:#080b09;color:var(--text);padding:0 14px;font-size:20px;letter-spacing:.2em;text-align:center}.btn{width:100%;height:48px;border-radius:12px;margin-top:14px;font-weight:700;cursor:pointer}.primary{border:0;background:var(--green);color:#041108}.ghost{border:1px solid var(--line);background:transparent;color:var(--text)}.status{min-height:22px;color:var(--red)}a{display:block;text-align:center;color:var(--muted);margin-top:18px}</style></head><body><main class="card">
<?php if(!$valid):?><h1 data-i18n="auth.verify2fa.expiredTitle">Ověření vypršelo</h1><p data-i18n="auth.verify2fa.expiredDesc">Vraťte se na přihlášení a zkuste to znovu.</p><a href="/account/login" data-i18n="auth.common.backToLogin">Zpět na přihlášení</a>
<script src="/account/assets/i18n.js?v=20260824b"></script><script src="/account/assets/auth-i18n.js?v=20260824b"></script>
<?php else:?><h1 data-i18n="auth.verify2fa.title">Dvoufázové ověření</h1><p id="description" data-i18n="auth.verify2fa.desc">Zadejte šestimístný kód z ověřovací aplikace.</p><form id="form" data-challenge="<?= htmlspecialchars($challenge, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"><label for="code" data-i18n="auth.verify2fa.code">Ověřovací kód</label><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="14" required><button class="btn primary" id="submit" type="submit" data-i18n="auth.verify2fa.submit">Ověřit a přihlásit</button></form><button class="btn ghost" id="switch" type="button" data-i18n="auth.verify2fa.switchRecovery">Použít obnovovací kód</button><p class="status" id="status" role="alert" aria-live="polite"></p><a href="/account/login" data-i18n="auth.common.backToLogin">Zpět na přihlášení</a>
<script src="/account/assets/i18n.js?v=20260824b"></script><script src="/account/assets/auth-i18n.js?v=20260824b"></script><script src="/account/assets/verify-2fa.js?v=20260824b"></script>
<?php endif;?></main></body></html>
