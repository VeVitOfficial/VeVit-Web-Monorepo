<?php
declare(strict_types=1);

$path = dirname(__DIR__) . '/supabase/functions/stripe-webhook/index.ts';
if (!is_file($path)) {
    fwrite(STDERR, "FAIL: chybi verzovany zdroj stripe-webhook\n");
    exit(1);
}
$source = (string) file_get_contents($path);
$required = [
    'claim_stripe_webhook_event',
    'premium_price_catalog',
    'checkout.sessions.retrieve',
    'payment_status',
    'amount_total',
    'currency',
    'on_conflict=payment_id',
    "'apikey'",
    'STRIPE_WEBHOOK_API_KEY',
];
foreach ($required as $needle) {
    if (!str_contains($source, $needle)) {
        fwrite(STDERR, "FAIL: webhook kontrakt neobsahuje {$needle}\n");
        exit(1);
    }
}
if (str_contains($source, 'createClient(') || preg_match('/Authorization\s*:/', $source) === 1) {
    fwrite(STDERR, "FAIL: Supabase secret key nesmi byt odesilan jako Bearer\n");
    exit(1);
}
if (str_contains($source, 'Deno.env.get("STRIPE_SECRET_KEY")')) {
    fwrite(STDERR, "FAIL: webhook musi pouzivat samostatny read-only Stripe API key\n");
    exit(1);
}

fwrite(STDOUT, "stripe-webhook-contract-test: PASS\n");
