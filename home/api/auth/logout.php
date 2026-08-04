<?php

declare(strict_types=1);

define('VEVIT_AUTH_INCLUDED', true);
require_once __DIR__ . '/../../lib/vevit-auth.php';

vevitJsonHeaders();
vevitRequireMethod('POST');
$config = vevitAuthConfig();
requireVevitAuth($config);
requireVevitCsrf($config);
logoutVevitSession($config);
vevitJsonResponse(['authenticated' => false], 200);
