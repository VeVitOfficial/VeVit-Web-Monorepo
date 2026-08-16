<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/totp-endpoint.php';
$cfg=auth_load_config();beginJson($cfg);if(($_SERVER['REQUEST_METHOD']??'')!=='POST'){header('Allow: POST');jsonErr('Method not allowed',405);}
$u=requireAuth($cfg);totpRateLimit($cfg,'totp_regenerate',5);$b=jsonBody();requireTotpReauthentication($cfg,(string)$u['id'],$b);
$m=totpMethod($cfg,(string)$u['id']);if(!$m||!$m['enabled_at'])jsonErr('2FA není aktivní.',409);try{$s=decryptTotpSecret((string)$m['secret_ciphertext'],$cfg);}catch(Throwable){jsonErr('2FA není dostupné.',503);}
$step=verifyTotpWindow($s,(string)($b['code']??''),time(),isset($m['last_verified_step'])?(int)$m['last_verified_step']:null);if($step===null)jsonErr('Ověřovací kód není platný.',422);
_auth_update($cfg,'user_totp_methods',['user_id'=>$u['id']],['last_verified_step'=>$step,'updated_at'=>gmdate('c')]);$codes=generateRecoveryCodes();$n=totpRpcScalar(sb_rpc($cfg,'replace_recovery_codes',['p_user_id'=>$u['id'],'p_hashes'=>hashRecoveryCodes($codes)]));if((int)$n!==10)jsonErr('Kódy se nepodařilo obnovit.',500);
logActivity($cfg,(string)$u['id'],'recovery_regenerated','Recovery kódy obnoveny');jsonOk(['recovery_codes'=>$codes]);
