<?php
declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

$root = dirname(__DIR__, 2);
test_assert_true(is_file($root . '/api/claims/message.php'), 'claim customer message endpoint exists');
test_assert_true(is_file($root . '/api/returns/message.php'), 'return customer message endpoint exists');
$views = ['orders.php','order.php','claims.php','claim.php','my-returns.php','return.php','favorites.php'];
foreach ($views as $view) {
    test_assert_true(is_file($root . '/' . $view), $view . ' exists');
    $source = (string) file_get_contents($root . '/' . $view);
    test_assert_true(!preg_match('/->(?:prepare|query|exec)\s*\(/i', $source), $view . ' contains no direct database access');
}

$apiFiles = glob($root . '/api/{claims,returns,delivery,attachments,favorites,admin}/*.php', GLOB_BRACE) ?: [];
foreach ($apiFiles as $file) {
    $source = (string) file_get_contents($file);
    test_assert_true(!preg_match('/\b(?:INSERT|UPDATE|DELETE)\b\s+/i', $source), basename($file) . ' contains no mutation SQL');
    test_assert_true(!str_contains($source, 'consumed_quantity'), basename($file) . ' never accepts consumed quantity');
}
$downloadController = (string) file_get_contents($root . '/case-attachment.php');
test_assert_true(!preg_match('/\b(?:readfile|filesize|fopen|unlink|rename)\s*\(/', $downloadController), 'attachment controller delegates filesystem access to storage');
$uploadController = (string) file_get_contents($root . '/api/attachments/upload.php');
test_assert_true(str_contains($uploadController, 'is_uploaded_file'), 'attachment HTTP controller accepts only PHP-managed uploads');

foreach (glob($root . '/lib/{claims,returns,delivery,attachments,favorites}/*.php', GLOB_BRACE) ?: [] as $file) {
    $source = (string) file_get_contents($file);
    test_assert_true(!str_contains($source, 'VeVitAccount'), basename($file) . ' does not call VeVit Account');
}

foreach (glob($root . '/lib/**/*.php') ?: [] as $file) {
    if (str_contains($file, '/attachments/LocalPrivateStorage.php')) continue;
    $source = (string) file_get_contents($file);
    test_assert_true(!preg_match('/\b(?:rename|unlink|readfile|move_uploaded_file)\s*\(/', $source), basename($file) . ' contains no direct filesystem mutation');
}

test_complete('customer-agenda-architecture-test');
