<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/totp-endpoint.php';
$cfg=auth_load_config();beginJson($cfg);
if(($_SERVER['REQUEST_METHOD']??'')!=='POST'){header('Allow: POST');jsonErr('Method not allowed',405);}
totpRateLimit($cfg,'totp_recovery',8);$b=jsonBody();$id=totpChallengeId($b['challenge']??null);$c=$id?loadTotpChallenge($cfg,$id,'login_totp'):null;if(!$c)jsonErr('Ověření vypršelo.',410);
$code=strtoupper(trim((string)($b['code']??'')));$rows=_auth_filtered_get($cfg,'user_recovery_codes',[['user_id','eq',(string)$c['user_id']],['used_at','is','null']],'id,code_hash',20);$matched=null;
foreach(($rows['data']??[])as$row)if(is_array($row)&&password_verify($code,(string)($row['code_hash']??''))){$matched=$row['id'];break;}
if($matched===null){sb_rpc($cfg,'record_2fa_failure',['p_challenge_id'=>$id]);jsonErr('Obnovovací kód není platný.',422);}
$consumed=totpRpcScalar(sb_rpc($cfg,'consume_recovery_login',['p_challenge_id'=>$id,'p_code_id'=>$matched]));if(!is_array($consumed))jsonErr('Ověření již není platné.',409);
logActivity($cfg,(string)$c['user_id'],'recovery_used','Použit recovery kód');completeTotpSession($cfg,$consumed);
