<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/auth-helpers.php';
require_once __DIR__ . '/../lib/registration-validation.php';

/**
 * Return only whether a syntactically valid nickname can be registered.
 * User records, IDs and e-mail addresses are deliberately never exposed.
 */
function _nickname_availability_run(array $cfg): never {
  beginJson($cfg);

  if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'GET') {
    header('Allow: GET');
    jsonErr('Method not allowed', 405);
  }

  $nickname = registerNormalizeNickname((string) ($_GET['nickname'] ?? ''));
  $normalized = $nickname === null ? null : registerNicknameLookupKey($nickname);
  if ($nickname === null || $normalized === null || !registerNicknameIsValid($nickname)) {
    jsonOk(['available' => false]);
  }

  $lookup = _auth_find_one($cfg, 'users', ['nickname_normalized' => $normalized], 'id');
  if (array_key_exists('error', $lookup) || !array_key_exists('data', $lookup)) {
    jsonErr('Chyba serveru.', 500);
  }

  jsonOk(['available' => $lookup['data'] === null]);
}

if (!defined('NICKNAME_AVAILABILITY_ENDPOINT_NO_MAIN')) {
  _nickname_availability_run(auth_load_config());
}
