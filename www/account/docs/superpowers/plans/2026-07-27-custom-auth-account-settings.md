# Custom Auth + Account Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Clerk with cookie-based PHP custom auth connected to Supabase Postgres via PostgREST, and wire the account settings UI to real data.

**Architecture:** PHP endpoints under `api/` handle all auth and data logic using the Supabase service_role key via PostgREST REST calls. The browser stores only an opaque session token in an HttpOnly cookie. `index.html` boots by calling `GET /api/me.php` instead of loading Clerk — no CDN dependency.

**Tech Stack:** PHP 8.1+ (WEDOS shared hosting), Supabase PostgREST, Vanilla JS (ES5-compatible IIFE in assets/app.js), Apache .htaccess, PHP mail() / SMTP for password reset.

## Global Constraints

- WEDOS shared hosting: no Node.js, no Composer, no exec(), no CLI.
- No Clerk anywhere: remove all `<script>` tags referencing clerk/unpkg, all `clerk.*` JS calls.
- Session cookie: name `__vvsession`, HttpOnly, Secure, SameSite=Lax, path=/, 7 days, set only over HTTPS.
- `config.php` at repo root, protected via `.htaccess "Require all denied"`. NEVER in `api/` or accessible from browser.
- All Supabase calls via service_role key from PHP only — never in JS/HTML.
- All PostgREST query-string values must pass through `rawurlencode()`.
- Rate-limit by IP for login, register, forgot-password (table `login_attempts`).
- Passwords: `password_hash($pass, PASSWORD_BCRYPT)` on write, `password_verify()` on check.
- Password reset token: raw `bin2hex(random_bytes(32))` in email, `hash('sha256', $token)` in DB column `reset_token_hash`.
- Never return password hash, reset_token_hash, reset_token_expires_at from any endpoint.
- Visual style preserved 1:1 (tokens in assets/styles.css unchanged).
- Avatar upload: Supabase Storage via PHP multipart (no disk write on hosting).

---

## File Map

**Modify/replace (existing files):**
- `config.php` — replace Clerk keys with cookie/SMTP constants
- `config.example.php` — new: git-tracked template
- `.htaccess` — add `lib/` directory deny
- `api/_verify.php` — DELETE (Clerk JWT verifier, no longer needed)
- `api/config.php` — DELETE (was a symlink/copy; config.php moves to root with .htaccess deny)
- `api/delete-account.php` — full rewrite (Clerk API → Supabase RPC)
- `api/export-data.php` — full rewrite (Clerk user → users table)
- `assets/config.js` — remove `CLERK_PUBLISHABLE_KEY`, keep `SUPABASE_URL`/`SUPABASE_ANON_KEY` (only needed if any client-side Supabase query survives — otherwise remove entirely)
- `assets/app.js` — full rewrite (remove all Clerk, wire to PHP endpoints via fetch + cookie)
- `index.html` — update boot sequence (remove Clerk/Supabase CDN scripts)
- `login.html` — full rewrite (remove Clerk widget)
- `register.html` — full rewrite (remove Clerk widget)
- `sql/schema.sql` — update to reflect new schema + add migration files

**Create (new files):**
- `lib/supabase-rest.php`
- `lib/auth-helpers.php`
- `api/login.php`
- `api/register.php`
- `api/logout.php`
- `api/me.php`
- `api/forgot-password.php`
- `api/reset-password.php`
- `api/profile-update.php`
- `api/change-password.php`
- `api/sessions-list.php`
- `api/sessions-revoke.php`
- `api/subscription.php`
- `api/notifications.php`
- `forgot-password.html`
- `reset-password.html`
- `sql/migrations/001_users_extra_columns.sql`
- `sql/migrations/002_notification_prefs.sql`
- `sql/migrations/003_account_activity.sql`
- `sql/migrations/004_delete_user_fn.sql`

---

### Task 1: config.php + .htaccess + config.example.php

**Files:**
- Modify: `config.php` (root, .htaccess-protected)
- Modify: `.htaccess`
- Create: `config.example.php`

**Interfaces:**
- Produces: `require __DIR__ . '/../config.php'` from any `api/*.php` or `lib/*.php` returns array with keys: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `ALLOWED_ORIGIN`, `COOKIE_DOMAIN`, `SMTP_*` (optional).

- [ ] **Step 1: Replace config.php**

```php
<?php
// config.php — root directory, protected by .htaccess.
// Copy config.example.php → config.php on server and fill real values.

return [
  // Supabase
  'SUPABASE_URL'          => 'https://YOUR_PROJECT.supabase.co',
  'SUPABASE_SERVICE_ROLE' => 'eyJ...',   // service_role key, server-only

  // CORS — your production domain
  'ALLOWED_ORIGIN'        => 'https://account.vevit.cz',

  // Session cookie domain (bare domain, e.g. ".vevit.cz" or "account.vevit.cz")
  'COOKIE_DOMAIN'         => 'account.vevit.cz',

  // Optional SMTP for password-reset emails (leave empty to use PHP mail())
  'SMTP_HOST'    => '',
  'SMTP_PORT'    => 587,
  'SMTP_USER'    => '',
  'SMTP_PASS'    => '',
  'MAIL_FROM'    => 'no-reply@vevit.cz',
  'MAIL_FROM_NAME' => 'vevit',

  // App base URL (used in reset-password email link)
  'APP_URL'      => 'https://account.vevit.cz',
];
```

- [ ] **Step 2: Create config.example.php** (identical content, values replaced by placeholders, committed to git)

```php
<?php
// Copy to config.php and fill in real values. Never commit config.php.
return [
  'SUPABASE_URL'          => 'https://YOUR_PROJECT.supabase.co',
  'SUPABASE_SERVICE_ROLE' => 'YOUR_SERVICE_ROLE_KEY',
  'ALLOWED_ORIGIN'        => 'https://account.vevit.cz',
  'COOKIE_DOMAIN'         => 'account.vevit.cz',
  'SMTP_HOST'    => '',
  'SMTP_PORT'    => 587,
  'SMTP_USER'    => '',
  'SMTP_PASS'    => '',
  'MAIL_FROM'    => 'no-reply@vevit.cz',
  'MAIL_FROM_NAME' => 'vevit',
  'APP_URL'      => 'https://account.vevit.cz',
];
```

- [ ] **Step 3: Update .htaccess** — add lib/ deny and remove obsolete Authorization pass-through

```apache
# VeVit Account — WEDOS (Apache)

RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

DirectoryIndex index.html

# Protect secrets and source
<FilesMatch "^config\.php$|^config\.example\.php$">
  Require all denied
</FilesMatch>
<FilesMatch "\.(sql|md)$">
  Require all denied
</FilesMatch>
<FilesMatch "^_.*\.php$">
  Require all denied
</FilesMatch>

# Protect lib/ directory entirely
<IfModule mod_authz_core.c>
  <DirectoryMatch "^.*/lib/">
    Require all denied
  </DirectoryMatch>
</IfModule>

# Static caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 7 days"
  ExpiresByType application/javascript "access plus 7 days"
</IfModule>
```

- [ ] **Step 4: Delete api/_verify.php and api/config.php** — these are Clerk artefacts

```bash
rm api/_verify.php api/config.php
```

- [ ] **Step 5: Update .gitignore** — make sure config.php is ignored, config.example.php is tracked

```
/config.php
/uploads/*
!/uploads/.gitkeep
```

- [ ] **Step 6: Commit**

```bash
git add config.example.php .htaccess .gitignore
git rm api/_verify.php api/config.php
git commit -m "feat: replace Clerk config with custom auth config skeleton"
```

---

### Task 2: lib/supabase-rest.php

**Files:**
- Create: `lib/supabase-rest.php`

**Interfaces:**
- Consumes: `$cfg` array from Task 1
- Produces functions:
  - `sb_get(array $cfg, string $table, array $eq = [], string $select = '*', ?int $limit = null): array` → `['data' => [...]]` or `['error' => '...']`
  - `sb_insert(array $cfg, string $table, array $row): array` → `['data' => [...]]` or `['error' => '...', 'code' => '23505']`
  - `sb_update(array $cfg, string $table, array $eq, array $patch): array`
  - `sb_delete(array $cfg, string $table, array $eq): bool`
  - `sb_rpc(array $cfg, string $fn, array $args): array`

- [ ] **Step 1: Create lib/supabase-rest.php**

