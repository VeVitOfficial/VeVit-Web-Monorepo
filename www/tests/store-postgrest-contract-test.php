<?php
declare(strict_types=1);

$clientPath = dirname(__DIR__) . '/store/lib/data-api.php';
if (!is_file($clientPath)) {
    fwrite(STDERR, "FAIL: chybi Store Data API klient\n");
    exit(1);
}

require_once $clientPath;

$captured = null;
$transport = static function (string $method, string $url, array $headers, ?string $body) use (&$captured): array {
    $captured = compact('method', 'url', 'headers', 'body');
    return ['status' => 200, 'headers' => [], 'body' => '[]'];
};

$client = new StoreDataApi('https://project.supabase.co', 'sb_secret_test_value', $transport);
$rows = $client->select('store_products', ['select' => 'id,name', 'is_active' => 'eq.true']);

if ($rows !== [] || $captured === null) {
    fwrite(STDERR, "FAIL: Data API klient nevratil dekodovanou odpoved\n");
    exit(1);
}
if (!in_array('apikey: sb_secret_test_value', $captured['headers'], true)) {
    fwrite(STDERR, "FAIL: chybi apikey hlavicka\n");
    exit(1);
}
foreach ($captured['headers'] as $header) {
    if (stripos($header, 'Authorization:') === 0) {
        fwrite(STDERR, "FAIL: secret klic nesmi byt v Authorization hlavicce\n");
        exit(1);
    }
}
if (!str_contains($captured['url'], '/rest/v1/store_products?')) {
    fwrite(STDERR, "FAIL: pozadavek nemiri na PostgREST tabulku\n");
    exit(1);
}

fwrite(STDOUT, "store-postgrest-contract-test: PASS\n");
