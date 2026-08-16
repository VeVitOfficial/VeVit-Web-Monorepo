<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/totp-endpoint.php';
$cfg=auth_load_config();beginJson($cfg);if(($_SERVER['REQUEST_METHOD']??'')!=='POST'){header('Allow: POST');jsonErr('Method not allowed',405);}
$u=requireAuth($cfg);totpRateLimit($cfg,'totp_disable',5);$b=jsonBody();requireTotpReauthentication($cfg,(string)$u['id'],$b);
$m=totpMethod($cfg,(string)$u['id']);if(!$m||!$m['enabled_at'])jsonErr('2FA není aktivní.',409);try{$s=decryptTotpSecret((string)$m['secret_ciphertext'],$cfg);}catch(Throwable){jsonErr('2FA není dostupné.',503);}
$candidate=(string)($b['code']??'');$valid=verifyTotpWindow($s,$candidate,time(),isset($m['last_verified_step'])?(int)$m['last_verified_step']:null)!==null;
if(!$valid)$valid=findUnusedRecoveryCode($cfg,(string)$u['id'],$candidate)!==null;
if(!$valid)jsonErr('Ověřovací kód není platný.',422);$ok=totpRpcScalar(sb_rpc($cfg,'disable_totp_2fa',['p_user_id'=>$u['id'],'p_current_token'=>(string)($_COOKIE[COOKIE_NAME]??'')]));if($ok!==true)jsonErr('2FA se nepodařilo vypnout.',500);
logActivity($cfg,(string)$u['id'],'twofa_disabled','2FA vypnuto');jsonOk(['ok'=>true]);