```php
<?php
declare(strict_types=1);

/**
 * Minimal PostgREST wrapper. Uses cURL if available, falls back to
 * file_get_contents. All query-string values must be pre-encoded by caller.
 */

function _sb_base_headers(array $cfg): array {
  return [
    'apikey: '         . $cfg['SUPABASE_SERVICE_ROLE'],
    'Authorization: Bearer ' . $cfg['SUPABASE_SERVICE_ROLE'],
    'Content-Type: application/json',
    'Accept: application/json',
  ];
}

function _sb_curl(string $method, string $url, array $headers, ?string $body = null): array {
  $ch = curl_init($url);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_CUSTOMREQUEST  => $method,
  ];
  if ($body !== null) $opts[CURLOPT_POSTFIELDS] = $body;
  curl_setopt_array($ch, $opts);
  $raw  = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err  = curl_error($ch);
  curl_close($ch);
  if ($err) return ['http' => 0, 'body' => null, 'error' => $err];
  return ['http' => $code, 'body' => $raw ?: ''];
}

function _sb_parse(array $res, bool $single = false): array {
  if (isset($res['error'])) return ['error' => $res['error']];
  $code = $res['http'];
  $body = $res['body'];
  if ($code === 204) return ['data' => []];
  $decoded = json_decode((string)$body, true);
  if ($code < 200 || $code >= 300) {
    // PostgREST error: {"code":"23505","message":"...","details":"..."}
    $msg  = is_array($decoded) ? ($decoded['message'] ?? $body) : $body;
    $pgCode = is_array($decoded) ? ($decoded['code'] ?? '') : '';
    return ['error' => $msg, 'code' => $pgCode, 'http' => $code];
  }
  if ($single && is_array($decoded)) {
    $decoded = $decoded[0] ?? null;
    if ($decoded === null) return ['error' => 'not_found', 'http' => 404];
  }
  return ['data' => $decoded];
}

/**
 * SELECT from a table.
 * $eq: ['col' => 'value'] — all become AND eq conditions.
 */
function sb_get(array $cfg, string $table, array $eq = [], string $select = '*', ?int $limit = null, bool $single = false): array {
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $qs   = ['select=' . rawurlencode($select)];
  foreach ($eq as $col => $val) {
    $qs[] = rawurlencode($col) . '=eq.' . rawurlencode((string)$val);
  }
  if ($limit !== null) $qs[] = 'limit=' . (int)$limit;
  $url  = $base . '?' . implode('&', $qs);
  $hdrs = _sb_base_headers($cfg);
  if ($single) $hdrs[] = 'Accept-Profile: public';
  $res  = _sb_curl('GET', $url, $hdrs);
  return _sb_parse($res, $single);
}

/**
 * INSERT a single row. Returns the inserted row (Prefer: return=representation).
 */
function sb_insert(array $cfg, string $table, array $row): array {
  $url  = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $hdrs = array_merge(_sb_base_headers($cfg), ['Prefer: return=representation']);
  $res  = _sb_curl('POST', $url, $hdrs, json_encode($row));
  $parsed = _sb_parse($res);
  if (isset($parsed['data']) && is_array($parsed['data']) && isset($parsed['data'][0])) {
    $parsed['data'] = $parsed['data'][0];
  }
  return $parsed;
}

/**
 * UPDATE rows matching $eq. Returns updated rows.
 */
function sb_update(array $cfg, string $table, array $eq, array $patch): array {
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $qs   = [];
  foreach ($eq as $col => $val) {
    $qs[] = rawurlencode($col) . '=eq.' . rawurlencode((string)$val);
  }
  $url  = $base . '?' . implode('&', $qs);
  $hdrs = array_merge(_sb_base_headers($cfg), ['Prefer: return=representation']);
  $res  = _sb_curl('PATCH', $url, $hdrs, json_encode($patch));
  return _sb_parse($res);
}

/**
 * DELETE rows matching $eq. Returns true on success.
 */
function sb_delete(array $cfg, string $table, array $eq): bool {
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $qs   = [];
  foreach ($eq as $col => $val) {
    $qs[] = rawurlencode($col) . '=eq.' . rawurlencode((string)$val);
  }
  $url = $base . '?' . implode('&', $qs);
  $res = _sb_curl('DELETE', $url, _sb_base_headers($cfg));
  return $res['http'] >= 200 && $res['http'] < 300;
}

/**
 * Call a Postgres RPC function.
 */
function sb_rpc(array $cfg, string $fn, array $args): array {
  $url = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/rpc/' . rawurlencode($fn);
  $res = _sb_curl('POST', $url, _sb_base_headers($cfg), json_encode($args));
  return _sb_parse($res);
}

/**
 * Convenience: fetch a single row by one equality condition, null if not found.
 * Returns ['data' => row] or ['error' => '...'].
 */
function sb_find_one(array $cfg, string $table, array $eq, string $select = '*'): array {
  $res = sb_get($cfg, $table, $eq, $select, 1);
  if (isset($res['error'])) return $res;
  $rows = $res['data'] ?? [];
  if (empty($rows)) return ['data' => null];
  return ['data' => $rows[0]];
}

/**
 * Count rows matching conditions (uses PostgREST HEAD + Prefer:count=exact).
 * Returns int or -1 on error.
 */
function sb_count(array $cfg, string $table, array $eq): int {
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $qs   = ['select=id'];
  foreach ($eq as $col => $val) {
    $qs[] = rawurlencode($col) . '=eq.' . rawurlencode((string)$val);
  }
  $url  = $base . '?' . implode('&', $qs);
  $hdrs = array_merge(_sb_base_headers($cfg), ['Prefer: count=exact']);
  $ch   = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_NOBODY         => true,  // HEAD
    CURLOPT_HTTPHEADER     => $hdrs,
    CURLOPT_TIMEOUT        => 10,
  ]);
  curl_exec($ch);
  $range = curl_getinfo($ch, CURLINFO_CONTENT_RANGE) ?: '';
  // Content-Range: 0-0/N — we need to read response headers differently
  // Use a simpler approach: GET with limit=0 and count header
  curl_close($ch);
  // Fallback: just get all and count
  $res = sb_get($cfg, $table, $eq, 'id', 1000);
  return isset($res['data']) ? count($res['data']) : -1;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase-rest.php
git commit -m "feat: add supabase-rest PostgREST wrapper"
```

---

### Task 3: lib/auth-helpers.php

**Files:**
- Create: `lib/auth-helpers.php`

**Interfaces:**
- Consumes: `lib/supabase-rest.php`, `config.php`
- Produces:
  - `auth_load_config(): array` — loads config.php relative to lib/
  - `getCurrentUser(array $cfg): ?array` — reads cookie, returns user row or null
  - `requireAuth(array $cfg): array` — returns user row or sends 401 + exits
  - `checkRateLimit(array $cfg, string $ip, string $action, int $limit, int $windowMinutes): bool`
  - `logAttempt(array $cfg, string $ip, string $action): void`
  - `beginJson(array $cfg): void` — CORS + Content-Type headers
  - `jsonOk(mixed $data, int $code = 200): never`
  - `jsonErr(string $msg, int $code = 400, ?string $field = null): never`
  - `COOKIE_NAME = '__vvsession'`

- [ ] **Step 1: Create lib/auth-helpers.php**

```php
<?php
declare(strict_types=1);

require_once __DIR__ . '/supabase-rest.php';

const COOKIE_NAME    = '__vvsession';
const SESSION_DAYS   = 7;
const COOKIE_PATH    = '/';

function auth_load_config(): array {
  $path = __DIR__ . '/../config.php';
  if (!is_file($path)) {
    http_response_code(500);
    exit(json_encode(['error' => 'Server configuration missing']));
  }
  return require $path;
}

/**
 * Read __vvsession cookie, verify against sessions table, return user row or null.
 * Joins sessions → users in one round-trip by fetching session then user.
 */
function getCurrentUser(array $cfg): ?array {
  $token = $_COOKIE[COOKIE_NAME] ?? '';
  if ($token === '' || strlen($token) !== 64) return null;

  // Look up session (not expired)
  $now = date('Y-m-d\TH:i:s\Z', time());
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/sessions';
  $qs   = [
    'session_token=eq.' . rawurlencode($token),
    'expires_at=gt.'    . rawurlencode($now),
    'select=user_id',
    'limit=1',
  ];
  $headers = [
    'apikey: '         . $cfg['SUPABASE_SERVICE_ROLE'],
    'Authorization: Bearer ' . $cfg['SUPABASE_SERVICE_ROLE'],
    'Accept: application/json',
  ];
  $ch = curl_init($base . '?' . implode('&', $qs));
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_TIMEOUT        => 10,
  ]);
  $raw  = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code !== 200 || !$raw) return null;
  $rows = json_decode($raw, true);
  if (empty($rows) || !isset($rows[0]['user_id'])) return null;
  $userId = $rows[0]['user_id'];

  // Fetch user row (exclude secrets)
  $cols = 'id,email,nickname,full_name,tier,tier_expires,tier_billing,tier_cancel_at,'
        . 'role,avatar_url,phone,location,birth_date,bio,level,xp,created_at,'
        . 'company_name,ico,dic,billing_address,language,two_factor_enabled';
  $res = sb_find_one($cfg, 'users', ['id' => $userId], $cols);
  return $res['data'] ?? null;
}

/**
 * Require authenticated user or exit with 401.
 */
function requireAuth(array $cfg): array {
  $user = getCurrentUser($cfg);
  if ($user === null) jsonErr('Unauthorized', 401);
  return $user;
}

/**
 * Check rate limit. Returns true (OK to proceed) or false (blocked).
 * Counts rows in login_attempts for $ip + $action in last $windowMinutes.
 */
function checkRateLimit(array $cfg, string $ip, string $action, int $limit, int $windowMinutes): bool {
  $since = date('Y-m-d\TH:i:s\Z', time() - $windowMinutes * 60);
  $base  = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/login_attempts';
  $qs    = [
    'ip_address=eq.' . rawurlencode($ip),
    'action=eq.'     . rawurlencode($action),
    'attempt_time=gt.' . rawurlencode($since),
    'select=id',
  ];
  $headers = [
    'apikey: '         . $cfg['SUPABASE_SERVICE_ROLE'],
    'Authorization: Bearer ' . $cfg['SUPABASE_SERVICE_ROLE'],
    'Accept: application/json',
    'Prefer: count=exact',
  ];
  $ch = curl_init($base . '?' . implode('&', $qs));
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_TIMEOUT        => 10,
  ]);
  $raw = curl_exec($ch);
  curl_close($ch);
  $rows = json_decode((string)$raw, true);
  $count = is_array($rows) ? count($rows) : 0;
  return $count < $limit;
}

/**
 * Insert a row into login_attempts.
 */
function logAttempt(array $cfg, string $ip, string $action): void {
  sb_insert($cfg, 'login_attempts', [
    'ip_address'   => $ip,
    'action'       => $action,
    'attempt_time' => date('Y-m-d\TH:i:s\Z'),
  ]);
}

/**
 * Log an account activity event (security feed on Overview tab).
 */
function logActivity(array $cfg, string $userId, string $kind, string $detail = ''): void {
  sb_insert($cfg, 'account_activity', [
    'user_id'    => $userId,
    'kind'       => $kind,
    'detail'     => $detail,
    'created_at' => date('Y-m-d\TH:i:s\Z'),
  ]);
}

/**
 * Create a session: insert into sessions, set __vvsession cookie.
 * Returns the session token.
 */
function createSession(array $cfg, string $userId): string {
  $token     = bin2hex(random_bytes(32));
  $expiresAt = date('Y-m-d\TH:i:s\Z', time() + SESSION_DAYS * 86400);
  sb_insert($cfg, 'sessions', [
    'session_token' => $token,
    'user_id'       => $userId,
    'expires_at'    => $expiresAt,
    'created_at'    => date('Y-m-d\TH:i:s\Z'),
  ]);
  $secure  = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
  $expires = time() + SESSION_DAYS * 86400;
  $domain  = $cfg['COOKIE_DOMAIN'] ?? '';
  // PHP 7.3+: pass options array to support SameSite
  setcookie(COOKIE_NAME, $token, [
    'expires'  => $expires,
    'path'     => COOKIE_PATH,
    'domain'   => $domain,
    'secure'   => $secure,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
  return $token;
}

/**
 * Delete session cookie + DB row for current token.
 */
function destroySession(array $cfg): void {
  $token = $_COOKIE[COOKIE_NAME] ?? '';
  if ($token !== '') {
    sb_delete($cfg, 'sessions', ['session_token' => $token]);
  }
  setcookie(COOKIE_NAME, '', [
    'expires'  => time() - 3600,
    'path'     => COOKIE_PATH,
    'domain'   => $cfg['COOKIE_DOMAIN'] ?? '',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
}

/** Emit CORS + JSON headers, handle preflight. */
function beginJson(array $cfg): void {
  header('Content-Type: application/json');
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origin && $origin === ($cfg['ALLOWED_ORIGIN'] ?? '')) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
  }
  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

/** Send JSON success response and exit. */
function jsonOk(mixed $data, int $code = 200): never {
  http_response_code($code);
  exit(json_encode($data));
}

/** Send JSON error response and exit. */
function jsonErr(string $msg, int $code = 400, ?string $field = null): never {
  http_response_code($code);
  $body = ['error' => $msg];
  if ($field !== null) $body['field'] = $field;
  exit(json_encode($body));
}

/** Get client IP, respecting X-Forwarded-For (WEDOS uses reverse proxy). */
function clientIp(): string {
  $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
  if ($forwarded) {
    return trim(explode(',', $forwarded)[0]);
  }
  return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/** Read and decode JSON request body. Returns array or exits 400. */
function jsonBody(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode((string)$raw, true);
  if (!is_array($data)) jsonErr('Invalid JSON body');
  return $data;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth-helpers.php
git commit -m "feat: add auth-helpers (session, rate-limit, CORS)"
```

