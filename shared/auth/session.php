<?php
// Centrální session validátor pro všechny VeVit aplikace.
// Tento soubor nesmí být dostupný přes HTTP — root .htaccess blokuje shared/.
declare(strict_types=1);

class VvDbException extends RuntimeException {}

const VV_COOKIE     = '__Host-vvsession';
const VV_COOKIE_LEG = '__vvsession';

// ── DB adaptéry (testovatelnost) ─────────────────────────────────────────────

function _vv_adapter(string $name): ?callable {
    $a = $GLOBALS['_VV_SESSION_ADAPTERS'] ?? null;
    if (!is_array($a)) return null;
    $fn = $a[$name] ?? null;
    return is_callable($fn) ? $fn : null;
}

function _vv_find_session_by_hash(array $cfg, string $hash): ?array {
    if ($fn = _vv_adapter('find_session_by_hash')) return $fn($cfg, $hash);
    return _vv_sb_find_session($cfg, 'token_hash', $hash);
}

function _vv_find_session_by_token(array $cfg, string $token): ?array {
    if ($fn = _vv_adapter('find_session_by_token')) return $fn($cfg, $token);
    return _vv_sb_find_session($cfg, 'session_token', $token);
}

function _vv_find_user(array $cfg, string $userId): ?array {
    if ($fn = _vv_adapter('find_user')) return $fn($cfg, $userId);
    return _vv_sb_find_user($cfg, $userId);
}

function _vv_touch_session(array $cfg, string $hash): void {
    if ($fn = _vv_adapter('touch_session')) { $fn($cfg, $hash); return; }
    _vv_sb_touch($cfg, $hash);
}

// ── Produkční PostgREST volání ────────────────────────────────────────────────

function _vv_sb_headers(array $cfg): array {
    $key = $cfg['SUPABASE_KEY'] ?? '';
    return ['apikey: ' . $key, 'Authorization: Bearer ' . $key,
            'Accept: application/json', 'Content-Type: application/json'];
}

function _vv_sb_get(string $url, array $headers): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 6, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false || $err !== '') throw new VvDbException('DB unreachable: ' . $err);
    if ($code >= 500) throw new VvDbException('DB error HTTP ' . $code);
    $data = json_decode((string) $raw, true);
    return is_array($data) ? $data : [];
}

function _vv_sb_find_session(array $cfg, string $col, string $val): ?array {
    $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/sessions';
    $now  = gmdate('Y-m-d\TH:i:s\Z');
    $qs   = rawurlencode($col) . '=eq.' . rawurlencode($val)
          . '&revoked_at=is.null'
          . '&expires_at=gt.' . rawurlencode($now)
          . '&select=' . rawurlencode('user_id,token_hash,remember,expires_at,revoked_at')
          . '&limit=1';
    $rows = _vv_sb_get($base . '?' . $qs, _vv_sb_headers($cfg));
    return isset($rows[0]) && is_array($rows[0]) ? $rows[0] : null;
}

function _vv_sb_find_user(array $cfg, string $userId): ?array {
    $cols = implode(',', ['id','email','nickname','full_name','tier','tier_expires',
        'tier_billing','tier_cancel_at','role','avatar_url','phone','location',
        'birth_date','bio','level','xp','created_at','company_name','ico','dic',
        'billing_address','language','two_factor_enabled','status']);
    $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/users';
    $qs   = 'id=eq.' . rawurlencode($userId) . '&select=' . rawurlencode($cols) . '&limit=1';
    $rows = _vv_sb_get($base . '?' . $qs, _vv_sb_headers($cfg));
    return isset($rows[0]) && is_array($rows[0]) ? $rows[0] : null;
}

function _vv_sb_touch(array $cfg, string $hash): void {
    $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/sessions';
    $qs   = 'token_hash=eq.' . rawurlencode($hash);
    $body = json_encode(['last_seen_at' => gmdate('Y-m-d\TH:i:s\Z')]);
    $headers = array_merge(_vv_sb_headers($cfg), ['Prefer: return=minimal']);
    $ch = curl_init($base . '?' . $qs);
    curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => 'PATCH', CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 4, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
    curl_exec($ch);
    curl_close($ch);
    // touch je best-effort; chyba se nesignalizuje
}

// ── Validace tokenu ───────────────────────────────────────────────────────────

function _vv_valid_token_format(mixed $val): bool {
    return is_string($val) && preg_match('/\A[0-9a-f]{64}\z/iD', $val) === 1;
}

