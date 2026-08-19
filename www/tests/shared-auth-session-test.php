<?php
// Test-first pro shared/auth/session.php.
// CI: php tests/shared-auth-session-test.php
// Žádná síť, žádný Supabase — vše přes DB adaptéry injektované přes $GLOBALS.
declare(strict_types=1);
chdir(__DIR__ . '/..');

$failures = 0;
function assert_test(string $name, bool $cond): void {
    global $failures;
    if ($cond) { printf("PASS %s\n", $name); }
    else { printf("FAIL %s\n", $name); $failures++; }
}

// ── Pomocné tabulky (in-memory) ──────────────────────────────────────────────
function make_cfg(string $appSecret = 'test-secret-32-chars-minimum-ok!'): array {
    return ['SUPABASE_URL' => 'https://x.supabase.co', 'SUPABASE_KEY' => 'key',
            'VV_APP_SECRET' => $appSecret, 'ALLOWED_ORIGIN' => 'https://vevit.cz'];
}

function sha256hex(string $s): string { return hash('sha256', $s); }

function active_session(string $token, string $userId, bool $remember = false): array {
    return ['token_hash' => sha256hex($token), 'session_token' => $token,
            'user_id' => $userId, 'remember' => $remember, 'revoked_at' => null,
            'expires_at' => gmdate('Y-m-d\TH:i:s\Z', time() + 3600)];
}

function revoked_session(string $token, string $userId): array {
    $s = active_session($token, $userId);
    $s['revoked_at'] = gmdate('Y-m-d\TH:i:s\Z', time() - 60);
    return $s;
}

function expired_session(string $token, string $userId): array {
    $s = active_session($token, $userId);
    $s['expires_at'] = gmdate('Y-m-d\TH:i:s\Z', time() - 3600);
    return $s;
}

function active_user(string $id): array {
    return ['id' => $id, 'email' => 'u@example.com', 'nickname' => 'u',
            'full_name' => 'User', 'tier' => 'free', 'role' => 'user',
            'status' => 'active', 'avatar_url' => null];
}

function blocked_user(string $id): array {
    $u = active_user($id);
    $u['status'] = 'blocked';
    return $u;
}

// ── Nastaví globální DB adaptéry a cookie superglobal ───────────────────────
function wire(array $sessions, array $users, string $cookie = '', string $legacyCookie = ''): void {
    $_COOKIE = [];
    if ($cookie !== '') $_COOKIE['__Host-vvsession'] = $cookie;
    if ($legacyCookie !== '') $_COOKIE['__vvsession'] = $legacyCookie;

    $GLOBALS['_VV_SESSION_ADAPTERS'] = [
        'find_session_by_hash' => function (array $cfg, string $hash) use ($sessions): ?array {
            foreach ($sessions as $s) {
                if (hash_equals($s['token_hash'], $hash)) return $s;
            }
            return null;
        },
        'find_session_by_token' => function (array $cfg, string $token) use ($sessions): ?array {
            foreach ($sessions as $s) {
                if (isset($s['session_token']) && hash_equals($s['session_token'], $token)) return $s;
            }
            return null;
        },
        'find_user' => function (array $cfg, string $userId) use ($users): ?array {
            return $users[$userId] ?? null;
        },
        'touch_session' => function (array $cfg, string $hash): void {
            // no-op in tests
        },
        'set_cookie' => function (): bool {
            return true;
        },
        'migrate_legacy_session' => function (array $cfg, string $legacyToken, string $newHash) use ($sessions): ?array {
            foreach ($sessions as $session) {
                if (isset($session['session_token']) && hash_equals($session['session_token'], $legacyToken)) {
                    return array_merge($session, ['token_hash' => $newHash]);
                }
            }
            return null;
        },
    ];
}

function wire_db_error(): void {
    $_COOKIE = ['__Host-vvsession' => str_repeat('a', 64)];
    $GLOBALS['_VV_SESSION_ADAPTERS'] = [
        'find_session_by_hash' => function (): never {
            throw new VvDbException('Simulated DB error');
        },
        'find_session_by_token' => function (): never {
            throw new VvDbException('Simulated DB error');
        },
        'find_user' => function (): never {
            throw new VvDbException('Simulated DB error');
        },
        'touch_session' => function (): void {},
    ];
}

require_once 'shared/auth/session.php';

$cfg = make_cfg();
$uid = 'user-1';
$tok = str_repeat('a', 64);
$tok2 = str_repeat('b', 64);

// ── 1. Platná nová cookie → uživatel vrácen ──────────────────────────────────
wire([active_session($tok, $uid)], [$uid => active_user($uid)], $tok);
$u = vv_session_validate($cfg);
assert_test('valid new cookie returns user', $u !== null && $u['id'] === $uid);

// ── 2. Žádná cookie → null ───────────────────────────────────────────────────
wire([], []);
assert_test('no cookie returns null', vv_session_validate($cfg) === null);

// ── 3. Revokovaná session → null ─────────────────────────────────────────────
wire([revoked_session($tok, $uid)], [$uid => active_user($uid)], $tok);
assert_test('revoked session returns null', vv_session_validate($cfg) === null);

// ── 4. Expirovaná session → null ─────────────────────────────────────────────
wire([expired_session($tok, $uid)], [$uid => active_user($uid)], $tok);
assert_test('expired session returns null', vv_session_validate($cfg) === null);

// ── 5. Zablokovaný uživatel → null ───────────────────────────────────────────
wire([active_session($tok, $uid)], [$uid => blocked_user($uid)], $tok);
assert_test('blocked user returns null', vv_session_validate($cfg) === null);