---

### Task 4: api/login.php

**Files:**
- Create: `api/login.php`

**Interfaces:**
- Consumes: POST `{email, password}` JSON
- Produces: `200 {user: {...}}` + sets `__vvsession` cookie, or `429` (rate limit), `401` (bad credentials)

- [ ] **Step 1: Create api/login.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

$ip     = clientIp();
$action = 'login';
if (!checkRateLimit($cfg, $ip, $action, 10, 15)) {
  logAttempt($cfg, $ip, $action);
  jsonErr('Příliš mnoho pokusů. Zkuste to za chvíli.', 429);
}
logAttempt($cfg, $ip, $action);

$body  = jsonBody();
$email = trim((string)($body['email'] ?? ''));
$pass  = (string)($body['password'] ?? '');

if ($email === '' || $pass === '') jsonErr('Vyplňte e-mail a heslo.');

// Find user by email (select only what we need for verify + session)
$res = sb_find_one($cfg, 'users',
  ['email' => strtolower($email)],
  'id,password,email'
);
if (isset($res['error']) && $res['error'] !== 'not_found') {
  jsonErr('Chyba serveru.', 500);
}

// Always run password_verify to prevent timing attacks
$hash = $res['data']['password'] ?? '$2y$10$invalidhashpadding000000000000000000000000000000000000';
$ok   = password_verify($pass, $hash) && ($res['data'] !== null);

if (!$ok) jsonErr('Nesprávný e-mail nebo heslo.', 401);

$userId = $res['data']['id'];
createSession($cfg, $userId);
logActivity($cfg, $userId, 'login', 'IP: ' . $ip);

// Return user data (without secrets)
$cols = 'id,email,nickname,full_name,tier,tier_expires,role,avatar_url,level,xp,language,two_factor_enabled';
$user = sb_find_one($cfg, 'users', ['id' => $userId], $cols);
jsonOk(['user' => $user['data']]);
```

- [ ] **Step 2: Commit**

```bash
git add api/login.php
git commit -m "feat: add api/login.php with rate limiting and bcrypt verify"
```

---

### Task 5: api/register.php

**Files:**
- Create: `api/register.php`

**Interfaces:**
- Consumes: POST `{email, nickname, full_name, password}` JSON
- Produces: `201 {user: {...}}` + sets cookie, or `409` (email/nickname conflict), `422` (validation)

- [ ] **Step 1: Create api/register.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

$ip = clientIp();
if (!checkRateLimit($cfg, $ip, 'register', 5, 60)) {
  logAttempt($cfg, $ip, 'register');
  jsonErr('Příliš mnoho pokusů. Zkuste to za chvíli.', 429);
}
logAttempt($cfg, $ip, 'register');

$body     = jsonBody();
$email    = strtolower(trim((string)($body['email']     ?? '')));
$nickname = trim((string)($body['nickname']  ?? ''));
$fullName = trim((string)($body['full_name'] ?? ''));
$pass     = (string)($body['password'] ?? '');

// Validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL))
  jsonErr('Neplatný formát e-mailu.', 422, 'email');
if (strlen($nickname) < 3 || strlen($nickname) > 30 || !preg_match('/^[a-z0-9_\-]+$/i', $nickname))
  jsonErr('Přezdívka musí mít 3–30 znaků a jen písmena, čísla, _ nebo -.', 422, 'nickname');
if (strlen($fullName) < 2)
  jsonErr('Jméno je příliš krátké.', 422, 'full_name');
if (strlen($pass) < 8)
  jsonErr('Heslo musí mít alespoň 8 znaků.', 422, 'password');

$id   = bin2hex(random_bytes(16));
$hash = password_hash($pass, PASSWORD_BCRYPT);

$row = [
  'id'         => $id,
  'email'      => $email,
  'nickname'   => $nickname,
  'full_name'  => $fullName,
  'password'   => $hash,
  'tier'       => 'free',
  'role'       => 'User',
  'created_at' => date('Y-m-d\TH:i:s\Z'),
];
$res = sb_insert($cfg, 'users', $row);

if (isset($res['error'])) {
  // Unique violation: PostgreSQL error code 23505
  if (($res['code'] ?? '') === '23505') {
    $detail = strtolower($res['error']);
    if (str_contains($detail, 'email'))    jsonErr('E-mail je již registrován.', 409, 'email');
    if (str_contains($detail, 'nickname')) jsonErr('Přezdívka je již obsazena.', 409, 'nickname');
    jsonErr('Účet s tímto e-mailem nebo přezdívkou již existuje.', 409);
  }
  jsonErr('Registrace selhala.', 500);
}

createSession($cfg, $id);
logActivity($cfg, $id, 'login', 'Registrace z IP: ' . $ip);

// Return safe user data
$cols = 'id,email,nickname,full_name,tier,role,avatar_url,level,xp,language';
$user = sb_find_one($cfg, 'users', ['id' => $id], $cols);
jsonOk(['user' => $user['data']], 201);
```

- [ ] **Step 2: Commit**

```bash
git add api/register.php
git commit -m "feat: add api/register.php with validation and unique constraint handling"
```

---

### Task 6: api/logout.php + api/me.php

**Files:**
- Create: `api/logout.php`
- Create: `api/me.php`

**Interfaces:**
- `logout.php`: POST → 204, clears cookie + DB session row
- `me.php`: GET → 200 `{user: {...}}` or 401

- [ ] **Step 1: Create api/logout.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
$cfg = auth_load_config();
beginJson($cfg);
destroySession($cfg);
jsonOk(null, 204);
```

- [ ] **Step 2: Create api/me.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';
$cfg  = auth_load_config();
beginJson($cfg);
$user = requireAuth($cfg);
jsonOk(['user' => $user]);
```

- [ ] **Step 3: Commit**

```bash
git add api/logout.php api/me.php
git commit -m "feat: add api/logout.php and api/me.php"
```

---

### Task 7: api/forgot-password.php + api/reset-password.php

**Files:**
- Create: `api/forgot-password.php`
- Create: `api/reset-password.php`

