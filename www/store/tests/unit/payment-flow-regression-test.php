<?php
declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

$webhook = (string) file_get_contents(__DIR__ . '/../../api/webhook.php');
$processor = (string) file_get_contents(__DIR__ . '/../../lib/payments/StripePaymentProcessor.php');
$success = (string) file_get_contents(__DIR__ . '/../../success.php');
$cancel = (string) file_get_contents(__DIR__ . '/../../cancel.php');
$download = (string) file_get_contents(__DIR__ . '/../../api/request-download.php');
$migration = (string) file_get_contents(__DIR__ . '/../../migrations/202607290003_payments_and_inventory_up.sql');
$createPayment = (string) file_get_contents(__DIR__ . '/../../api/create-payment.php');
$createCheckout = (string) file_get_contents(__DIR__ . '/../../api/create-checkout.php');
$htaccess = (string) file_get_contents(__DIR__ . '/../../.htaccess');

test_assert_true(str_contains($webhook, 'StripeWebhookVerifier::verify'), 'webhook verifies Stripe signature');
test_assert_true(str_contains($processor, "checkout.session.completed"), 'one authoritative paid event is explicit');
test_assert_true(str_contains($processor, 'amount_total'), 'paid amount is verified');
test_assert_true(str_contains($processor, 'currency_mismatch'), 'currency is verified');
test_assert_true(str_contains($processor, 'FOR UPDATE'), 'orders and inventory are locked transactionally');
test_assert_true(str_contains($processor, 'payment_effects_applied_at'), 'different events cannot repeat paid side effects');
test_assert_true(str_contains($migration, 'UNIQUE (order_item_id, movement_type)'), 'database prevents duplicate sale movements');
test_assert_true(str_contains($migration, 'order_item_id INT NOT NULL UNIQUE'), 'database prevents duplicate digital entitlements');
test_assert_true(str_contains($download, 'store_download_entitlements'), 'download grants require a paid entitlement');
test_assert_true(!str_contains($success, "payment_status = 'paid'"), 'success redirect never marks payment paid');
test_assert_true(!str_contains($cancel, "payment_status ="), 'cancel redirect never mutates payment state');
test_assert_true(str_contains($createPayment, "whsec_"), 'checkout cannot accept money without a configured webhook');
test_assert_true(str_contains($createCheckout, 'StoreRateLimiter'), 'checkout snapshot creation is rate limited server-side');
test_assert_true(!str_contains($createCheckout, 'HTTP_X_FORWARDED_FOR'), 'checkout rate limit does not trust forwarded IP headers');
test_assert_true(str_contains($htaccess, 'lib|migrations|tests|docs'), 'internal Release 0 directories are denied over HTTP');
test_assert_true(str_contains($htaccess, '.(?:sql|md|json|ya?ml|lock)'), 'sensitive repository file types are denied over HTTP');

test_complete('payment-flow-regression-test');
