<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/phone-identity.php';

function phone_assert(mixed $expected, mixed $actual, string $message): void { if ($expected !== $actual) throw new RuntimeException($message); }
function phone_case(string $name, callable $test): void { try { $test(); echo "PASS {$name}\n"; } catch (Throwable $e) { fwrite(STDERR, "FAIL {$name}: {$e->getMessage()}\n"); exit(1); } }

phone_case('E164 numbers are normalized without accepting malformed values', function (): void {
  phone_assert('+420725589559', normalizeE164Phone(' +420 725 589 559 '), 'Czech E164 failed');
  phone_assert('+420111222333', normalizeE164Phone('111 222 333'), 'local Czech phone was not normalized');
  phone_assert('+420111222333', normalizeE164Phone('00420111222333'), 'international prefix was not normalized');
  phone_assert(null, normalizeE164Phone('+420 725 abc'), 'letters accepted');
});
phone_case('login identifiers use a closed allowlist', function (): void {
  phone_assert(['kind' => 'email', 'value' => 'eva@example.test'], classifyLoginIdentifier(' Eva@Example.Test '), 'email classification failed');
  phone_assert(['kind' => 'phone', 'value' => '+420725589559'], classifyLoginIdentifier('+420 725 589 559'), 'phone classification failed');
  phone_assert(['kind' => 'nickname', 'value' => 'Eva.Novak'], classifyLoginIdentifier('Eva.Novak'), 'nickname classification failed');
  phone_assert(['kind' => 'nickname', 'value' => 'Jiří Novák'], classifyLoginIdentifier('  Jiří   Novák  '), 'Unicode nickname classification failed');
  phone_assert(null, classifyLoginIdentifier('id=eq.anything'), 'untrusted filter accepted');
});

echo "\n2 tests passed\n";