**Interfaces:**
- `forgot-password.php`: POST `{email}` → always 200 (don't reveal if email exists)
- `reset-password.php`: POST `{token, new_password}` → 200 or 400

- [ ] **Step 1: Create api/forgot-password.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

$ip = clientIp();
if (!checkRateLimit($cfg, $ip, 'forgot_password', 3, 60)) {
  logAttempt($cfg, $ip, 'forgot_password');
  jsonErr('Příliš mnoho pokusů. Zkuste to za hodinu.', 429);
}
logAttempt($cfg, $ip, 'forgot_password');

$body  = jsonBody();
$email = strtolower(trim((string)($body['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  jsonOk(['ok' => true]); // Don't reveal validation errors
}

$res = sb_find_one($cfg, 'users', ['email' => $email], 'id,email,full_name');
if (isset($res['data']) && $res['data'] !== null) {
  $user      = $res['data'];
  $rawToken  = bin2hex(random_bytes(32));
  $tokenHash = hash('sha256', $rawToken);
  $expires   = date('Y-m-d\TH:i:s\Z', time() + 3600);

  sb_update($cfg, 'users', ['id' => $user['id']], [
    'reset_token_hash'       => $tokenHash,
    'reset_token_expires_at' => $expires,
  ]);

  $link    = rtrim($cfg['APP_URL'], '/') . '/reset-password.html?token=' . rawurlencode($rawToken);
  $name    = $user['full_name'] ?? 'uživateli';
  $subject = 'Obnova hesla · vevit';
  $body_txt = "Dobrý den, {$name},\n\n"
    . "Pro obnovu hesla klikněte na odkaz níže (platný 1 hodinu):\n"
    . "{$link}\n\n"
    . "Pokud jste o obnovu hesla nežádali, tento e-mail ignorujte.\n\n"
    . "— Tým vevit";

  $headers = [
    "From: {$cfg['MAIL_FROM_NAME']} <{$cfg['MAIL_FROM']}>",
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
  ];

  // Use SMTP if configured, otherwise PHP mail()
  if (!empty($cfg['SMTP_HOST'])) {
    // WEDOS supports SMTP relay — implement via fsockopen or recommend PHPMailer
    // For now, fall through to mail() with a note
  }
  @mail($user['email'], $subject, $body_txt, implode("\r\n", $headers));
}

// Always return success — never reveal whether email exists
jsonOk(['ok' => true]);
```

- [ ] **Step 2: Create api/reset-password.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

$body      = jsonBody();
$rawToken  = (string)($body['token']        ?? '');
$newPass   = (string)($body['new_password'] ?? '');

if (strlen($rawToken) !== 64) jsonErr('Neplatný nebo expirovaný odkaz.');
if (strlen($newPass)  < 8)   jsonErr('Heslo musí mít alespoň 8 znaků.', 422, 'new_password');

$tokenHash = hash('sha256', $rawToken);
$now       = date('Y-m-d\TH:i:s\Z');

// Find user with valid token
$base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/users';
$qs   = [
  'reset_token_hash=eq.'       . rawurlencode($tokenHash),
  'reset_token_expires_at=gt.' . rawurlencode($now),
  'select=id',
  'limit=1',
];
$headers = [
  'apikey: '         . $cfg['SUPABASE_SERVICE_ROLE'],
  'Authorization: Bearer ' . $cfg['SUPABASE_SERVICE_ROLE'],
  'Accept: application/json',
];
$ch = curl_init($base . '?' . implode('&', $qs));
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 10]);
$raw  = curl_exec($ch);
$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$rows = json_decode((string)$raw, true);
if ($code !== 200 || empty($rows)) jsonErr('Neplatný nebo expirovaný odkaz.');

$userId  = $rows[0]['id'];
$newHash = password_hash($newPass, PASSWORD_BCRYPT);

// Update password, clear token
sb_update($cfg, 'users', ['id' => $userId], [
  'password'                => $newHash,
  'reset_token_hash'        => null,
  'reset_token_expires_at'  => null,
]);

// Revoke all sessions (force re-login everywhere)
sb_delete($cfg, 'sessions', ['user_id' => $userId]);

logActivity($cfg, $userId, 'password_change', 'Via password reset');
jsonOk(['ok' => true]);
```

- [ ] **Step 3: Commit**

```bash
git add api/forgot-password.php api/reset-password.php
git commit -m "feat: add forgot-password and reset-password endpoints"
```

---

### Task 8: login.html — remove Clerk, custom fetch flow

**Files:**
- Modify: `login.html` (full rewrite, keep visual style)

**Interfaces:**
- Calls `POST /api/login.php` with JSON `{email, password}`
- On success: `location.replace('./index.html')`
- Shows inline error in red box on 401/422/429

- [ ] **Step 1: Rewrite login.html**

```html
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Přihlášení · vevit</title>
<link rel="icon" href="./assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./assets/styles.css">
<style>
  .auth-wrap { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:28px; padding:32px 16px; background:var(--bg); }
  .auth-brand { display:flex; align-items:center; gap:10px; }
  .auth-card { width:100%; max-width:480px; background:var(--card); border:1px solid var(--card-border); border-radius:var(--r-card); padding:32px; display:flex; flex-direction:column; gap:20px; }
  .auth-title { font-size:20px; font-weight:700; margin:0 0 4px; }
  .auth-sub { font-size:13px; color:var(--text-3); margin:0; }
  .step { display:flex; flex-direction:column; gap:14px; }
  .step[hidden] { display:none; }
  .auth-error { background:#f9731620; border:1px solid #f9731660; border-radius:var(--r-control); padding:10px 14px; font-size:13px; color:#f97316; display:flex; align-items:center; gap:8px; }
  .auth-error[hidden] { display:none; }
  .auth-hint { font-size:13px; color:var(--text-3); text-align:center; }
  .auth-hint a { color:var(--primary); font-weight:500; }
  .back-btn { background:none; border:none; color:var(--text-3); font-size:13px; cursor:pointer; padding:0; text-align:left; display:flex; align-items:center; gap:6px; font-family:var(--font-sans); }
  .back-btn:hover { color:var(--text); }
</style>
</head>
<body>
<div class="auth-wrap">
  <div class="auth-brand">
    <div class="brand-mark">v</div>
    <span class="brand-name">vevit</span>
  </div>

  <div class="auth-card">
    <div>
      <h1 class="auth-title">Přihlaste se</h1>
      <p class="auth-sub">do svého vevit účtu</p>
    </div>

    <div class="auth-error" id="authErr" hidden>
      <span>⚠</span><span id="authErrMsg"></span>
    </div>

    <!-- Step 1: email -->
    <div class="step" id="stepEmail">
      <div>
        <label class="label" for="inputEmail">E-mailová adresa</label>
        <input id="inputEmail" class="input input--mono" type="email" autocomplete="email" placeholder="vas@email.cz">
      </div>
      <button id="btnContinue" class="btn btn--primary" style="justify-content:center;">Pokračovat</button>
    </div>

    <!-- Step 2: password -->
    <div class="step" id="stepPass" hidden>
      <button class="back-btn" id="btnBack">← <span id="backEmail"></span></button>
      <div>
        <label class="label" for="inputPass">Heslo</label>
        <input id="inputPass" class="input input--mono" type="password" autocomplete="current-password" placeholder="••••••••">
      </div>
      <div style="text-align:right;">
        <a href="./forgot-password.html" style="font-size:13px;">Zapomněli jste heslo?</a>
      </div>
      <button id="btnLogin" class="btn btn--primary" style="justify-content:center;">Přihlásit se</button>
    </div>
  </div>

  <p class="auth-hint">Nemáte účet? <a href="./register.html">Zaregistrovat se</a></p>
</div>
<script>
(function () {
  var stepEmail = document.getElementById('stepEmail');
  var stepPass  = document.getElementById('stepPass');
  var inputEmail = document.getElementById('inputEmail');
  var inputPass  = document.getElementById('inputPass');
  var btnContinue = document.getElementById('btnContinue');
  var btnBack     = document.getElementById('btnBack');
  var btnLogin    = document.getElementById('btnLogin');
  var authErr     = document.getElementById('authErr');
  var authErrMsg  = document.getElementById('authErrMsg');
  var backEmail   = document.getElementById('backEmail');

  function showErr(msg) { authErrMsg.textContent = msg; authErr.removeAttribute('hidden'); }
  function hideErr()    { authErr.setAttribute('hidden', ''); }
  function setLoading(btn, on) { btn.disabled = on; btn.textContent = on ? 'Načítám…' : btn.dataset.label; }

  btnContinue.dataset.label = 'Pokračovat';
  btnLogin.dataset.label    = 'Přihlásit se';

  btnContinue.addEventListener('click', function () {
    hideErr();
    var email = inputEmail.value.trim();
    if (!email) { showErr('Zadejte e-mailovou adresu.'); return; }
    backEmail.textContent = email;
    stepEmail.setAttribute('hidden', '');
    stepPass.removeAttribute('hidden');
    inputPass.focus();
  });

  btnBack.addEventListener('click', function () {
    hideErr();
    stepPass.setAttribute('hidden', '');
    stepEmail.removeAttribute('hidden');
    inputPass.value = '';
    inputEmail.focus();
  });

  inputEmail.addEventListener('keydown', function (e) { if (e.key === 'Enter') btnContinue.click(); });
  inputPass.addEventListener('keydown', function (e)  { if (e.key === 'Enter') btnLogin.click(); });

  btnLogin.addEventListener('click', function () {
    hideErr();
    var email = inputEmail.value.trim();
    var pass  = inputPass.value;
    if (!pass) { showErr('Zadejte heslo.'); return; }
    setLoading(btnLogin, true);
    fetch('./api/login.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass }),
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (res.ok) {
        location.replace('./index.html');
      } else {
        setLoading(btnLogin, false);
        showErr(res.data.error || 'Přihlášení selhalo.');
      }
    })
    .catch(function () {
      setLoading(btnLogin, false);
      showErr('Síťová chyba. Zkuste to znovu.');
    });
  });
}());
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add login.html
git commit -m "feat: replace Clerk login widget with custom two-step form"
```

---

### Task 9: register.html — remove Clerk, custom fetch flow

**Files:**
- Modify: `register.html` (full rewrite)

- [ ] **Step 1: Rewrite register.html**

```html
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Registrace · vevit</title>
<link rel="icon" href="./assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./assets/styles.css">
<style>
  .auth-wrap { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:28px; padding:32px 16px; background:var(--bg); }
  .auth-brand { display:flex; align-items:center; gap:10px; }
  .auth-card { width:100%; max-width:480px; background:var(--card); border:1px solid var(--card-border); border-radius:var(--r-card); padding:32px; display:flex; flex-direction:column; gap:20px; }
  .auth-title { font-size:20px; font-weight:700; margin:0 0 4px; }
  .auth-sub { font-size:13px; color:var(--text-3); margin:0; }
  .auth-error { background:#f9731620; border:1px solid #f9731660; border-radius:var(--r-control); padding:10px 14px; font-size:13px; color:#f97316; display:flex; align-items:center; gap:8px; }
  .auth-error[hidden] { display:none; }
  .auth-hint { font-size:13px; color:var(--text-3); text-align:center; }
  .auth-hint a { color:var(--primary); font-weight:500; }
</style>
</head>
<body>
<div class="auth-wrap">
  <div class="auth-brand">
    <div class="brand-mark">v</div>
    <span class="brand-name">vevit</span>
  </div>

  <div class="auth-card">
    <div>
      <h1 class="auth-title">Vytvořte účet</h1>
      <p class="auth-sub">Začněte na vevit zdarma</p>
    </div>

    <div class="auth-error" id="authErr" hidden>
      <span>⚠</span><span id="authErrMsg"></span>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label class="label" for="inpName">Jméno a příjmení</label>
        <input id="inpName" class="input" type="text" autocomplete="name" placeholder="Jan Novák">
      </div>
      <div>
        <label class="label" for="inpNick">Přezdívka</label>
        <input id="inpNick" class="input input--mono" type="text" autocomplete="username" placeholder="jannovak">
      </div>
      <div>
        <label class="label" for="inpEmail">E-mail</label>
        <input id="inpEmail" class="input input--mono" type="email" autocomplete="email" placeholder="jan@email.cz">
      </div>
      <div>
        <label class="label" for="inpPass">Heslo <span style="color:var(--text-3);font-size:11px;">(min. 8 znaků)</span></label>
        <input id="inpPass" class="input input--mono" type="password" autocomplete="new-password" placeholder="••••••••">
      </div>
      <button id="btnRegister" class="btn btn--primary" style="justify-content:center;margin-top:4px;">Zaregistrovat se</button>
    </div>
  </div>

  <p class="auth-hint">Máte účet? <a href="./login.html">Přihlásit se</a></p>
</div>
<script>
(function () {
  var btnReg    = document.getElementById('btnRegister');
  var authErr   = document.getElementById('authErr');
  var authErrMsg = document.getElementById('authErrMsg');

  function showErr(msg) { authErrMsg.textContent = msg; authErr.removeAttribute('hidden'); }
  function hideErr()    { authErr.setAttribute('hidden', ''); }

  btnReg.addEventListener('click', function () {
    hideErr();
    var name  = document.getElementById('inpName').value.trim();
    var nick  = document.getElementById('inpNick').value.trim();
    var email = document.getElementById('inpEmail').value.trim();
    var pass  = document.getElementById('inpPass').value;

    if (!name)  { showErr('Zadejte své jméno.'); return; }
    if (!nick)  { showErr('Zadejte přezdívku.'); return; }
    if (!email) { showErr('Zadejte e-mail.'); return; }
    if (pass.length < 8) { showErr('Heslo musí mít alespoň 8 znaků.'); return; }

    btnReg.disabled = true;
    btnReg.textContent = 'Registruji…';

    fetch('./api/register.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, nickname: nick, full_name: name, password: pass }),
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (res.ok) {
        location.replace('./index.html');
      } else {
        btnReg.disabled = false;
        btnReg.textContent = 'Zaregistrovat se';
        showErr(res.data.error || 'Registrace selhala.');
      }
    })
    .catch(function () {
      btnReg.disabled = false;
      btnReg.textContent = 'Zaregistrovat se';
      showErr('Síťová chyba. Zkuste to znovu.');
    });
  });

  document.getElementById('inpPass').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') btnReg.click();
  });
}());
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add register.html
git commit -m "feat: replace Clerk register widget with custom form"
```

---

### Task 10: forgot-password.html + reset-password.html

**Files:**
- Create: `forgot-password.html`
- Create: `reset-password.html`

- [ ] **Step 1: Create forgot-password.html**

```html
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Obnova hesla · vevit</title>
<link rel="icon" href="./assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./assets/styles.css">
<style>
  .auth-wrap { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:28px; padding:32px 16px; background:var(--bg); }
  .auth-brand { display:flex; align-items:center; gap:10px; }
  .auth-card { width:100%; max-width:480px; background:var(--card); border:1px solid var(--card-border); border-radius:var(--r-card); padding:32px; display:flex; flex-direction:column; gap:20px; }
  .auth-title { font-size:20px; font-weight:700; margin:0 0 4px; }
  .auth-sub { font-size:13px; color:var(--text-3); margin:0; }
  .auth-error { background:#f9731620; border:1px solid #f9731660; border-radius:var(--r-control); padding:10px 14px; font-size:13px; color:#f97316; }
  .auth-error[hidden] { display:none; }
  .auth-ok { background:#10b98120; border:1px solid #10b98160; border-radius:var(--r-control); padding:10px 14px; font-size:13px; color:#10b981; }
  .auth-ok[hidden] { display:none; }
</style>
</head>
<body>
<div class="auth-wrap">
  <div class="auth-brand">
    <div class="brand-mark">v</div>
    <span class="brand-name">vevit</span>
  </div>
  <div class="auth-card">
    <div>
      <h1 class="auth-title">Zapomenuté heslo</h1>
      <p class="auth-sub">Zadejte svůj e-mail a pošleme vám odkaz pro obnovu hesla.</p>
    </div>
    <div class="auth-error" id="authErr" hidden></div>
    <div class="auth-ok" id="authOk" hidden>E-mail odeslán. Zkontrolujte schránku (případně složku Spam).</div>
    <div id="formWrap" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label class="label" for="inpEmail">E-mailová adresa</label>
        <input id="inpEmail" class="input input--mono" type="email" autocomplete="email" placeholder="vas@email.cz">
      </div>
      <button id="btnSend" class="btn btn--primary" style="justify-content:center;">Odeslat odkaz</button>
      <a href="./login.html" style="font-size:13px;text-align:center;">← Zpět na přihlášení</a>
    </div>
  </div>
</div>
<script>
(function () {
  var btn = document.getElementById('btnSend');
  var authErr = document.getElementById('authErr');
  var authOk  = document.getElementById('authOk');
  var formWrap = document.getElementById('formWrap');

  btn.addEventListener('click', function () {
    authErr.setAttribute('hidden', '');
    var email = document.getElementById('inpEmail').value.trim();
    if (!email) { authErr.textContent = 'Zadejte e-mail.'; authErr.removeAttribute('hidden'); return; }
    btn.disabled = true;
    btn.textContent = 'Odesílám…';
    fetch('./api/forgot-password.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    })
    .then(function (r) { return r.json(); })
    .then(function () {
      formWrap.setAttribute('hidden', '');
      authOk.removeAttribute('hidden');
    })
    .catch(function () {
      btn.disabled = false;
      btn.textContent = 'Odeslat odkaz';
      authErr.textContent = 'Síťová chyba.';
      authErr.removeAttribute('hidden');
    });
  });
}());
</script>
</body>
</html>
```

- [ ] **Step 2: Create reset-password.html**

```html
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nové heslo · vevit</title>
<link rel="icon" href="./assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./assets/styles.css">
<style>
  .auth-wrap { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:28px; padding:32px 16px; background:var(--bg); }
  .auth-brand { display:flex; align-items:center; gap:10px; }
  .auth-card { width:100%; max-width:480px; background:var(--card); border:1px solid var(--card-border); border-radius:var(--r-card); padding:32px; display:flex; flex-direction:column; gap:20px; }
  .auth-title { font-size:20px; font-weight:700; margin:0 0 4px; }
  .auth-error { background:#f9731620; border:1px solid #f9731660; border-radius:var(--r-control); padding:10px 14px; font-size:13px; color:#f97316; }
  .auth-error[hidden] { display:none; }
  .auth-ok { background:#10b98120; border:1px solid #10b98160; border-radius:var(--r-control); padding:10px 14px; font-size:13px; color:#10b981; }
  .auth-ok[hidden] { display:none; }
</style>
</head>
<body>
<div class="auth-wrap">
  <div class="auth-brand">
    <div class="brand-mark">v</div>
    <span class="brand-name">vevit</span>
  </div>
  <div class="auth-card">
    <h1 class="auth-title">Nastavit nové heslo</h1>
    <div class="auth-error" id="authErr" hidden></div>
    <div class="auth-ok" id="authOk" hidden>Heslo změněno. <a href="./login.html">Přihlaste se</a>.</div>
    <div id="formWrap" style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label class="label" for="inpPass">Nové heslo <span style="color:var(--text-3);font-size:11px;">(min. 8 znaků)</span></label>
        <input id="inpPass" class="input input--mono" type="password" autocomplete="new-password" placeholder="••••••••">
      </div>
      <div>
        <label class="label" for="inpPass2">Potvrdit heslo</label>
        <input id="inpPass2" class="input input--mono" type="password" autocomplete="new-password" placeholder="••••••••">
      </div>
      <button id="btnSet" class="btn btn--primary" style="justify-content:center;">Nastavit heslo</button>
    </div>
  </div>
</div>
<script>
(function () {
  var params = new URLSearchParams(location.search);
  var token  = params.get('token') || '';
  var btn    = document.getElementById('btnSet');
  var authErr = document.getElementById('authErr');
  var authOk  = document.getElementById('authOk');
  var formWrap = document.getElementById('formWrap');

  if (!token) {
    authErr.textContent = 'Neplatný odkaz. Požádejte o nový.';
    authErr.removeAttribute('hidden');
    formWrap.setAttribute('hidden', '');
  }

  btn.addEventListener('click', function () {
    authErr.setAttribute('hidden', '');
    var p1 = document.getElementById('inpPass').value;
    var p2 = document.getElementById('inpPass2').value;
    if (p1.length < 8) { authErr.textContent = 'Heslo musí mít alespoň 8 znaků.'; authErr.removeAttribute('hidden'); return; }
    if (p1 !== p2) { authErr.textContent = 'Hesla se neshodují.'; authErr.removeAttribute('hidden'); return; }
    btn.disabled = true;
    btn.textContent = 'Ukládám…';
    fetch('./api/reset-password.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, new_password: p1 }),
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (res.ok) {
        formWrap.setAttribute('hidden', '');
        authOk.removeAttribute('hidden');
      } else {
        btn.disabled = false;
        btn.textContent = 'Nastavit heslo';
        authErr.textContent = res.data.error || 'Chyba.';
        authErr.removeAttribute('hidden');
      }
    })
    .catch(function () {
      btn.disabled = false;
      btn.textContent = 'Nastavit heslo';
      authErr.textContent = 'Síťová chyba.';
      authErr.removeAttribute('hidden');
    });
  });
}());
</script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add forgot-password.html reset-password.html
git commit -m "feat: add forgot-password and reset-password pages"
```

---

### Task 11: api/profile-update.php + api/change-password.php

**Files:**
- Create: `api/profile-update.php`
- Create: `api/change-password.php`

**Interfaces:**
- `profile-update.php`: PATCH, requires auth → updates `users` row, returns updated user
- `change-password.php`: POST `{current_password, new_password}`, requires auth → 200 or 401

- [ ] **Step 1: Create api/profile-update.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'PATCH' && $_SERVER['REQUEST_METHOD'] !== 'POST')
  jsonErr('Method not allowed', 405);

$user = requireAuth($cfg);
$body = jsonBody();

// Allowed writable fields (whitelist)
$allowed = [
  'nickname', 'full_name', 'bio', 'phone', 'location', 'birth_date', 'avatar_url',
  'company_name', 'ico', 'dic', 'billing_address', 'language',
];
$patch = [];
foreach ($allowed as $field) {
  if (array_key_exists($field, $body)) {
    $val = $body[$field];
    $patch[$field] = is_string($val) ? trim($val) : $val;
  }
}

if (empty($patch)) jsonErr('No valid fields to update.', 422);

// Nickname uniqueness check (if nickname is being changed)
if (isset($patch['nickname']) && $patch['nickname'] !== $user['nickname']) {
  $nick = $patch['nickname'];
  if (strlen($nick) < 3 || strlen($nick) > 30 || !preg_match('/^[a-z0-9_\-]+$/i', $nick))
    jsonErr('Přezdívka musí mít 3–30 znaků (písmena, čísla, _, -).', 422, 'nickname');
  $exists = sb_find_one($cfg, 'users', ['nickname' => $nick], 'id');
  if (($exists['data'] ?? null) !== null && $exists['data']['id'] !== $user['id'])
    jsonErr('Přezdívka je již obsazena.', 409, 'nickname');
}

$res = sb_update($cfg, 'users', ['id' => $user['id']], $patch);
if (isset($res['error'])) {
  if (($res['code'] ?? '') === '23505') jsonErr('Přezdívka je již obsazena.', 409, 'nickname');
  jsonErr('Uložení selhalo.', 500);
}
jsonOk(['ok' => true, 'user' => $res['data'][0] ?? null]);
```

- [ ] **Step 2: Create api/change-password.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

$user = requireAuth($cfg);
$body = jsonBody();

$currentPass = (string)($body['current_password'] ?? '');
$newPass     = (string)($body['new_password']     ?? '');

if (strlen($newPass) < 8) jsonErr('Nové heslo musí mít alespoň 8 znaků.', 422, 'new_password');

// Fetch current password hash
$res = sb_find_one($cfg, 'users', ['id' => $user['id']], 'password');
if (!isset($res['data']['password'])) jsonErr('Chyba serveru.', 500);

if (!password_verify($currentPass, $res['data']['password']))
  jsonErr('Současné heslo je nesprávné.', 401, 'current_password');

$newHash = password_hash($newPass, PASSWORD_BCRYPT);
sb_update($cfg, 'users', ['id' => $user['id']], ['password' => $newHash]);

logActivity($cfg, $user['id'], 'password_change', 'Via settings');
jsonOk(['ok' => true]);
```

- [ ] **Step 3: Commit**

```bash
git add api/profile-update.php api/change-password.php
git commit -m "feat: add profile-update and change-password endpoints"
```

---

### Task 12: api/sessions-list.php + api/sessions-revoke.php

**Files:**
- Create: `api/sessions-list.php`
- Create: `api/sessions-revoke.php`

**Interfaces:**
- `sessions-list.php`: GET → `{sessions: [{id, created_at, expires_at, is_current: bool}]}`
- `sessions-revoke.php`: POST `{session_id?: string, all_others?: bool}` → 200

- [ ] **Step 1: Create api/sessions-list.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
$user = requireAuth($cfg);

$currentToken = $_COOKIE[COOKIE_NAME] ?? '';
$now = date('Y-m-d\TH:i:s\Z');

$res = sb_get($cfg, 'sessions',
  ['user_id' => $user['id']],
  'id,session_token,created_at,expires_at'
);
if (isset($res['error'])) jsonErr('Chyba načítání relací.', 500);

$rows = array_filter($res['data'] ?? [], fn($s) => $s['expires_at'] > $now);
$rows = array_map(function ($s) use ($currentToken) {
  return [
    'id'         => $s['id'],
    'created_at' => $s['created_at'],
    'expires_at' => $s['expires_at'],
    'is_current' => $s['session_token'] === $currentToken,
  ];
}, array_values($rows));

jsonOk(['sessions' => $rows, 'count' => count($rows)]);
```

- [ ] **Step 2: Create api/sessions-revoke.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);
$user = requireAuth($cfg);
$body = jsonBody();

$currentToken = $_COOKIE[COOKIE_NAME] ?? '';

if (!empty($body['all_others'])) {
  // Delete all sessions for this user EXCEPT the current one
  // PostgREST: can't do "neq" easily in sb_delete, use raw query
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/sessions';
  $qs   = [
    'user_id=eq.'       . rawurlencode($user['id']),
    'session_token=neq.' . rawurlencode($currentToken),
  ];
  $headers = [
    'apikey: '         . $cfg['SUPABASE_SERVICE_ROLE'],
    'Authorization: Bearer ' . $cfg['SUPABASE_SERVICE_ROLE'],
  ];
  $ch = curl_init($base . '?' . implode('&', $qs));
  curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => 'DELETE', CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 10]);
  curl_exec($ch); curl_close($ch);
  logActivity($cfg, $user['id'], 'session_revoke', 'All other sessions');
  jsonOk(['ok' => true]);
}

$sessionId = (string)($body['session_id'] ?? '');
if (!$sessionId) jsonErr('session_id required.');

// Verify this session belongs to the current user, then delete
$res = sb_find_one($cfg, 'sessions', ['id' => $sessionId], 'user_id,session_token');
if (!isset($res['data']) || $res['data'] === null) jsonErr('Relace nenalezena.', 404);
if ($res['data']['user_id'] !== $user['id']) jsonErr('Forbidden', 403);
if ($res['data']['session_token'] === $currentToken) jsonErr('Nemůžete zrušit aktuální relaci.', 422);

sb_delete($cfg, 'sessions', ['id' => $sessionId]);
logActivity($cfg, $user['id'], 'session_revoke', 'Session ' . substr($sessionId, 0, 8));
jsonOk(['ok' => true]);
```

- [ ] **Step 3: Commit**

```bash
git add api/sessions-list.php api/sessions-revoke.php
git commit -m "feat: add sessions-list and sessions-revoke endpoints"
```

---

### Task 13: api/subscription.php

**Files:**
- Create: `api/subscription.php`

**Interfaces:**
- GET → `{subscription: {...} | null, price: {...} | null, history: [...]}`

- [ ] **Step 1: Create api/subscription.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
$user = requireAuth($cfg);

// Active subscription: status=active OR most recent
$res = sb_get($cfg, 'premium_subscriptions',
  ['user_id' => $user['id']],
  'id,tier,billing_cycle,price,started_at,expires_at,auto_renew,payment_method,payment_id,status',
  50  // get all to sort
);
$rows = $res['data'] ?? [];

// Sort by started_at desc
usort($rows, fn($a, $b) => strcmp($b['started_at'], $a['started_at']));

$active  = null;
$history = [];
foreach ($rows as $r) {
  if ($r['status'] === 'active' && $active === null) {
    $active = $r;
    // Strip full payment_id, keep only last 4 chars for display
    if (!empty($active['payment_id']) && strlen($active['payment_id']) > 4) {
      $active['payment_id_last4'] = substr($active['payment_id'], -4);
      unset($active['payment_id']);
    }
  } else {
    // History — also sanitize payment_id
    if (!empty($r['payment_id']) && strlen($r['payment_id']) > 4) {
      $r['payment_id_last4'] = substr($r['payment_id'], -4);
      unset($r['payment_id']);
    }
    $history[] = $r;
  }
}

// Price from tier_prices
$price = null;
if ($active) {
  $priceRes = sb_get($cfg, 'tier_prices',
    ['tier' => $active['tier'], 'billing_cycle' => $active['billing_cycle']],
    'price_czk', 1
  );
  $price = $priceRes['data'][0] ?? null;
}

jsonOk(['subscription' => $active, 'price' => $price, 'history' => $history]);
```

- [ ] **Step 2: Commit**

```bash
git add api/subscription.php
git commit -m "feat: add subscription endpoint (active + history)"
```

---

### Task 14: api/notifications.php

**Files:**
- Create: `api/notifications.php`

**Interfaces:**
- GET → `{prefs: {security_alerts, product_updates, marketing, billing_summary}}`
- PATCH `{key: value}` → `{ok: true, prefs: {...}}`

- [ ] **Step 1: Create api/notifications.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg    = auth_load_config();
beginJson($cfg);
$user   = requireAuth($cfg);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $res = sb_find_one($cfg, 'user_notification_prefs', ['user_id' => $user['id']], '*');
  if (isset($res['error']) && $res['error'] !== 'not_found') jsonErr('Chyba serveru.', 500);
  $prefs = $res['data'] ?? [
    'security_alerts'  => true,
    'product_updates'  => true,
    'marketing'        => false,
    'billing_summary'  => true,
  ];
  jsonOk(['prefs' => $prefs]);
}

if ($method === 'PATCH' || $method === 'POST') {
  $body   = jsonBody();
  $allowed = ['product_updates', 'marketing', 'billing_summary'];
  $patch  = ['user_id' => $user['id']];
  foreach ($allowed as $k) {
    if (array_key_exists($k, $body)) $patch[$k] = (bool)$body[$k];
  }
  // Upsert
  $existing = sb_find_one($cfg, 'user_notification_prefs', ['user_id' => $user['id']], 'user_id');
  if (($existing['data'] ?? null) === null) {
    $defaults = ['security_alerts' => true, 'product_updates' => true, 'marketing' => false, 'billing_summary' => true];
    $insert = array_merge($defaults, $patch);
    $res = sb_insert($cfg, 'user_notification_prefs', $insert);
  } else {
    $res = sb_update($cfg, 'user_notification_prefs', ['user_id' => $user['id']], $patch);
  }
  if (isset($res['error'])) jsonErr('Uložení selhalo.', 500);
  jsonOk(['ok' => true]);
}

jsonErr('Method not allowed', 405);
```

- [ ] **Step 2: Commit**

```bash
git add api/notifications.php
git commit -m "feat: add notifications GET/PATCH endpoint"
```

---

### Task 15: api/export-data.php + api/delete-account.php (rewrites)

**Files:**
- Modify: `api/export-data.php` (full rewrite)
- Modify: `api/delete-account.php` (full rewrite)

- [ ] **Step 1: Rewrite api/export-data.php**

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
$user = requireAuth($cfg);
$uid  = $user['id'];

function fetchTable(array $cfg, string $table, string $col, string $uid): array {
  $res = sb_get($cfg, $table, [$col => $uid], '*', 1000);
  return $res['data'] ?? [];
}

// Tables with FK on users.id (expand as you add more)
$tables = [
  'premium_subscriptions', 'cal_events', 'cal_reminders',
  'certificates', 'lesson_comments', 'games_stats',
  'store_orders', 'daily_bonus_log', 'ai_usage_log',
  'sessions', 'login_attempts', 'account_activity',
  'user_notification_prefs',
];

$export = ['user' => $user, 'exported_at' => date('c')];
foreach ($tables as $t) {
  $fk = ($t === 'login_attempts') ? 'ip_address' : 'user_id';
  // login_attempts is by IP, not user_id — skip for privacy reasons
  if ($t === 'login_attempts') { $export[$t] = []; continue; }
  $export[$t] = fetchTable($cfg, $t, 'user_id', $uid);
}

header('Content-Type: application/json');
header('Content-Disposition: attachment; filename="vevit-export-' . date('Y-m-d') . '.json"');
exit(json_encode($export, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
```

- [ ] **Step 2: Rewrite api/delete-account.php** (uses Supabase RPC instead of Clerk API)

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/auth-helpers.php';

$cfg  = auth_load_config();
beginJson($cfg);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonErr('Method not allowed', 405);

$user = requireAuth($cfg);
$uid  = $user['id'];

// Clear session cookie BEFORE deleting account (so requireAuth can't be replayed)
destroySession($cfg);

// Call the Postgres RPC function that deletes in correct FK order
$res = sb_rpc($cfg, 'delete_user_account', ['target_id' => $uid]);

if (isset($res['error'])) {
  error_log('delete_user_account RPC failed for ' . $uid . ': ' . $res['error']);
  jsonErr('Smazání selhalo. Kontaktujte podporu.', 500);
}

jsonOk(null, 204);
```

- [ ] **Step 3: Commit**

```bash
git add api/export-data.php api/delete-account.php
git commit -m "feat: rewrite export-data and delete-account (Clerk removed, Supabase RPC)"
```

---

### Task 16: index.html + assets/app.js full rewrite

**Files:**
- Modify: `index.html` (remove Clerk/Supabase CDN, new boot)
- Modify: `assets/app.js` (full rewrite — no Clerk, fetch + cookie)
- Modify: `assets/config.js` (remove CLERK_PUBLISHABLE_KEY)

**Boot flow change:** Old: load Clerk CDN → clerk.load() → check user. New: `fetch('./api/me.php', {credentials:'same-origin'})` → 401 → show gate → redirect to login.html; 200 → show app.

- [ ] **Step 1: Update assets/config.js** — remove Clerk key (keep Supabase if any direct JS calls remain, otherwise simplify)

```javascript
// Public browser config. No secrets here.
var CONFIG = {
  API_BASE: './api',
};
```

- [ ] **Step 2: Update index.html** — remove all CDN scripts, add simple boot

Replace the bottom `<script>` block (lines 367–402) with:
```html
<!-- config -->
<script src="./assets/config.js"></script>
<script src="./assets/app.js"></script>
```

Remove `data-clerk-publishable-key` attribute from any remaining script tags.
Remove the splash/gate Clerk references in the HTML (keep the HTML structure — gate card, signInBtn — just remove the Clerk wording).

- [ ] **Step 3: Rewrite assets/app.js**

Full rewrite. Remove all `clerk.*` references. Replace with `api()` fetch calls that use `credentials: 'same-origin'` (cookie auth).

Key changes from original:
- `boot()`: call `GET /api/me.php` instead of `clerk.load()`
- `hydrateIdentity(user)`: receives user object from me.php instead of `clerk.user`
- `saveProfile()`: calls `PATCH /api/profile-update.php`
- `savePassword()`: calls `POST /api/change-password.php`
- `loadSessions()`: calls `GET /api/sessions-list.php`
- `revokeSession(id)`: calls `POST /api/sessions-revoke.php` with `{session_id: id}`
- `logoutAllOthers()`: calls `POST /api/sessions-revoke.php` with `{all_others: true}`
- `loadPreferences()`: split into `loadSubscription()` + `loadNotifications()`
- `loadSubscription()`: calls `GET /api/subscription.php`
- `loadNotifications()`: calls `GET /api/notifications.php`
- `toggleNotification(el)`: calls `PATCH /api/notifications.php`
- `saveLocale()`: calls `PATCH /api/profile-update.php` with `{language}`
- `confirmDelete()`: calls `POST /api/delete-account.php`, then `location.replace('./login.html')`
- `exportData()`: calls `GET /api/export-data.php` with `credentials:'same-origin'`, triggers download
- `loadConnections()`: shows static TODO/disabled state (OAuth TODO)
- Removed: all `clerk.*` API calls, `window.Clerk`, `window.supabase`, Supabase RLS, 2FA TOTP (TODO)
- Removed: `on2FAToggleClick()`, `open2FAModal()`, `confirm2FA()` — mark toggle disabled with tooltip

```javascript
(function () {
'use strict';

const $ = (id) => document.getElementById(id);
const show = (el) => el && el.removeAttribute('hidden');
const hide = (el) => el && el.setAttribute('hidden', '');

function status(el, msg, kind) {
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'status' + (kind ? ' status--' + kind : '');
  if (msg && kind === 'ok') setTimeout(() => { el.textContent = ''; }, 2500);
}

async function api(path, { method = 'GET', body } = {}) {
  const opts = {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('./api/' + path, opts);
  if (res.status === 401) { location.replace('./login.html'); throw new Error('401'); }
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API ${path} → ${res.status}`);
  }
  return res.json();
}

let currentUser = null;

async function boot() {
  try {
    const data = await api('me.php');
    currentUser = data.user;
    renderSignedIn();
  } catch (e) {
    if (e.message === '401') return; // already redirected
    $('splash').textContent = 'Načtení selhalo. ' + (e.message || '');
  }
}

function renderSignedIn() {
  hide($('splash')); hide($('gate')); show($('app'));
  hydrateIdentity(currentUser);
  wireOnce();
  loadSessions();
  loadSubscription();
  loadNotifications();
  loadOverview();
}

function hydrateIdentity(u) {
  const name   = u.full_name || u.nickname || '—';
  const email  = u.email || '—';
  const avatar = u.avatar_url || '';

  $('hdrName').textContent  = name;
  $('hdrEmail').textContent = email;
  if (avatar) $('hdrAvatar').src = avatar;

  $('profName').value  = u.full_name  || '';
  $('profEmail').value = email;
  if ($('profNickname')) $('profNickname').value = u.nickname || '';
  if (avatar) $('profAvatar').src = avatar;

  $('deleteEmailHint').textContent  = email;
  $('deleteConfirm').placeholder    = email;

  // 2FA — disabled until TOTP is implemented
  $('toggle2FA').disabled = true;
  $('toggle2FA').title    = '2FA bude brzy k dispozici';
  $('ov2fa').textContent  = '—';
  $('pwdMeta').textContent = 'Vlastní heslo';
}

// ── Profile ──────────────────────────────────────────────────────────────────
async function saveProfile() {
  const btn = $('saveProfileBtn');
  btn.disabled = true;
  status($('profStatus'), 'Ukládání…');
  try {
    const patch = { full_name: $('profName').value.trim() };
    if ($('profNickname')) patch.nickname = $('profNickname').value.trim();
    if ($('profBio'))      patch.bio      = $('profBio').value.trim();
    if ($('profPhone'))    patch.phone    = $('profPhone').value.trim();
    if ($('profLocation')) patch.location = $('profLocation').value.trim();
    await api('profile-update.php', { method: 'PATCH', body: patch });
    status($('profStatus'), 'Uloženo ✓', 'ok');
  } catch (e) {
    status($('profStatus'), e.message || 'Uložení selhalo', 'err');
  } finally {
    btn.disabled = false;
  }
}

// ── Sessions ──────────────────────────────────────────────────────────────────
async function loadSessions() {
  const box = $('sessionRows');
  try {
    const data = await api('sessions-list.php');
    const sessions = data.sessions || [];
    $('ovSessions').textContent = String(sessions.length);
    if (!sessions.length) {
      box.innerHTML = '<div class="empty">Žádné aktivní relace</div>';
      return;
    }
    box.innerHTML = sessions.map(renderSession).join('');
    box.querySelectorAll('[data-revoke]').forEach((b) =>
      b.addEventListener('click', () => revokeSession(b.dataset.revoke)));
  } catch (e) {
    box.innerHTML = '<div class="empty">Relace nelze načíst</div>';
  }
}

function renderSession(s) {
  const d = new Date(s.created_at).toLocaleDateString('cs-CZ');
  return `<div class="row">
    <div>
      <div class="row-title">Relace${s.is_current ? ' <span class="badge badge--ok">Tato relace</span>' : ''}</div>
      <div class="row-sub row-sub--mono">Vytvořena ${esc(d)} · vyprší ${esc(new Date(s.expires_at).toLocaleDateString('cs-CZ'))}</div>
    </div>
    ${s.is_current ? '' : `<button class="btn btn--ghost btn--sm" data-revoke="${esc(s.id)}" style="color:var(--warn);">Odhlásit</button>`}
  </div>`;
}

async function revokeSession(id) {
  try { await api('sessions-revoke.php', { method: 'POST', body: { session_id: id } }); loadSessions(); }
  catch (e) { console.error(e); }
}

async function logoutAllOthers() {
  try { await api('sessions-revoke.php', { method: 'POST', body: { all_others: true } }); loadSessions(); }
  catch (e) { console.error(e); }
}

// ── Subscription ─────────────────────────────────────────────────────────────
async function loadSubscription() {
  try {
    const data = await api('subscription.php');
    const sub  = data.subscription;
    if (!sub) {
      $('ovPlanLine').textContent = 'Žádné aktivní předplatné';
      return;
    }
    const tierLabel = sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1);
    const exp = sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('cs-CZ') : '—';
    const priceCzk = data.price?.price_czk ?? '?';
    $('ovPlanLine').textContent = `${priceCzk} Kč / ${sub.billing_cycle === 'yearly' ? 'rok' : 'měsíc'} · další platba ${exp}`;
    // Update billing card
    if ($('payBrand') && sub.payment_method) {
      $('payBrand').textContent = sub.payment_method || '—';
    }
    if ($('payLast4') && sub.payment_id_last4) {
      $('payLast4').textContent = sub.payment_id_last4;
    }
    // Invoice history
    const list = $('invoiceList');
    if (list && data.history && data.history.length) {
      const rows = data.history.map((h) => {
        const d = new Date(h.started_at).toLocaleDateString('cs-CZ');
        return `<div class="inv-row"><span>${esc(d)}</span><span>${esc(String(h.price))} Kč</span><span>${esc(h.status)}</span><span></span></div>`;
      }).join('');
      list.innerHTML = `<div class="inv-head"><span>Datum</span><span>Částka</span><span>Stav</span><span></span></div>` + rows;
    }
  } catch (e) { console.error('subscription load failed', e); }
}

// ── Notifications ─────────────────────────────────────────────────────────────
async function loadNotifications() {
  try {
    const data  = await api('notifications.php');
    const prefs = data.prefs || {};
    document.querySelectorAll('.notif-toggle').forEach((t) => {
      setToggle(t, !!prefs[t.dataset.key]);
    });
  } catch (e) { console.error('notifications load failed', e); }
}

async function toggleNotification(el) {
  const key = el.dataset.key;
  const on  = !el.classList.contains('is-on');
  setToggle(el, on);
  try {
    await api('notifications.php', { method: 'PATCH', body: { [key]: on } });
  } catch (e) { console.error(e); setToggle(el, !on); }
}

// ── Billing info ──────────────────────────────────────────────────────────────
async function saveBillingInfo() {
  const btn = $('saveBillingInfoBtn');
  btn.disabled = true;
  status($('biStatus'), 'Ukládání…');
  try {
    await api('profile-update.php', { method: 'PATCH', body: {
      company_name:    $('biCompany').value.trim(),
      ico:             $('biIco').value.trim(),
      dic:             $('biDic').value.trim(),
      billing_address: $('biAddr').value.trim(),
    }});
    status($('biStatus'), 'Uloženo ✓', 'ok');
  } catch (e) {
    status($('biStatus'), e.message || 'Uložení selhalo', 'err');
  } finally { btn.disabled = false; }
}

// ── Locale ────────────────────────────────────────────────────────────────────
async function saveLocale() {
  const btn = $('saveLocaleBtn');
  btn.disabled = true;
  status($('locStatus'), 'Ukládání…');
  try {
    await api('profile-update.php', { method: 'PATCH', body: { language: $('locLang').value } });
    status($('locStatus'), 'Uloženo ✓', 'ok');
  } catch (e) {
    status($('locStatus'), e.message || 'Uložení selhalo', 'err');
  } finally { btn.disabled = false; }
}

// ── Password ──────────────────────────────────────────────────────────────────
async function savePassword() {
  const err = $('pwdError');
  const fail = (m) => { err.textContent = m; show(err); };
  hide(err);
  const cur = $('pwdCurrent').value;
  const nw  = $('pwdNew').value;
  const cf  = $('pwdConfirm').value;
  if (nw.length < 8) return fail('Nové heslo musí mít alespoň 8 znaků.');
  if (nw !== cf)     return fail('Hesla se neshodují.');
  try {
    await api('change-password.php', { method: 'POST', body: { current_password: cur, new_password: nw } });
    closeModal('pwdModal');
    ['pwdCurrent', 'pwdNew', 'pwdConfirm'].forEach((id) => { $(id).value = ''; });
  } catch (e) {
    fail(e.message || 'Změna hesla selhala.');
  }
}

// ── Overview ──────────────────────────────────────────────────────────────────
async function loadOverview() {
  const box = $('ovActivity');
  try {
    const res = await api('sessions-list.php');
    $('ovSessions').textContent = String((res.sessions || []).length);
  } catch {}
  // Activity feed — optional, requires account_activity table
  try {
    const res = await fetch('./api/export-data.php?_activity=1', { credentials: 'same-origin' });
    // TODO: add dedicated /api/activity.php endpoint for the overview feed
    box.innerHTML = '<div class="empty">Aktivita brzy k dispozici</div>';
  } catch {
    box.innerHTML = '<div class="empty">Aktivita brzy k dispozici</div>';
  }
}

// ── Connected accounts ────────────────────────────────────────────────────────
function loadConnections() {
  $('connectionRows').innerHTML =
    '<div class="empty">Propojení s Google/GitHub bude k dispozici v příští verzi.</div>';
}

// ── Delete account ────────────────────────────────────────────────────────────
async function confirmDelete() {
  const btn = $('confirmDeleteBtn');
  btn.disabled = true;
  try {
    await api('delete-account.php', { method: 'POST' });
    location.replace('./login.html');
  } catch (e) {
    btn.disabled = false;
    alert('Smazání selhalo: ' + e.message);
  }
}

// ── Export ────────────────────────────────────────────────────────────────────
async function exportData() {
  try {
    const res  = await fetch('./api/export-data.php', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'vevit-data-export.json';
    a.click();
  } catch (e) { alert('Export selhal: ' + e.message); }
}

// ── UI wiring ─────────────────────────────────────────────────────────────────
let wired = false;
function wireOnce() {
  if (wired) return;
  wired = true;

  $('tabs').addEventListener('click', (e) => {
    const t = e.target.closest('.tab');
    if (t) switchTab(t.dataset.tab);
  });
  document.querySelectorAll('[data-goto]').forEach((b) =>
    b.addEventListener('click', () => switchTab(b.dataset.goto)));

  $('signOutBtn').addEventListener('click', async () => {
    await api('logout.php', { method: 'POST' }).catch(() => {});
    location.replace('./login.html');
  });
  const signInBtn = $('signInBtn');
  if (signInBtn) signInBtn.addEventListener('click', () => { location.href = './login.html'; });

  $('saveProfileBtn').addEventListener('click', saveProfile);

  // Avatar remove — clear URL in profile-update
  const rmPhoto = $('removePhotoBtn');
  if (rmPhoto) rmPhoto.addEventListener('click', async () => {
    try {
      await api('profile-update.php', { method: 'PATCH', body: { avatar_url: '' } });
      $('profAvatar').removeAttribute('src');
      $('hdrAvatar').removeAttribute('src');
    } catch (e) { console.error(e); }
  });

  $('openPwdBtn').addEventListener('click',  () => openModal('pwdModal'));
  $('closePwdBtn').addEventListener('click', () => closeModal('pwdModal'));
  $('savePwdBtn').addEventListener('click',  savePassword);

  $('logoutAllBtn').addEventListener('click', logoutAllOthers);

  $('billingInfoToggle').addEventListener('click', () => $('billingInfo').classList.toggle('is-open'));
  $('saveBillingInfoBtn').addEventListener('click', saveBillingInfo);

  $('openCancelBtn').addEventListener('click',  () => openModal('cancelModal'));
  $('closeCancelBtn').addEventListener('click', () => closeModal('cancelModal'));
  $('confirmCancelBtn').addEventListener('click', () => closeModal('cancelModal')); // TODO: real cancel endpoint

  document.querySelectorAll('.notif-toggle').forEach((t) =>
    t.addEventListener('click', () => toggleNotification(t)));

  $('saveLocaleBtn').addEventListener('click', saveLocale);

  $('exportBtn').addEventListener('click',     exportData);
  $('openDeleteBtn').addEventListener('click',  () => openModal('deleteModal'));
  $('closeDeleteBtn').addEventListener('click', () => closeModal('deleteModal'));
  $('deleteConfirm').addEventListener('input', (e) => {
    $('confirmDeleteBtn').disabled = e.target.value !== currentUser?.email;
  });
  $('confirmDeleteBtn').addEventListener('click', confirmDelete);

  document.querySelectorAll('.overlay').forEach((ov) =>
    ov.addEventListener('click', (e) => { if (e.target === ov) hide(ov); }));
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) =>
    t.classList.toggle('is-active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((p) =>
    p.toggleAttribute('hidden', p.dataset.panel !== name));
  if (name === 'connections') loadConnections();
}

function openModal(id)  { show($(id)); }
function closeModal(id) { hide($(id)); }
function setToggle(el, on) { el.classList.toggle('is-on', !!on); }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g,
    (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('cs-CZ'); } catch { return iso; }
}

