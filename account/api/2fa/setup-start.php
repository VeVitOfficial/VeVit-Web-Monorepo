<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/totp-endpoint.php';
$cfg=auth_load_config(); beginJson($cfg);
if (($_SERVER['REQUEST_METHOD']??'')!=='POST'){header('Allow: POST');jsonErr('Method not allowed',405);}
$user=requireAuth($cfg); totpRateLimit($cfg,'totp_setup',5); $body=jsonBody();
requireTotpReauthentication($cfg,(string)$user['id'],$body);
if(totpIsActive($cfg,(string)$user['id']))jsonErr('Dvoufázové ověření je již aktivní.',409);
try{$secret=generateTotpSecret();$cipher=encryptTotpSecret($secret,$cfg);}catch(Throwable){jsonErr('2FA není na serveru správně nakonfigurováno.',503);}
$existing=totpMethod($cfg,(string)$user['id']); $row=['secret_ciphertext'=>$cipher,'enabled_at'=>null,'last_verified_step'=>null,'updated_at'=>gmdate('c')];
$saved=$existing?_auth_update($cfg,'user_totp_methods',['user_id'=>$user['id']],$row):_auth_insert($cfg,'user_totp_methods',array_merge(['user_id'=>$user['id']],$row));
if(isset($saved['error']))jsonErr('Nastavení 2FA se nepodařilo uložit.',500);
$id=bin2hex(random_bytes(24));$challenge=_auth_insert($cfg,'auth_challenges',['id'=>$id,'user_id'=>$user['id'],'kind'=>'totp_setup','payload'=>[],'expires_at'=>gmdate('c',time()+600)]);
if(isset($challenge['error']))jsonErr('Nastavení 2FA se nepodařilo zahájit.',500);
$label=(string)($user['email']??$user['nickname']??'uzivatel');$uri=totpProvisioningUri($secret,$label);
logActivity($cfg,(string)$user['id'],'twofa_setup','2FA setup zahájen');
jsonOk(['challenge'=>$id,'secret'=>$secret,'otpauth_uri'=>$uri,'qr_code'=>totpQrDataUri($uri),'issuer'=>'VEVIT']);
