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

$cfg = auth_load_config(); $user = requireAuth($cfg);
$path = avatar_storage_path((string) ($user['avatar_url'] ?? ''), (string) $user['id']);
if ($path === null) { http_response_code(404); exit; }
$result = avatar_download_object($cfg, $path);
if ($result['error'] !== null || $result['http'] < 200 || $result['http'] >= 300) { http_response_code(404); exit; }
$type = $result['content_type'];
if (!is_string($type) || !in_array(strtolower(explode(';', $type, 2)[0]), ['image/jpeg', 'image/png', 'image/webp'], true)) { http_response_code(415); exit; }
header('Content-Type: ' . $type); header('Cache-Control: private, max-age=300'); header('X-Content-Type-Options: nosniff');
echo $result['body'];