boot().catch((e) => {
  $('splash').textContent = 'Načtení selhalo. ' + (e.message || '');
});

}());
```

- [ ] **Step 4: Update index.html boot script block** — remove CDN loader, use:

```html
<script src="./assets/config.js"></script>
<script src="./assets/app.js"></script>
```

Remove the inline `<script>` block that loads Clerk/Supabase CDN queue. Remove `data-clerk-publishable-key` references.

Also update the gate card text: remove "Clerk" mentions.

- [ ] **Step 5: Commit**

```bash
git add assets/config.js assets/app.js index.html
git commit -m "feat: replace Clerk boot with cookie-session auth in app.js + index.html"
```

---

### Task 17: SQL Migrations (document only — run manually in Supabase SQL editor)

**Files:**
- Create: `sql/migrations/001_users_extra_columns.sql`
- Create: `sql/migrations/002_notification_prefs.sql`
- Create: `sql/migrations/003_account_activity.sql`
- Create: `sql/migrations/004_delete_user_fn.sql`

These files are **documentation only** — copy-paste into Supabase SQL editor in order 001 → 004.

- [ ] **Step 1: Create sql/migrations/001_users_extra_columns.sql**

```sql
-- Migration 001: Add missing columns to users table
-- Run in: Supabase SQL editor → New query → Run

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS two_factor_secret  text,
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_name       text,
  ADD COLUMN IF NOT EXISTS ico                varchar,
  ADD COLUMN IF NOT EXISTS dic                varchar,
  ADD COLUMN IF NOT EXISTS billing_address    text,
  ADD COLUMN IF NOT EXISTS language           varchar DEFAULT 'cs';
