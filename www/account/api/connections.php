<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
require_once __DIR__ . '/../lib/oauth.php';
$cfg = auth_load_config(); beginJson($cfg); $user = requireAuth($cfg);
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') { header('Allow: GET'); jsonErr('Method not allowed', 405); }
$res = sb_get($cfg, 'oauth_identities', ['user_id' => $user['id']], 'provider,provider_email,created_at,updated_at', 10);
if (isset($res['error'])) jsonErr('Propojené účty se nepodařilo načíst.', 500);
$byProvider = [];
foreach (($res['data'] ?? []) as $row) if (is_array($row) && oauth_provider_allowed((string) ($row['provider'] ?? ''))) $byProvider[$row['provider']] = $row;
$password = _auth_find_one($cfg, 'users', ['id' => $user['id']], 'password');
if (isset($password['error'])) jsonErr('Stav přihlášení se nepodařilo načíst.', 500);
jsonOk(['connections' => $byProvider, 'has_password' => is_string($password['data']['password'] ?? null) && $password['data']['password'] !== '']);
