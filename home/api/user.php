<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
http_response_code(410);
echo json_encode([
    'error' => 'Profil uživatele poskytuje VeVit Account.',
    'me_url' => '/account/api/me.php',
]);
