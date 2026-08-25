<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/totp-endpoint.php';
$cfg=auth_load_config(); beginJson($cfg);
if (($_SERVER['REQUEST_METHOD']??'GET')!=='GET'){header('Allow: GET');jsonErr('Method not allowed',405);}
$user=requireAuth($cfg); $method=totpMethod($cfg,(string)$user['id']);
$codes=_auth_filtered_get($cfg,'user_recovery_codes',[['user_id','eq',(string)$user['id']],['used_at','is','null']],'id',20);
jsonOk(['enabled'=>is_array($method)&&is_string($method['enabled_at']??null),'enabled_at'=>$method['enabled_at']??null,'recovery_codes_remaining'=>is_array($codes['data']??null)?count($codes['data']):0]);
