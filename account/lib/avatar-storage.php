<?php
declare(strict_types=1);

const AVATAR_BUCKET = 'vevit-avatars';
const AVATAR_MAX_BYTES = 5242880;

function avatar_extension_for_mime(string $mime): ?string {
  return match ($mime) {
    'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', default => null,
  };
}

function avatar_storage_value(string $userId, string $random, string $extension): string {
  return 'storage:' . $userId . '/' . $random . '.' . $extension;
}

function avatar_storage_path(string $value, string $userId): ?string {
  $prefix = 'storage:' . $userId . '/';
  if (!str_starts_with($value, $prefix)) return null;
  $path = substr($value, strlen('storage:'));
  return preg_match('/\A' . preg_quote($userId, '/') . '\/[a-f0-9]{32}\.(jpg|png|webp)\z/D', $path) === 1 ? $path : null;
}

/** @return array{tmp_name:string,mime:string,extension:string} */
function avatar_validate_upload(array $file): array {
  if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) throw new RuntimeException('Soubor se nepodařilo nahrát.');
  $size = $file['size'] ?? 0; $tmp = $file['tmp_name'] ?? '';
  if (!is_int($size) || $size < 1 || $size > AVATAR_MAX_BYTES || !is_string($tmp) || !is_uploaded_file($tmp)) {
    throw new RuntimeException('Fotografie musí být obrázek JPG, PNG nebo WebP do 5 MB.');
  }
  $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
  $extension = is_string($mime) ? avatar_extension_for_mime($mime) : null;
  $dimensions = @getimagesize($tmp);
  if ($extension === null || !is_array($dimensions) || ($dimensions[0] ?? 0) > 6000 || ($dimensions[1] ?? 0) > 6000) {
    throw new RuntimeException('Fotografie musí být platný obrázek JPG, PNG nebo WebP.');
  }
  return ['tmp_name' => $tmp, 'mime' => $mime, 'extension' => $extension];
}

/** @return array{http:int,body:string,error:?string,content_type:?string} */
function avatar_storage_request(array $cfg, string $method, string $path, array $headers = [], ?string $body = null): array {
  $url = rtrim((string) $cfg['SUPABASE_URL'], '/') . '/storage/v1/' . ltrim($path, '/');
  $responseHeaders = []; $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_FOLLOWLOCATION => false, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => array_merge(['apikey: ' . $cfg['SUPABASE_SERVICE_ROLE'], 'Authorization: Bearer ' . $cfg['SUPABASE_SERVICE_ROLE']], $headers), CURLOPT_HEADERFUNCTION => static function ($curl, string $line) use (&$responseHeaders): int { $parts = explode(':', $line, 2); if (count($parts) === 2) $responseHeaders[strtolower(trim($parts[0]))] = trim($parts[1]); return strlen($line); }]);
  if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
  $raw = curl_exec($ch); $http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); $error = curl_error($ch) ?: null; curl_close($ch);
  return ['http' => $http, 'body' => is_string($raw) ? $raw : '', 'error' => $error, 'content_type' => $responseHeaders['content-type'] ?? null];
}

function avatar_object_url(string $action, string $path = ''): string {
  $base = 'object/' . rawurlencode(AVATAR_BUCKET);
  if ($action === 'download') $base = 'object/authenticated/' . rawurlencode(AVATAR_BUCKET);
  return $path === '' ? $base : $base . '/' . implode('/', array_map('rawurlencode', explode('/', $path)));
}

function avatar_upload_object(array $cfg, string $path, string $mime, string $tmp): bool {
  $contents = file_get_contents($tmp); if (!is_string($contents)) return false;
  $res = avatar_storage_request($cfg, 'POST', avatar_object_url('upload', $path), ['Content-Type: ' . $mime, 'x-upsert: false'], $contents);
  return $res['error'] === null && $res['http'] >= 200 && $res['http'] < 300;
}
function avatar_delete_object(array $cfg, string $path): bool {
  $res = avatar_storage_request($cfg, 'DELETE', avatar_object_url('upload'), ['Content-Type: application/json'], json_encode(['prefixes' => [$path]], JSON_THROW_ON_ERROR));
  return $res['error'] === null && $res['http'] >= 200 && $res['http'] < 300;
}
function avatar_download_object(array $cfg, string $path): array { return avatar_storage_request($cfg, 'GET', avatar_object_url('download', $path)); }
