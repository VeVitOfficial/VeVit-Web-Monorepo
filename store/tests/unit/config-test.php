<?php

declare(strict_types=1);

require_once __DIR__ . '/../testlib.php';

test_assert_true(is_file(__DIR__ . '/../../lib/config.php'), 'configuration library must exist');
require_once __DIR__ . '/../../lib/config.php';

$storagePath = sys_get_temp_dir() . '/vevit-store-test-storage';
if (!is_dir($storagePath)) {
    mkdir($storagePath, 0700, true);
}
chmod($storagePath, 0700);

$config = store_load_config([
    'APP_ENV' => 'development',
    'APP_URL' => 'http://localhost:8000',
    'DB_DSN' => 'pgsql:host=127.0.0.1;port=5432;dbname=vevit_test',
    'DB_USER' => 'tester',
    'DB_PASS' => 'secret',
    'SESSION_COOKIE_SECURE' => '0',
    'APP_STORAGE_PATH' => $storagePath,
]);

test_assert_same('development', $config['app_env'], 'development environment must be retained');
test_assert_same(false, $config['session']['secure'], 'explicit local secure-cookie override must be retained');
test_assert_same('http://localhost:8000', $config['app_url'], 'validated app URL must be retained');
test_assert_same(10 * 1024 * 1024, $config['attachments']['max_bytes'], 'attachment default is 10 MiB');
test_assert_same(5, $config['attachments']['max_files'], 'attachment default is five files');
test_assert_true(in_array('application/pdf', $config['attachments']['allowed_mime'], true), 'PDF is an allowed attachment MIME');

try {
    store_load_config([
        'APP_ENV' => 'production',
        'APP_URL' => 'http://example.test',
        'DB_DSN' => 'pgsql:host=127.0.0.1;dbname=vevit',
        'DB_USER' => 'tester',
        'DB_PASS' => 'secret',
        'SESSION_COOKIE_SECURE' => '0',
        'APP_STORAGE_PATH' => $storagePath,
    ]);
    test_assert_true(false, 'production must reject insecure session cookies');
} catch (StoreConfigurationException) {
}

$unsafeStorage = sys_get_temp_dir() . '/vevit-store-test-storage-unsafe';
if (!is_dir($unsafeStorage)) mkdir($unsafeStorage, 0700, true);
chmod($unsafeStorage, 0755);
try {
    store_load_config([
        'APP_ENV' => 'development',
        'APP_URL' => 'http://localhost:8000',
        'DB_DSN' => 'pgsql:host=127.0.0.1;dbname=vevit_test',
        'DB_USER' => 'tester',
        'DB_PASS' => 'secret',
        'SESSION_COOKIE_SECURE' => '0',
        'APP_STORAGE_PATH' => $unsafeStorage,
    ]);
    test_assert_true(false, 'private attachment storage rejects group/world permissions');
} catch (StoreConfigurationException) {
}

try {
    store_load_config([
        'APP_ENV' => 'development',
        'APP_URL' => 'http://localhost:8000',
        'DB_DSN' => 'pgsql:host=127.0.0.1;dbname=vevit_test',
        'DB_USER' => 'tester',
        'DB_PASS' => 'secret',
        'SESSION_COOKIE_SECURE' => '0',
        'APP_STORAGE_PATH' => dirname(__DIR__, 2) . '/assets',
    ]);
    test_assert_true(false, 'digital storage inside the public application root must be rejected');
} catch (StoreConfigurationException) {
}

test_complete('config-test');