// ── 6. DB chyba → VvDbException ──────────────────────────────────────────────
wire_db_error();
$threw = false;
try { vv_session_validate($cfg); } catch (VvDbException) { $threw = true; }
assert_test('DB error throws VvDbException', $threw);

// ── 7. Legacy cookie fallback (žádná nová cookie) ───────────────────────────
wire([active_session($tok, $uid)], [$uid => active_user($uid)], '', $tok);
$u = vv_session_validate($cfg);
assert_test('legacy cookie fallback returns user', $u !== null && $u['id'] === $uid);

// ── 8. Legacy cookie neprodlouží expiraci ────────────────────────────────────
$touched = false;
wire([active_session($tok, $uid)], [$uid => active_user($uid)], '', $tok);
$GLOBALS['_VV_SESSION_ADAPTERS']['touch_session'] = function () use (&$touched): void {
    $touched = true;
};
vv_session_validate($cfg);
assert_test('legacy cookie does not call touch_session', !$touched);

// ── 9. Nová cookie volá touch_session ────────────────────────────────────────
$touched = false;
wire([active_session($tok, $uid)], [$uid => active_user($uid)], $tok);
$GLOBALS['_VV_SESSION_ADAPTERS']['touch_session'] = function () use (&$touched): void {
    $touched = true;
};
vv_session_validate($cfg);
assert_test('new cookie calls touch_session', $touched);

// ── 10. Špatný formát cookie → null (bez DB volání) ──────────────────────────
wire([], [], 'not-hex-not-64chars');
assert_test('malformed cookie returns null without DB call', vv_session_validate($cfg) === null);

// ── 11. CSRF token je deterministický pro stejný vstup ───────────────────────
$t1 = vv_csrf_token($tok, $cfg);
$t2 = vv_csrf_token($tok, $cfg);
assert_test('csrf token deterministic', $t1 === $t2 && strlen($t1) === 64);

// ── 12. CSRF verify platný token ─────────────────────────────────────────────
assert_test('csrf verify valid', vv_csrf_verify($tok, $t1, $cfg));

// ── 13. CSRF verify falešný token → false ────────────────────────────────────
assert_test('csrf verify invalid', !vv_csrf_verify($tok, str_repeat('0', 64), $cfg));

// ── 14. Různé tokeny → různé CSRF ────────────────────────────────────────────
assert_test('csrf different session → different token', vv_csrf_token($tok, $cfg) !== vv_csrf_token($tok2, $cfg));

// ── 15. Nová cookie má přednost před legacy ───────────────────────────────────
wire([active_session($tok, $uid), active_session($tok2, 'user-2')],
     [$uid => active_user($uid), 'user-2' => active_user('user-2')],
     $tok, $tok2);
$u = vv_session_validate($cfg);
assert_test('new cookie takes priority over legacy', $u !== null && $u['id'] === $uid);

// ── 16. Uživatel 'deleted' → null ────────────────────────────────────────────
wire([active_session($tok, $uid)], [$uid => array_merge(active_user($uid), ['status' => 'deleted'])], $tok);
assert_test('deleted user returns null', vv_session_validate($cfg) === null);

// ── 17–24. vv_safe_return_to — open-redirect regrese ─────────────────────────
// Pozitivní: normální cesta s query string projde beze změny.
assert_test('safe_return_to valid path with query', vv_safe_return_to('/store/checkout?x=1') === '/store/checkout?x=1');

// Protocol-relative: //evil.com musí být odmítnuto.
assert_test('safe_return_to rejects //evil.com', vv_safe_return_to('//evil.com') === '/account');

// Backslash bez lomítka: parse_url vrátí path == '\evil.com' (bez /), odmítne path check.
assert_test('safe_return_to rejects \\evil.com', vv_safe_return_to('\evil.com') === '/account');

// Backslash s lomítkem: parse_url vrátí path '/\evil.com', decodedPath obsahuje \, odmítne.
assert_test('safe_return_to rejects /\\evil.com', vv_safe_return_to('/\\evil.com') === '/account');

// Percent-encoded backslash /%5C: rawurldecode → \, odmítne.
assert_test('safe_return_to rejects /%5Cevil.com', vv_safe_return_to('/%5Cevil.com') === '/account');

// Percent-encoded // malá písmena /%2f%2f: rawurldecode → //, odmítne.
assert_test('safe_return_to rejects /%2f%2fevil.com', vv_safe_return_to('/%2f%2fevil.com') === '/account');

// Percent-encoded // velká písmena /%2F%2F: rawurldecode → //, odmítne.
assert_test('safe_return_to rejects /%2F%2Fevil.com', vv_safe_return_to('/%2F%2Fevil.com') === '/account');

// Mixed /%2F\ — buď // po decode, nebo \ v decoded path, odmítne.
assert_test('safe_return_to rejects /%2F\\evil.com', vv_safe_return_to('/%2F\\evil.com') === '/account');

// ── 25. Acceptance: odvolání relace B neovlivní aktuální relaci A ────────────
// Simuluje stav po sessions-revoke.php: B je revokovaná, A zůstává aktivní.
// Token A je v cookie → validace musí vrátit uživatele bez ohledu na stav B.
$tokA = str_repeat('c', 64);
$tokB = str_repeat('d', 64);
wire(
    [active_session($tokA, $uid), revoked_session($tokB, $uid)],
    [$uid => active_user($uid)],
    $tokA
);
$u = vv_session_validate($cfg);
assert_test('acceptance: revoked session B does not affect current session A', $u !== null && $u['id'] === $uid);

printf("\nshared-auth-session-test: %s\n", $failures === 0 ? 'PASS' : "FAIL ($failures selhání)");
exit($failures > 0 ? 1 : 0);
