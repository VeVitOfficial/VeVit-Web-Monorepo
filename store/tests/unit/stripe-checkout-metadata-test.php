<?php
declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

$source = (string) file_get_contents(__DIR__ . '/../../lib/payments/StripeCheckoutService.php');
test_assert_true(str_contains($source, "metadata[order_public_id]"), 'Stripe metadata contains only order correlation');
foreach (['guest_grant', 'download_token', 'session_id', 'storage_path', 'customer_email'] as $forbidden) {
    test_assert_true(!str_contains($source, "metadata[{$forbidden}]"), "Stripe metadata must not expose {$forbidden}");
}
test_assert_true(str_contains($source, '$this->appUrl'), 'redirect URLs use validated configured application URL');
test_assert_true(!str_contains($source, 'HTTP_HOST'), 'redirect URLs never trust Host header');

test_complete('stripe-checkout-metadata-test');
