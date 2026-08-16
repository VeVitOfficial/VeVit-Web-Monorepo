<?php
declare(strict_types=1);
require_once __DIR__.'/../testlib.php'; require_once __DIR__.'/../../lib/payments/WebhookService.php';
$payload='{"id":"evt_test","type":"checkout.session.completed"}'; $secret='whsec_test'; $timestamp=1700000000; $signature=hash_hmac('sha256',$timestamp.'.'.$payload,$secret);
test_assert_true(StripeWebhookVerifier::verify($payload,"t=$timestamp,v1=$signature",$secret,$timestamp),'valid Stripe signature must pass');
test_assert_true(!StripeWebhookVerifier::verify($payload,"t=$timestamp,v1=bad",$secret,$timestamp),'invalid signature must fail');
test_assert_true(!StripeWebhookVerifier::verify($payload,"t=".($timestamp-301).",v1=$signature",$secret,$timestamp),'stale signature must fail');
test_complete('stripe-webhook-verifier-test');
