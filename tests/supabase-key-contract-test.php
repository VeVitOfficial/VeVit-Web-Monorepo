<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];
$serverConsumers = [
    'account/lib/supabase-rest.php',
    'account/lib/auth-helpers.php',
    'account/lib/avatar-storage.php',
    'account/api/reset-password.php',
    'account/api/sessions-revoke.php',
    'home/lib/vevit-auth.php',
];

foreach ($serverConsumers as $relative) {
    $source = file_get_contents($root . '/' . $relative);
    if (!is_string($source)) {
        $failures[] = "Nelze načíst {$relative}.";
        continue;
    }
    if (preg_match('/Authorization:\s*Bearer[^\n]*(SUPABASE_SECRET_KEY|secret_key)/i', $source) === 1) {
        $failures[] = "{$relative} posílá moderní secret key bez typové kontroly jako Bearer token.";
    }
}

$accountRest = file_get_contents($root . '/account/lib/supabase-rest.php') ?: '';
$homeAuth = file_get_contents($root . '/home/lib/vevit-auth.php') ?: '';
$accountExample = file_get_contents($root . '/account/config.example.php') ?: '';
$homeExample = file_get_contents($root . '/home/api/config.example.php') ?: '';
if (!str_contains($accountRest, "'apikey: ' . _sb_secret_key(\$cfg)")) {
    $failures[] = 'Account neposílá komponentní secret key v apikey hlavičce.';
}
require_once $root . '/account/lib/supabase-rest.php';
$modernHeaders = _sb_base_headers(['SUPABASE_SECRET_KEY' => 'sb_secret_component_test_value']);
$legacyHeaders = _sb_base_headers(['SUPABASE_SERVICE_ROLE' => 'legacy-jwt-test-value']);
if (array_filter($modernHeaders, static fn(string $header): bool => str_starts_with($header, 'Authorization:')) !== []) {
    $failures[] = 'Moderní sb_secret_ klíč se posílá v Authorization hlavičce.';
}
if (array_filter($legacyHeaders, static fn(string $header): bool => str_starts_with($header, 'Authorization: Bearer ')) === []) {
    $failures[] = 'Dočasná legacy větev nezachovává Bearer hlavičku během bezvýpadkové migrace.';
}
if (!str_contains($homeAuth, "'apikey: ' . \$key")) {
    $failures[] = 'Home neposílá komponentní secret key v apikey hlavičce.';
}
if (!str_contains($accountExample, 'SUPABASE_SECRET_KEY')) {
    $failures[] = 'Account example postrádá SUPABASE_SECRET_KEY.';
}
if (!str_contains($homeExample, "'secret_key'")) {
    $failures[] = 'Home example postrádá secret_key.';
}

$frontendExtensions = ['js', 'html', 'css'];
foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)) as $file) {
    if (!$file->isFile() || !in_array(strtolower($file->getExtension()), $frontendExtensions, true)) continue;
    $relative = substr($file->getPathname(), strlen($root) + 1);
    if (str_starts_with($relative, '.git/') || str_contains($relative, '/vendor/') || str_contains($relative, '/node_modules/')) continue;
    $source = file_get_contents($file->getPathname());
    if (!is_string($source)) continue;
    if (preg_match('/(?:supabase\.co|createClient\s*\(|sb_publishable_|sb_secret_|SUPABASE_(?:ANON|SERVICE_ROLE|SECRET))/i', $source) === 1) {
        $failures[] = "Frontend obsahuje přímý Supabase kontrakt: {$relative}.";
    }
}

if ($failures !== []) {
    fwrite(STDERR, "supabase-key-contract-test: FAIL\n- " . implode("\n- ", $failures) . "\n");
    exit(1);
}
fwrite(STDOUT, "supabase-key-contract-test: PASS\n");
