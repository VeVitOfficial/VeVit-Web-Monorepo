<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
$cfg  = auth_load_config();
beginJson($cfg);
$user = requireAuth($cfg);
jsonOk(['user' => $user]);
