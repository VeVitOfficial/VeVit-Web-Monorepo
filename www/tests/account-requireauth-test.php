<?php
// Regresní testy pro _auth_require_result() — testovatelné jádro requireAuth().
// requireAuth() samotný volá exit(); testujeme jeho logiku přes _auth_require_result().
// CI: php tests/account-requireauth-test.php
declare(strict_types=1);
chdir(__DIR__ . '/..');

$failures = 0;
function assert_test(string $name, bool $cond): void {
    global $failures;
    if ($cond) { printf("PASS %s\n", $name); }
    else { printf("FAIL %s\n", $name); $failures++; }
}

function make_cfg_rq(): array {
    return ['SUPABASE_URL' => 'https://x.supabase.co', 'SUPABASE_KEY' => 'key',
            'VV_APP_SECRET' => 'test-secret-32-chars-minimum-ok!', 'ALLOWED_ORIGIN' => 'https://vevit.cz'];
}

function sha256hex_rq(string $s): string { return hash('sha256', $s); }

function active_session_rq(string $token, string $userId): array {
    return ['token_hash' => sha256hex_rq($token), 'session_token' => $token,
            'user_id' => $userId, 'remember' => false, 'revoked_at' => null,
            'expires_at' => gmdate('Y-m-d\TH:i:s\Z', time() + 3600)];
}

function active_user_rq(string $id): array {
    return ['id' => $id, 'email' => 'u@example.com', 'nickname' => 'u',
            'full_name' => 'User', 'tier' => 'free', 'role' => 'user',
            'status' => 'active', 'avatar_url' => null];
}

function wire_rq(array $sessions, array $users, string $cookie = ''): void {
    $_COOKIE = [];
    if ($cookie !== '') $_COOKIE['__Host-vvsession'] = $cookie;

    $GLOBALS['_VV_SESSION_ADAPTERS'] = [
        'find_session_by_hash' => function (array $cfg, string $hash) use ($sessions): ?array {
            foreach ($sessions as $s) {
                if (hash_equals($s['token_hash'], $hash)) return $s;
            }
            return null;
        },
        'find_session_by_token' => function (): ?array { return null; },
        'find_user' => function (array $cfg, string $userId) use ($users): ?array {
            return $users[$userId] ?? null;
        },
        'touch_session' => function (): void {},
    ];
    // Zabrání setcookie() volání v CLI kontextu
    $GLOBALS['_AUTH_HELPER_ADAPTERS'] = [
        'set_cookie' => fn() => true,
    ];
}

function wire_rq_db_error(): void {
    $_COOKIE = ['__Host-vvsession' => str_repeat('a', 64)];
    $GLOBALS['_VV_SESSION_ADAPTERS'] = [
        'find_session_by_hash' => function (): never { throw new VvDbException('Simulated DB error'); },
        'find_session_by_token' => function (): never { throw new VvDbException('Simulated DB error'); },
        'find_user' => function (): never { throw new VvDbException('Simulated DB error'); },
        'touch_session' => function (): void {},
    ];
    $GLOBALS['_AUTH_HELPER_ADAPTERS'] = ['set_cookie' => fn() => true];
}

require_once 'shared/auth/session.php';
require_once 'account/lib/auth-helpers.php';

$cfg = make_cfg_rq();
$uid = 'user-1';
$tok = str_repeat('a', 64);

// ── 1. Platná session → code 200, user vrácen ───────────────────────────────
wire_rq([active_session_rq($tok, $uid)], [$uid => active_user_rq($uid)], $tok);
$r = _auth_require_result($cfg);
assert_test('valid session → code 200 + user', $r['code'] === 200 && ($r['user']['id'] ?? '') === $uid);

// ── 2. Žádná cookie → code 401 ──────────────────────────────────────────────
wire_rq([], []);
$r = _auth_require_result($cfg);
assert_test('no cookie → code 401', $r['code'] === 401);

// ── 3. DB chyba → code 503 (ne 401) ─────────────────────────────────────────
// Klíčová regrese: getCurrentUser() catchilo VvDbException → null → 401.
// _auth_require_result() to nesmí catchnout — vrátí 503.
wire_rq_db_error();
$r = _auth_require_result($cfg);
assert_test('DB error → code 503 not 401', $r['code'] === 503);

// ── 4. Zablokovaný účet (status != active) → code 401 ───────────────────────
$blockedUser = array_merge(active_user_rq($uid), ['status' => 'blocked']);
wire_rq([active_session_rq($tok, $uid)], [$uid => $blockedUser], $tok);
$r = _auth_require_result($cfg);
assert_test('blocked account → code 401', $r['code'] === 401);

// ── 5. Smazaný účet → code 401 ───────────────────────────────────────────────
$deletedUser = array_merge(active_user_rq($uid), ['status' => 'deleted']);
wire_rq([active_session_rq($tok, $uid)], [$uid => $deletedUser], $tok);
$r = _auth_require_result($cfg);
assert_test('deleted account → code 401', $r['code'] === 401);

// ── 6. Revokovaná session → code 401 ─────────────────────────────────────────
$revokedSess = active_session_rq($tok, $uid);
$revokedSess['revoked_at'] = gmdate('Y-m-d\TH:i:s\Z', time() - 60);
wire_rq([$revokedSess], [$uid => active_user_rq($uid)], $tok);
$r = _auth_require_result($cfg);
assert_test('revoked session → code 401', $r['code'] === 401);

// ── 7. Expirovaná session → code 401 ─────────────────────────────────────────
$expiredSess = active_session_rq($tok, $uid);
$expiredSess['expires_at'] = gmdate('Y-m-d\TH:i:s\Z', time() - 3600);
wire_rq([$expiredSess], [$uid => active_user_rq($uid)], $tok);
$r = _auth_require_result($cfg);
assert_test('expired session → code 401', $r['code'] === 401);

printf("\naccount-requireauth-test: %s\n", $failures === 0 ? 'PASS' : "FAIL ($failures selhání)");
exit($failures > 0 ? 1 : 0);