function _vv_resolve_session(array $cfg, string $rawToken, bool $isLegacy): ?array {
    if ($isLegacy) {
        // Plaintext lookup — pro zpětnou kompatibilitu do S-3
        $session = _vv_find_session_by_token($cfg, $rawToken);
    } else {
        $hash = hash('sha256', $rawToken);
        $session = _vv_find_session_by_hash($cfg, $hash);
    }
    if ($session === null) return null;
    if (($session['revoked_at'] ?? null) !== null) return null;
    $expiresAt = $session['expires_at'] ?? '';
    if (!is_string($expiresAt) || $expiresAt <= gmdate('Y-m-d\TH:i:s\Z')) return null;
    return $session;
}

// ── Veřejné API ───────────────────────────────────────────────────────────────

/**
 * Vrací pole uživatelských dat, nebo null (neautentizováno).
 * Vyhodí VvDbException při selhání DB (volající mapuje na 503).
 */
function vv_session_validate(array $cfg): ?array {
    $newToken = $_COOKIE[VV_COOKIE] ?? null;
    $legToken = $_COOKIE[VV_COOKIE_LEG] ?? null;

    $session  = null;
    $isLegacy = false;

    if (_vv_valid_token_format($newToken)) {
        $session = _vv_resolve_session($cfg, (string) $newToken, false);
    }
    if ($session === null && _vv_valid_token_format($legToken)) {
        $session  = _vv_resolve_session($cfg, (string) $legToken, true);
        $isLegacy = true;
    }
    if ($session === null) return null;

    $userId = $session['user_id'] ?? '';
    if (!is_string($userId) || $userId === '') return null;

    $user = _vv_find_user($cfg, $userId);
    if (!is_array($user)) return null;

    $status = $user['status'] ?? '';
    if ($status !== 'active') return null;

    // Aktualizuj last_seen_at pouze pro novou cookie — legacy expiraci neposouvá
    if (!$isLegacy) {
        $hash = hash('sha256', (string) $newToken);
        _vv_touch_session($cfg, $hash);
    }

    return $user;
}

/**
 * Vrátí uživatele nebo ukončí skript s 401/503.
 */
function vv_session_require(array $cfg): array {
    try {
        $user = vv_session_validate($cfg);
    } catch (VvDbException) {
        http_response_code(503);
        exit('{"error":"Service temporarily unavailable"}');
    }
    if ($user === null) {
        http_response_code(401);
        exit('{"error":"Unauthorized"}');
    }
    return $user;
}

/**
 * CSRF token odvozený z raw session tokenu a sdíleného tajemství.
 * Deterministický — volající ho může embedovat do HTML a ověřit při mutaci.
 */
function vv_csrf_token(string $rawToken, array $cfg): string {
    $secret = $cfg['VV_APP_SECRET'] ?? '';
    return hash_hmac('sha256', $rawToken . '|csrf', $secret);
}

/**
 * Ověří CSRF token v konstantním čase.
 */
function vv_csrf_verify(string $rawToken, string $submitted, array $cfg): bool {
    return hash_equals(vv_csrf_token($rawToken, $cfg), $submitted);
}

/**
 * Vrátí sanitizovanou same-origin URL pro přesměrování po přihlášení,
 * nebo výchozí cestu pokud vstup nesplňuje podmínky.
 * Přijímá pouze cesty začínající /, bez //domain ani jiné schéma.
 * Ochrana před: //evil.com, /\evil.com, javascript:, http:,
 * /%2F%2Fevil.com (percent-encoded //), /%5C (percent-encoded \).
 */
function vv_safe_return_to(mixed $raw, string $default = '/account'): string {
    if (!is_string($raw) || $raw === '') return $default;
    $parsed = parse_url($raw);
    if (
        !is_array($parsed)
        || isset($parsed['scheme'])
        || isset($parsed['host'])
        || isset($parsed['user'])
        || !isset($parsed['path'])
        || !str_starts_with($parsed['path'], '/')
    ) {
        return $default;
    }
    // Jeden rawurldecode odhalí /%2F%2F → // a /%5C → \ bez triple-encoding úniku.
    $decodedPath = rawurldecode($parsed['path']);
    if (
        str_starts_with($decodedPath, '//')
        || str_contains($decodedPath, '\\')
    ) {
        return $default;
    }
    $url = $parsed['path'];
    if (isset($parsed['query']))    $url .= '?' . $parsed['query'];
    if (isset($parsed['fragment'])) $url .= '#' . $parsed['fragment'];
    return substr($url, 0, 300);
}
