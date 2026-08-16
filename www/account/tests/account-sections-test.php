<?php
declare(strict_types=1);

$checks = [
  'security panel uses a real state host' => ['index.html', 'id="securityState"'],
  'billing panel uses a real state host' => ['index.html', 'id="billingState"'],
  'connections panel uses a real state host' => ['index.html', 'id="connectionsState"'],
  'notifications panel uses a real state host' => ['index.html', 'id="notificationsState"'],
  'preferences panel uses a real state host' => ['index.html', 'id="preferencesState"'],
  'privacy panel uses a real state host' => ['index.html', 'id="privacyState"'],
  'connections endpoint exists' => ['api/connections.php', 'requireAuth'],
  'connection disconnect endpoint exists' => ['api/connections-disconnect.php', 'requireAuth'],
  'preferences endpoint exists' => ['api/preferences.php', 'requireAuth'],
  'account extensions migration exists' => ['sql/migrations/007_account_settings.sql', 'user_preferences'],
];

$failed = 0;
foreach ($checks as $label => [$file, $needle]) {
  $source = file_get_contents(__DIR__ . '/../' . $file);
  if (!is_string($source) || !str_contains($source, $needle)) {
    fwrite(STDERR, "FAIL {$label}\n"); $failed++; continue;
  }
  fwrite(STDOUT, "PASS {$label}\n");
}

foreach (['api/export-data.php', 'api/delete-account.php', 'api/change-password.php'] as $file) {
  $source = (string) file_get_contents(__DIR__ . '/../' . $file);
  if (!str_contains($source, "'POST'")) { fwrite(STDERR, "FAIL {$file} must require POST\n"); $failed++; }
  else fwrite(STDOUT, "PASS {$file} requires POST\n");
}

if ($failed) exit(1);
