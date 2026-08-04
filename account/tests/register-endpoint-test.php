<?php
declare(strict_types=1);

/**
 * Regression check for registration endpoint dependencies.
 *
 * Run from the repository root:
 *   php tests/register-endpoint-test.php
 */

$source = file_get_contents(__DIR__ . '/../api/register.php');
if (!is_string($source)) {
  fwrite(STDERR, "Unable to load api/register.php\n");
  exit(1);
}

$checks = [
  'registration passes configuration to clientIp' => '$ip = clientIp($cfg);',
  'registration uses the full password policy' => 'registerPasswordError($pass)',
  'registration uses the nickname policy' => 'registerNicknameIsValid($nickname)',
  'registration requires matching password confirmation' => 'hash_equals($pass, $passConfirm)',
];

foreach ($checks as $label => $needle) {
  if (!str_contains($source, $needle)) {
    fwrite(STDERR, "FAIL {$label}\n");
    exit(1);
  }
}

require_once __DIR__ . '/../lib/registration-validation.php';

$passwordCases = [
  'Valid12!' => null,
  'short1!' => 'Heslo musí mít alespoň 8 znaků.',
  'alllowercase1!' => 'Heslo nesplňuje bezpečnostní požadavky.',
  'ALLUPPERCASE1!' => 'Heslo nesplňuje bezpečnostní požadavky.',
  'NoNumbers!' => 'Heslo nesplňuje bezpečnostní požadavky.',
  'NoSpecial1' => 'Heslo nesplňuje bezpečnostní požadavky.',
  str_repeat('A', 70) . 'a1!' => 'Heslo je příliš dlouhé.',
];
foreach ($passwordCases as $password => $expected) {
  if (registerPasswordError($password) !== $expected) {
    fwrite(STDERR, "FAIL password policy result is incorrect\n");
    exit(1);
  }
}

foreach (['valid.name_1', 'ab', 'Jiří Novák', 'invalid<tag>'] as $nickname) {
  $expected = in_array($nickname, ['valid.name_1', 'ab', 'Jiří Novák'], true);
  if (registerNicknameIsValid($nickname) !== $expected) {
    fwrite(STDERR, "FAIL nickname policy result is incorrect\n");
    exit(1);
  }
}

fwrite(STDOUT, "PASS registration server validation contract\n");
