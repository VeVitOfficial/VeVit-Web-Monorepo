<?php
// Registration is handled at vevit.cz/account/register.html
// This endpoint redirects there or returns a message for API callers
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Location: /account/register.html');
    exit;
}

http_response_code(200);
echo json_encode([
    'success' => false,
    'message' => 'Registrace probíhá na vevit.cz/account/register.html',
    'redirect' => '/account/register.html'
]);
?>
