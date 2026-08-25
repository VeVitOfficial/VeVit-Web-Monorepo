<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
require_once __DIR__ . '/../lib/oauth.php';
$cfg = auth_load_config(); beginJson($cfg);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); jsonErr('Method not allowed', 405); }
$user = requireAuth($cfg); $body = jsonBody(); $provider = strtolower((string) ($body['provider'] ?? ''));
if (!oauth_provider_allowed($provider)) jsonErr('Neplatný poskytovatel.', 422);
$connections = sb_get($cfg, 'oauth_identities', ['user_id' => $user['id']], 'provider', 10);
if (isset($connections['error'])) jsonErr('Propojené účty se nepodařilo načíst.', 500);
$hasPassword = is_string($user['password'] ?? null) && $user['password'] !== '';
if (!$hasPassword && count($connections['data'] ?? []) <= 1) jsonErr('Nelze odpojit poslední způsob přihlášení.', 422);
$deleted = sb_delete($cfg, 'oauth_identities', ['user_id' => $user['id'], 'provider' => $provider]);
if (!$deleted) jsonErr('Účet se nepodařilo odpojit.', 500);
logActivity($cfg, $user['id'], 'oauth_disconnect', 'OAuth ' . $provider);
jsonOk(null, 204);
