<?php
declare(strict_types=1);
require_once __DIR__ . '/middleware.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Method not allowed');
}
validateCsrf();
destroyAdminSession();
header('Location: auth.php');
exit;
