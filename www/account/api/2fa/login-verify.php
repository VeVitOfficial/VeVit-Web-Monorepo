<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/totp-endpoint.php';
$cfg=auth_load_config();beginJson($cfg);
if(($_SERVER['REQUEST_METHOD']??'')!=='POST'){header('Allow: POST');jsonErr('Method not allowed',405);}
totpRateLimit($cfg,'totp_login',10);$b=jsonBody();$id=totpChallengeId($b['challenge']??null);$c=$id?loadTotpChallenge($cfg,$id,'login_totp'):null;if(!$c)jsonErr('Ověření vypršelo.',410);
$m=totpMethod($cfg,(string)$c['user_id']);try{$secret=decryptTotpSecret((string)($m['secret_ciphertext']??''),$cfg);}catch(Throwable){jsonErr('2FA není dostupné.',503);}
$last=isset($m['last_verified_step'])?(int)$m['last_verified_step']:null;$step=verifyTotpWindow($secret,(string)($b['code']??''),time(),$last);
if($step===null){sb_rpc($cfg,'record_2fa_failure',['p_challenge_id'=>$id]);logActivity($cfg,(string)$c['user_id'],'twofa_failed','Neúspěšný TOTP pokus');jsonErr('Ověřovací kód není platný.',422);}
$consumed=totpRpcScalar(sb_rpc($cfg,'consume_totp_login',['p_challenge_id'=>$id,'p_step'=>$step]));if(!is_array($consumed))jsonErr('Ověření již není platné.',409);completeTotpSession($cfg,$consumed);
