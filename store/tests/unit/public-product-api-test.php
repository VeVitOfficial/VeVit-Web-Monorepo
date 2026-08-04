<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

foreach (['products.php', 'recent.php'] as $endpoint) {
    $source = (string) file_get_contents(__DIR__ . '/../../api/' . $endpoint);
    test_assert_true(!preg_match('/SELECT\s+p\.\*/i', $source), "{$endpoint} must use an explicit public product allowlist");
    test_assert_true(!preg_match('/\bp\.download_file\b/i', $source), "{$endpoint} must not expose digital storage paths");
    test_assert_true(!preg_match('/\bp\.stripe_price_id\b/i', $source), "{$endpoint} must not expose internal Stripe identifiers");
}

test_complete('public-product-api-test');
