<?php
// Copy outside the public document root and point VEVIT_ACCOUNT_CONFIG_PATH
// to it. Production default is /etc/vevit/account.php; local development may
// use ../vevit-private/account.php next to this repository.
// Never commit a config file containing real values.
return [
  'SUPABASE_URL' => 'https://your-project.supabase.co',
  'SUPABASE_SERVICE_ROLE' => 'replace-with-server-only-key',
  'ALLOWED_ORIGIN' => 'https://account.example.com',
  'COOKIE_DOMAIN' => 'account.example.com',
  'TRUSTED_PROXY_CIDRS' => [],
  'APP_URL' => 'https://account.example.com',
  'APP_BASE_URL' => 'https://account.example.com',
  'SMTP_HOST' => '',
  'SMTP_PORT' => 587,
  'SMTP_USER' => '',
  'SMTP_PASS' => '',
  'MAIL_FROM' => 'no-reply@example.com',
  'MAIL_FROM_NAME' => 'VEVIT',
  'GOOGLE_CLIENT_ID' => '',
  'GOOGLE_CLIENT_SECRET' => '',
  'GITHUB_CLIENT_ID' => '',
  'GITHUB_CLIENT_SECRET' => '',
  'DISCORD_CLIENT_ID' => '',
  'DISCORD_CLIENT_SECRET' => '',
  'TWILIO_ACCOUNT_SID' => '',
  'TWILIO_API_KEY' => '',
  'TWILIO_API_KEY_SECRET' => '',
  'TWILIO_VERIFY_SERVICE_SID' => '',
  // Exactly 32 random bytes encoded using base64. Server-only; never expose it.
  'TOTP_ENCRYPTION_KEY' => '',
];
