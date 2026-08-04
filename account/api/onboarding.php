<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
require_once __DIR__ . '/../lib/registration-validation.php';

$cfg = auth_load_config();
beginJson($cfg);
if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'POST') {
  header('Allow: POST'); jsonErr('Method not allowed', 405);
}
$user = requireAuth($cfg);
$body = jsonBody();
$fullName = trim((string) ($body['full_name'] ?? ''));
$nickname = trim((string) ($body['nickname'] ?? ''));
if (strlen($fullName) < 2) jsonErr('Zadejte celé jméno alespoň o 2 znacích.', 422, 'full_name');
if (!registerNicknameIsValid($nickname)) jsonErr('Přezdívka musí mít 3–30 znaků a jen písmena, čísla, _ nebo tečku.', 422, 'nickname');
$taken = _auth_find_one($cfg, 'users', ['nickname' => $nickname], 'id');
if (isset($taken['error'])) jsonErr('Dostupnost přezdívky se nepodařilo ověřit.', 503);
if (is_array($taken['data'] ?? null) && ($taken['data']['id'] ?? null) !== $user['id']) jsonErr('Tato přezdívka je již obsazená.', 409, 'nickname');
$updated = _auth_update($cfg, 'users', ['id' => $user['id']], ['full_name' => $fullName, 'nickname' => $nickname]);
if (isset($updated['error'])) jsonErr('Profil se nepodařilo uložit.', 500);
logActivity($cfg, $user['id'], 'profile_update', 'Dokončení OAuth profilu');
jsonOk(null, 204);
