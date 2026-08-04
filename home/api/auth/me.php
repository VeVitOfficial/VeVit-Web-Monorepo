<?php

declare(strict_types=1);

define('VEVIT_AUTH_INCLUDED', true);
require_once __DIR__ . '/../../lib/vevit-auth.php';

vevitJsonHeaders();
vevitRequireMethod('GET');
$config = vevitAuthConfig();
$user = requireVevitAuth($config);
vevitJsonResponse([
    'authenticated' => true,
    'user' => $user,
    'csrf_token' => currentVevitCsrfToken($config),
], 200);