```

- [ ] **Step 2: Create sql/migrations/002_notification_prefs.sql**

```sql
-- Migration 002: user_notification_prefs table
CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  user_id         text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  security_alerts boolean NOT NULL DEFAULT true,
  product_updates boolean NOT NULL DEFAULT true,
  marketing       boolean NOT NULL DEFAULT false,
  billing_summary boolean NOT NULL DEFAULT true
);
```

- [ ] **Step 3: Create sql/migrations/003_account_activity.sql**

```sql
-- Migration 003: account_activity for security feed (may already exist)
CREATE TABLE IF NOT EXISTS public.account_activity (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind       text NOT NULL, -- login | password_change | twofa | session_revoke
  detail     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_activity_user_idx
  ON public.account_activity (user_id, created_at DESC);
```

- [ ] **Step 4: Create sql/migrations/004_delete_user_fn.sql**

```sql
-- Migration 004: SECURITY DEFINER function for safe user deletion
-- Deletes child rows in FK order, then the user row.
-- Call via: POST /rest/v1/rpc/delete_user_account {"target_id": "..."}

CREATE OR REPLACE FUNCTION public.delete_user_account(target_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Child tables (order matters — most specific first)
  DELETE FROM public.ai_usage_log          WHERE user_id = target_id;
  DELETE FROM public.daily_bonus_log       WHERE user_id = target_id;
  DELETE FROM public.store_orders          WHERE user_id = target_id;
  DELETE FROM public.games_stats           WHERE user_id = target_id;
  DELETE FROM public.lesson_comments       WHERE user_id = target_id;
  DELETE FROM public.certificates          WHERE user_id = target_id;
  DELETE FROM public.cal_reminders         WHERE user_id = target_id;
  DELETE FROM public.cal_events            WHERE user_id = target_id;
  DELETE FROM public.premium_subscriptions WHERE user_id = target_id;
  DELETE FROM public.user_notification_prefs WHERE user_id = target_id;
  DELETE FROM public.account_activity      WHERE user_id = target_id;
  DELETE FROM public.sessions              WHERE user_id = target_id;
  DELETE FROM public.login_attempts        WHERE user_id = target_id; -- if FK exists
  -- Finally delete the user
  DELETE FROM public.users WHERE id = target_id;
END;
$$;

-- Revoke public execute, grant only to service_role
REVOKE EXECUTE ON FUNCTION public.delete_user_account(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_user_account(text) TO service_role;
```

**NOTE:** If `login_attempts` does NOT have `user_id` column (the schema says `ip_address, action, attempt_time` with no FK), remove that DELETE line from the function.

- [ ] **Step 5: Commit migration files**

```bash
git add sql/migrations/
git commit -m "docs: add SQL migration files (run manually in Supabase SQL editor)"
```

---

## Summary: Files Created/Modified

| File | Action |
|---|---|
| `config.php` | Modify (remove Clerk, add SMTP/cookie config) |
| `config.example.php` | Create |
| `.htaccess` | Modify (add lib/ deny) |
| `api/_verify.php` | DELETE |
| `api/config.php` | DELETE |
| `lib/supabase-rest.php` | Create |
| `lib/auth-helpers.php` | Create |
| `api/login.php` | Create |
| `api/register.php` | Create |
| `api/logout.php` | Create |
| `api/me.php` | Create |
| `api/forgot-password.php` | Create |
| `api/reset-password.php` | Create |
| `api/profile-update.php` | Create |
| `api/change-password.php` | Create |
| `api/sessions-list.php` | Create |
| `api/sessions-revoke.php` | Create |
| `api/subscription.php` | Create |
| `api/notifications.php` | Create |
| `api/export-data.php` | Rewrite |
| `api/delete-account.php` | Rewrite |
| `login.html` | Rewrite |
| `register.html` | Rewrite |
| `forgot-password.html` | Create |
| `reset-password.html` | Create |
| `index.html` | Modify (boot script) |
| `assets/config.js` | Modify (remove Clerk key) |
| `assets/app.js` | Rewrite |
| `sql/migrations/001_users_extra_columns.sql` | Create |
| `sql/migrations/002_notification_prefs.sql` | Create |
| `sql/migrations/003_account_activity.sql` | Create |
| `sql/migrations/004_delete_user_fn.sql` | Create |

---

## SQL Migrations (run in this order in Supabase SQL editor)

1. `sql/migrations/001_users_extra_columns.sql` — Add columns to users
2. `sql/migrations/002_notification_prefs.sql` — Create user_notification_prefs
3. `sql/migrations/003_account_activity.sql` — Create account_activity
4. `sql/migrations/004_delete_user_fn.sql` — Create delete_user_account RPC

---

## TODOs (conscious deferrals)

| Item | Reason |
|---|---|
| OAuth connections (Google/GitHub/Microsoft) | Requires OAuth flow in PHP without Composer + token storage table. Complex standalone task. Connections tab shows disabled state. |
| 2FA TOTP implementation | Requires TOTP library (e.g. OTPHP) or manual HMAC-TOTP implementation + QR code generation (e.g. Google Charts API). Migration 001 already adds `two_factor_secret` + `two_factor_enabled` columns. Toggle is disabled in UI. |
| Avatar upload to Supabase Storage | PHP multipart upload to Supabase Storage REST requires building multipart body manually. Deferred — for now `avatar_url` is a text field (user can paste URL). Implement as separate task. |
| account_activity feed on Overview tab | `loadOverview()` shows placeholder. Add `GET /api/activity.php` endpoint as a standalone task. |
| Subscription cancel endpoint | Wires to `closeModal` for now — actual billing cancellation depends on payment provider (Stripe/GoPay). Deferred. |
| SMTP via fsockopen | `forgot-password.php` uses PHP `mail()`. WEDOS SMTP relay setup (host, port, auth) is a separate task once mail() behavior is tested. |

---

## WEDOS Setup Checklist (manual steps)

1. **PHP version**: Confirm PHP 8.1+ in WEDOS panel → Nastavení → PHP verze. Required for `match`, named args, `never` return type.
2. **HTTPS**: Enable SSL in WEDOS panel → Domény → SSL certifikát (Let's Encrypt). The `.htaccess` HTTPS redirect won't work until SSL is active.
3. **config.php**: Create on server from `config.example.php`, fill real values. Verify `curl_init` exists (`<?php phpinfo();` → check cURL extension).
4. **mail()**: Test with `<?php mail('your@email.cz', 'test', 'body'); ?>` before relying on forgot-password flow. WEDOS SMTP requires DKIM/SPF configured.
5. **uploads/ directory**: Create with `chmod 755` if needed for future avatar uploads. Currently not used.
6. **Session cookie domain**: If hosting under subdomain `account.vevit.cz`, set `COOKIE_DOMAIN` to `account.vevit.cz`. For root domain sharing with other apps use `.vevit.cz`.
7. **.htaccess rewrite**: Confirm `mod_rewrite` and `mod_authz_core` are enabled (they are on WEDOS by default).
