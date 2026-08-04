<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

$user = requireAuth($cfg);
$uid  = $user['id'];
$body = jsonBody();
if (($body['confirmation'] ?? '') !== 'SMAZAT') jsonErr('Pro smazání napište SMAZAT.', 422, 'confirmation');
$password = _auth_find_one($cfg, 'users', ['id' => $uid], 'password');
if (isset($password['error'])) jsonErr('Účet se nepodařilo ověřit.', 500);
$hash = $password['data']['password'] ?? null;
if (is_string($hash) && $hash !== '') {
  $provided = (string) ($body['current_password'] ?? '');
  if (!password_verify($provided, $hash)) jsonErr('Současné heslo je nesprávné.', 401, 'current_password');
}

// Clear session cookie BEFORE deleting account
destroySession($cfg);

$res = sb_rpc($cfg, 'delete_user_account', ['target_id' => $uid]);

if (isset($res['error'])) {
  error_log('delete_user_account RPC failed for ' . $uid . ': ' . $res['error']);
  jsonErr('Smazání selhalo. Kontaktujte podporu.', 500);
}

jsonOk(null, 204);
