<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
$cfg = auth_load_config(); beginJson($cfg); $user = requireAuth($cfg); $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$defaults = ['timezone' => 'Europe/Prague', 'date_format' => 'DD. MM. YYYY', 'week_starts_on' => 'monday', 'region' => 'CZ'];
if ($method === 'GET') {
  $res = sb_find_one($cfg, 'user_preferences', ['user_id' => $user['id']], 'timezone,date_format,week_starts_on,region');
  if (isset($res['error'])) jsonErr('Nastavení se nepodařilo načíst.', 500);
  jsonOk(['preferences' => array_merge($defaults, is_array($res['data'] ?? null) ? $res['data'] : [])]);
}
if ($method !== 'POST' && $method !== 'PATCH') { header('Allow: GET, POST, PATCH'); jsonErr('Method not allowed', 405); }
$body = jsonBody(); $timezone = (string) ($body['timezone'] ?? ''); $format = (string) ($body['date_format'] ?? ''); $week = (string) ($body['week_starts_on'] ?? '');
if (!in_array($timezone, DateTimeZone::listIdentifiers(), true) || !in_array($format, ['DD. MM. YYYY', 'YYYY-MM-DD'], true) || !in_array($week, ['monday', 'sunday'], true)) jsonErr('Neplatné regionální nastavení.', 422);
$row = ['user_id' => $user['id'], 'timezone' => $timezone, 'date_format' => $format, 'week_starts_on' => $week, 'region' => 'CZ', 'updated_at' => gmdate('Y-m-d\\TH:i:s\\Z')];
$existing = sb_find_one($cfg, 'user_preferences', ['user_id' => $user['id']], 'user_id');
$result = is_array($existing['data'] ?? null) ? sb_update($cfg, 'user_preferences', ['user_id' => $user['id']], $row) : sb_insert($cfg, 'user_preferences', $row);
if (isset($result['error'])) jsonErr('Nastavení se nepodařilo uložit.', 500);
jsonOk(['preferences' => $row]);
