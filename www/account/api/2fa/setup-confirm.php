<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/totp-endpoint.php';
$cfg=auth_load_config();beginJson($cfg);
if(($_SERVER['REQUEST_METHOD']??'')!=='POST'){header('Allow: POST');jsonErr('Method not allowed',405);}
$user=requireAuth($cfg);totpRateLimit($cfg,'totp_confirm',8);$b=jsonBody();$id=totpChallengeId($b['challenge']??null);$code=(string)($b['code']??'');
$c=$id?loadTotpChallenge($cfg,$id,'totp_setup'):null;if(!$c||!hash_equals((string)$user['id'],(string)$c['user_id']))jsonErr('Nastavení vypršelo.',410);
$m=totpMethod($cfg,(string)$user['id']);try{$secret=decryptTotpSecret((string)($m['secret_ciphertext']??''),$cfg);}catch(Throwable){jsonErr('2FA není dostupné.',503);}
$step=verifyTotpWindow($secret,$code,time(),null);if($step===null){sb_rpc($cfg,'record_2fa_failure',['p_challenge_id'=>$id]);logActivity($cfg,(string)$user['id'],'twofa_failed','Neúspěšné nastavení 2FA');jsonErr('Ověřovací kód není platný.',422);}
$codes=generateRecoveryCodes();$hashes=hashRecoveryCodes($codes);
$ok=totpRpcScalar(sb_rpc($cfg,'confirm_totp_setup',['p_challenge_id'=>$id,'p_user_id'=>$user['id'],'p_step'=>$step,'p_hashes'=>$hashes]));if($ok!==true)jsonErr('Nastavení se nepodařilo dokončit.',409);
logActivity($cfg,(string)$user['id'],'twofa_enabled','2FA zapnuto');jsonOk(['recovery_codes'=>$codes]);
