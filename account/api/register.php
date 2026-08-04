<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
require_once __DIR__ . '/../lib/registration-validation.php';

/**
 * Handle one registration request.
 */
function _register_run(array $cfg): never {
beginJson($cfg);
if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'POST') {
  header('Allow: POST');
  jsonErr('Method not allowed', 405);
}

$ip = clientIp($cfg);
if (!checkRateLimit($cfg, $ip, 'register', 5, 60)) {
  logAttempt($cfg, $ip, 'register');
  jsonErr('Příliš mnoho pokusů. Zkuste to za chvíli.', 429);
}
logAttempt($cfg, $ip, 'register');

$body     = jsonBody();
$email    = strtolower(trim((string)($body['email']     ?? '')));
$nickname = registerNormalizeNickname((string)($body['nickname']  ?? ''));
$fullName = trim((string)($body['full_name'] ?? ''));
$pass     = (string)($body['password'] ?? '');
$passConfirm = (string)($body['password_confirmation'] ?? '');

// Validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL))
  jsonErr('Neplatný formát e-mailu.', 422, 'email');
if ($nickname === null || !registerNicknameIsValid($nickname))
  jsonErr('Přezdívka musí mít 2–30 povolených znaků.', 422, 'nickname');
$nicknameNormalized = registerNicknameLookupKey($nickname);
if ($nicknameNormalized === null)
  jsonErr('Server nepodporuje bezpečné zpracování přezdívky.', 503, 'nickname');
if (strlen($fullName) < 2)
  jsonErr('Jméno je příliš krátké.', 422, 'full_name');
$passwordError = registerPasswordError($pass);
if ($passwordError !== null)
  jsonErr($passwordError, 422, 'password');
if (!hash_equals($pass, $passConfirm))
  jsonErr('Hesla se neshodují.', 422, 'password_confirmation');

$id   = bin2hex(random_bytes(16));
$hash = password_hash($pass, PASSWORD_BCRYPT);

$row = [
  'id'         => $id,
  'email'      => $email,
  'nickname'   => $nickname,
  'nickname_normalized' => $nicknameNormalized,
  'full_name'  => $fullName,
  'password'   => $hash,
  'tier'       => 'free',
  'role'       => 'User',
  'created_at' => date('Y-m-d\TH:i:s\Z'),
];
$res = sb_insert($cfg, 'users', $row);

if (isset($res['error'])) {
  if (($res['code'] ?? '') === '23505') {
    $detail = strtolower($res['error']);
    if (str_contains($detail, 'email'))    jsonErr('E-mail je již registrován.', 409, 'email');
    if (str_contains($detail, 'nickname')) jsonErr('Přezdívka je již obsazena.', 409, 'nickname');
    jsonErr('Účet s tímto e-mailem nebo přezdívkou již existuje.', 409);
  }
  jsonErr('Registrace selhala.', 500);
}

createSession($cfg, $id);
logActivity($cfg, $id, 'login', 'Registrace z IP: ' . $ip);

$cols = 'id,email,nickname,full_name,tier,role,avatar_url,level,xp,language';
$user = sb_find_one($cfg, 'users', ['id' => $id], $cols);
jsonOk(['user' => $user['data']], 201);
}

if (!defined('REGISTER_ENDPOINT_NO_MAIN')) {
  _register_run(auth_load_config());
}
