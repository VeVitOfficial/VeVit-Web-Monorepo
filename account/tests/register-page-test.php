<?php
declare(strict_types=1);

/**
 * Contract check for the accessible premium registration interface.
 *
 * Run from the repository root:
 *   php tests/register-page-test.php
 */

$source = file_get_contents(__DIR__ . '/../register.html');
if (!is_string($source)) {
  fwrite(STDERR, "Unable to load register.html\n");
  exit(1);
}

$checks = [
  'form has a semantic submit target' => 'id="registerForm"',
  'form includes password confirmation' => 'id="inpPassConfirm"',
  'form sends password confirmation' => 'password_confirmation: inputs.passwordConfirm.value',
  'form includes password visibility controls' => 'data-password-toggle',
  'form exposes live feedback' => 'aria-live="polite"',
  'form lists password requirements' => 'id="passwordRules"',
  'form checks nickname availability' => 'nickname-availability.php',
  'form enables autocomplete' => 'autocomplete="new-password"',
  'form protects invalid submission' => 'form.addEventListener(\'submit\'',
  'form has a responsive identity grid' => '.identity-grid',
  'form has an accessible success status' => 'id="registerSuccess"',
  'page carries the phone flow deployment marker' => '<!-- phone-register-flow-v2 -->',
  'page has a non-submitting identity toggle' => 'id="identityModeToggle"',
  'page wires the inline identity toggle handler' => "identityModeToggle.addEventListener('click'",
];

foreach ($checks as $label => $needle) {
  if (!str_contains($source, $needle)) {
    fwrite(STDERR, "FAIL {$label}\n");
    exit(1);
  }
}

fwrite(STDOUT, "PASS registration page contract\n");
