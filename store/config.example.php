<?php

// Copy this file as config_secret.php beside config.php. The included .htaccess
// blocks direct HTTP access; never commit the copied file or expose it in backups.
// Production requires HTTPS and SESSION_COOKIE_SECURE=true.

define('APP_ENV', 'development'); // development | staging | production | test
define('APP_URL', 'http://localhost:5500');
define('APP_STORAGE_PATH', '/absolute/path/outside/public_html/vevit-store');
define('CASE_ATTACHMENT_MAX_BYTES', 10 * 1024 * 1024);
define('CASE_ATTACHMENT_MAX_FILES', 5);
define('CASE_ATTACHMENT_ALLOWED_MIME', 'image/jpeg,image/png,image/webp,application/pdf');
define('RETURN_REQUEST_DAYS', 14); // Business setting; not a legal statement.
define('ADMIN_REAUTH_SECONDS', 300);
define('TRACKING_CARRIER_ORIGINS_JSON', '{"ppl":"https://www.ppl.cz","dpd":"https://tracking.dpd.de"}');

// Prefer DB_DSN. The legacy DB_HOST/DB_PORT/DB_NAME form remains supported.
define('DB_DSN', 'pgsql:host=127.0.0.1;port=5432;dbname=vevit_store');
define('DB_USER', 'replace-me');
define('DB_PASS', 'replace-me');

define('SESSION_NAME', 'vevit_store_session');
define('SESSION_COOKIE_SECURE', false);
define('SESSION_COOKIE_SAMESITE', 'Lax');
define('STORE_ALLOWED_ORIGINS', '');

// Required for the existing administration login. Generate with password_hash()
// and never commit the resulting production hash.
define('ADMIN_PASSWORD_HASH', '');

// Required only by the payment endpoints. They fail closed when missing.
define('STRIPE_SECRET_KEY', '');
define('STRIPE_WEBHOOK_SECRET', '');
define('STRIPE_ACCOUNT_ID', ''); // Optional acct_... guard for Stripe Connect/platform setups.

// VeVit Account — central identity provider at account.vevit.cz.
// Confirm both URLs with the VeVit Account team before deploying.
// [B1] Exact me endpoint URL (default shown, must be verified).
define('VEVIT_ACCOUNT_ME_URL',    'https://vevit.cz/account/api/me.php');
// [B2] Login redirect URL and return_url parameter name must be confirmed.
define('VEVIT_ACCOUNT_LOGIN_URL', 'https://vevit.cz/account/login');
