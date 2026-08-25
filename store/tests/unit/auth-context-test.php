<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';
require_once __DIR__ . '/../../lib/auth/AuthContext.php';
require_once __DIR__ . '/../../lib/auth/AnonymousAuthContext.php';
require_once __DIR__ . '/../../lib/auth/VeVitAccountAuthContext.php';
require_once __DIR__ . '/../../lib/auth/AuthContextFactory.php';

$anonymous = new AnonymousAuthContext('missing_provider_contract');
test_assert_same(false, $anonymous->isAuthenticated(), 'anonymous context is not authenticated');
test_assert_same(null, $anonymous->userId(), 'anonymous context has no user id');
test_assert_same(null, $anonymous->verifiedEmail(), 'anonymous context has no verified email');
test_assert_same(false, $anonymous->hasRole('admin'), 'anonymous context has no role');

$factory = new AuthContextFactory([]);
$fromClient = $factory->fromRequest(['user_id' => 'attacker', 'email' => 'attacker@example.test']);
test_assert_same(false, $fromClient->isAuthenticated(), 'client user id is ignored');

$unavailable = new VeVitAccountAuthContext([], static fn (): array => ['id' => 'untrusted']);
test_assert_same(false, $unavailable->isAuthenticated(), 'unconfigured provider is fail-closed');
test_assert_same(null, $unavailable->userId(), 'unconfigured provider exposes no user id');

$providerCalls = 0;
$timeout = new VeVitAccountAuthContext(['endpoint' => 'https://account.example.test'], static function () use (&$providerCalls): array {
    $providerCalls++;
    throw new RuntimeException('simulated timeout');
});
test_assert_same(false, $timeout->isAuthenticated(), 'provider timeout remains fail-closed');
$invalid = new VeVitAccountAuthContext(['endpoint' => 'https://account.example.test'], static function () use (&$providerCalls): array {
    $providerCalls++;
    return ['id' => 'client-shaped-unverified-value'];
});
test_assert_same(false, $invalid->isAuthenticated(), 'unverified provider response remains fail-closed');
test_assert_same(0, $providerCalls, 'skeleton adapter never calls an unapproved VeVit Account contract');

test_complete('auth-context-test');
