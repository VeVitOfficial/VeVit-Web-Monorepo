<?php
declare(strict_types=1);

// Copy to /etc/vevit/home.php or ../vevit-private/home.php outside webroot.
// VEVIT_HOME_CONFIG_PATH can point to another absolute server-only path.
return [
    'supabase_url' => 'https://your-project.supabase.co',
    'service_role' => 'replace-with-server-only-key',
    'csrf_secret' => 'replace-with-random-secret',
    'gemini_api_key' => '',
    'openrouter_api_key' => '',
    'cookie_domain' => '',
    'allowed_origins' => ['https://vevit.cz'],
];
