<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
require_once __DIR__ . '/../lib/registration-validation.php';

$cfg  = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

$user = requireAuth($cfg);
$body = jsonBody();

$currentPass = (string)($body['current_password'] ?? '');
$newPass     = (string)($body['new_password']     ?? '');

if (($error = registerPasswordError($newPass)) !== null) jsonErr($error, 422, 'new_password');

$res = sb_find_one($cfg, 'users', ['id' => $user['id']], 'password');
if (isset($res['error']) || !is_array($res['data'] ?? null)) jsonErr('Chyba serveru.', 500);

$existingHash = $res['data']['password'] ?? null;
if (is_string($existingHash) && $existingHash !== '' && !password_verify($currentPass, $existingHash))
  jsonErr('Současné heslo je nesprávné.', 401, 'current_password');

if ((!is_string($existingHash) || $existingHash === '') && $currentPass !== '')
  jsonErr('Tento účet zatím nemá nastavené heslo.', 422, 'current_password');

$newHash = password_hash($newPass, PASSWORD_BCRYPT);
sb_update($cfg, 'users', ['id' => $user['id']], ['password' => $newHash]);

logActivity($cfg, $user['id'], 'password_change', 'Via settings');
jsonOk(['ok' => true]);
