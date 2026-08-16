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

$cfg = auth_load_config(); beginJson($cfg);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); jsonErr('Method not allowed', 405); }
$user = requireAuth($cfg); $previous = avatar_storage_path((string) ($user['avatar_url'] ?? ''), (string) $user['id']);
$result = _auth_update($cfg, 'users', ['id' => $user['id']], ['avatar_url' => null]);
if (isset($result['error'])) jsonErr('Fotografii se nepodařilo odebrat.', 500);
if ($previous !== null) avatar_delete_object($cfg, $previous);
logActivity($cfg, (string) $user['id'], 'avatar_remove', 'Profilová fotografie byla odebrána');
jsonOk(['avatar_url' => null]);
