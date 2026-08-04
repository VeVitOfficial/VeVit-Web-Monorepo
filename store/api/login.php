<?php
// Password-based login has been disabled.
//
// Authentication is now handled exclusively by account.vevit.cz.
// Users are redirected to https://account.vevit.cz/login from the UI.
//
// This endpoint is intentionally disabled to prevent password verification
// within this application. Do not re-enable it.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
http_response_code(410);
echo json_encode([
    'error' => [
        'code'    => 'login_disabled',
        'message' => 'Přihlášení přes tento endpoint je zakázáno. Přihlaste se přes VeVit Account.',
    ],
], JSON_UNESCAPED_UNICODE);
