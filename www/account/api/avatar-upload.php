<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
$avatarStorage = __DIR__ . '/../lib/avatar-storage.php';
if (!is_file($avatarStorage)) {
  http_response_code(503);
  header('Content-Type: application/json');
  exit('{"error":"Služba profilových fotografií není dostupná."}');
}
require_once $avatarStorage;

$cfg = auth_load_config(); beginMultipart($cfg); $user = requireAuth($cfg);
try { $file = avatar_validate_upload($_FILES['avatar'] ?? []); }
catch (RuntimeException $error) { jsonErr($error->getMessage(), 422, 'avatar'); }
try { $random = bin2hex(random_bytes(16)); }
catch (Throwable) { jsonErr('Fotografii se nepodařilo bezpečně připravit.', 500); }
$path = (string) $user['id'] . '/' . $random . '.' . $file['extension'];
if (!avatar_upload_object($cfg, $path, $file['mime'], $file['tmp_name'])) jsonErr('Fotografii se nepodařilo uložit. Zkuste to prosím znovu.', 503);
$value = avatar_storage_value((string) $user['id'], $random, $file['extension']);
$result = _auth_update($cfg, 'users', ['id' => $user['id']], ['avatar_url' => $value]);
if (isset($result['error'])) { avatar_delete_object($cfg, $path); jsonErr('Fotografii se nepodařilo uložit. Zkuste to prosím znovu.', 500); }
$previous = avatar_storage_path((string) ($user['avatar_url'] ?? ''), (string) $user['id']);
if ($previous !== null) avatar_delete_object($cfg, $previous);
logActivity($cfg, (string) $user['id'], 'avatar_update', 'Profilová fotografie byla změněna');
jsonOk(['avatar_url' => $value]);
