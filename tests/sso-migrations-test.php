<?php
declare(strict_types=1);

$root = dirname(__DIR__) . '/account/sql/sso';
$required = [
    '001_sessions_lockdown.up.sql' => [
        'drop policy if exists sessions_own',
        'revoke all on table public.sessions from anon, authenticated, public',
        'force row level security',
        "extensions.digest(session_token::text, 'sha256')",
        "status in ('active', 'blocked', 'deleted')",
        "alter function public.delete_user_account(text) set search_path = ''",
        'alter table public.store_product_views enable row level security',
    ],
    '002_api_tokens.up.sql' => [
        'user_id text not null references public.users(id)',
        'token_hash text not null unique',
        'force row level security',
    ],
    '003_drop_plaintext_token.up.sql' => [
        'NEPOUŠTĚT',
        'drop column if exists session_token',
    ],
    '004_session_cleanup.up.sql' => [
        "'vevit-session-cleanup'",
        "interval '30 days'",
    ],
];

foreach ($required as $file => $needles) {
    $path = $root . '/' . $file;
    $source = is_file($path) ? (string) file_get_contents($path) : '';
    foreach ($needles as $needle) {
        if (!str_contains($source, $needle)) {
            fwrite(STDERR, "FAIL: {$file} neobsahuje {$needle}\n");
            exit(1);
        }
    }
}

fwrite(STDOUT, "sso-migrations-test: PASS\n");
