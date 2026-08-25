<?php
declare(strict_types=1);

/**
 * Regression check for the password-reset completion endpoint: the token
 * must be looked up only by its SHA-256 hash, be expiry-checked in the same
 * query, become unusable after one successful reset, and revoke every
 * existing session.
 *
 * Run from the repository root:
 *   php tests/reset-password-test.php
 */

$source = file_get_contents(__DIR__ . '/../api/reset-password.php');
if (!is_string($source)) {
  fwrite(STDERR, "Unable to load api/reset-password.php\n");
  exit(1);
}

$checks = [
  'reset-password passes configuration to clientIp is not needed here (no rate-limited identifier), but the token itself must be hashed before lookup'
    => "hash('sha256', \$rawToken)",
  'expiry is enforced in the same lookup query, not checked after the fact in PHP'
    => "'reset_token_expires_at=gt.'",
  'the lookup is scoped to the token hash column, never the raw token'
    => "'reset_token_hash=eq.'",
  'a successful reset clears the hash, making the token single-use'
    => "'reset_token_hash'       => null,",
  'a successful reset clears the expiry alongside the hash'
    => "'reset_token_expires_at' => null,",
  'a successful reset revokes every existing session for the account'
    => "sb_delete(\$cfg, 'sessions', ['user_id' => \$userId]);",
  'the new password is stored as a bcrypt hash, never in plain text'
    => 'password_hash($newPass, PASSWORD_BCRYPT)',
];

$failures = [];
foreach ($checks as $label => $needle) {
  if (!str_contains($source, $needle)) {
    $failures[] = $label;
  }
}

// The session revoke and the password/token update must both run, and the
// revoke must happen no earlier than the update (never invalidate sessions
// before the new credential is actually persisted).
$updatePos = strpos($source, "sb_update(\$cfg, 'users'");
$revokePos = strpos($source, "sb_delete(\$cfg, 'sessions'");
if ($updatePos === false || $revokePos === false || $revokePos < $updatePos) {
  $failures[] = 'session revoke must run after the password/token update, not before';
}

if ($failures !== []) {
  fwrite(STDERR, "FAIL " . implode("\nFAIL ", $failures) . "\n");
  exit(1);
}

fwrite(STDOUT, "PASS reset-password token is hashed, expiry-checked, single-use, and revokes sessions\n");
