<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

test_assert_true(is_file(__DIR__ . '/../../lib/http.php'), 'HTTP library must exist');
require_once __DIR__ . '/../../lib/http.php';

test_assert_true(store_method_is_allowed('POST', ['POST']), 'allowed method must pass');
test_assert_true(!store_method_is_allowed('GET', ['POST']), 'disallowed method must fail');
test_assert_same('https://store.example.test', store_allowed_origin(
    'https://store.example.test',
    ['https://store.example.test']
), 'configured origin must be returned');
test_assert_same(null, store_allowed_origin(
    'https://attacker.example',
    ['https://store.example.test']
), 'unconfigured origin must not receive CORS access');

$payload = store_json_payload(422, 'invalid_input', 'Neplatný vstup.', ['field' => 'email']);
test_assert_same(422, $payload['status'], 'JSON payload must retain status');
test_assert_same('invalid_input', $payload['body']['error']['code'], 'JSON payload must retain public error code');
test_assert_same('email', $payload['body']['error']['details']['field'], 'JSON payload must retain safe details');

test_complete('http-test');
