# Zapamatované přihlášení Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přidat volitelné 30denní zapamatované přihlášení, které se při každém ověření obnoví, a jeden formulář pro e-mail a heslo.

**Architecture:** Tabulka `sessions` uchová boolean `remember`, aby backend rozlišil persistentní a session cookie. Pomocné funkce vytvoří nebo obnoví pouze náhodný token relace; `api/me.php` přes `getCurrentUser()` obnoví serverovou expiraci a odpovídající cookie po každém úspěšném ověření.

**Tech Stack:** PHP 8, Supabase PostgREST, vanilla HTML/CSS/JavaScript, dependency-free PHP testy.

---

## File structure

- `sql/migrations/005_session_remember.sql` — serverová volba zapamatování relace.
- `lib/auth-helpers.php` — vytvoření a obnovení 30denní relace.
- `api/login.php` — validace a předání `remember`.
- `login.html` — jeden formulář s checkboxem.
- `tests/auth-helpers-test.php` — 30denní a session cookie, obnovení relace.
- `tests/login-test.php` — endpoint předává pouze boolean `remember`.
- `tests/login-page-test.php` — statický kontrakt formuláře.

### Task 1: Přidat volbu do databázové relace

**Files:**
- Create: `sql/migrations/005_session_remember.sql`

- [ ] **Step 1: Vytvořit migraci**

```sql
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS remember boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Zkontrolovat migraci**

Run: `sed -n '1,80p' sql/migrations/005_session_remember.sql`

Expected: jedinou změnou je boolean `remember` s hodnotou `false` pro stávající relace.

- [ ] **Step 3: Commitnout migraci**

```bash
git add sql/migrations/005_session_remember.sql
git commit -m "feat: persist remembered sessions"
```

### Task 2: Test-first vytvoření a obnova relace

**Files:**
- Modify: `lib/auth-helpers.php:7-9,143-213,333-373`
- Test: `tests/auth-helpers-test.php:10-108,399-525`

- [ ] **Step 1: Napsat padající test persistentní cookie**

Do child scénáře přidejte adaptér `insert` a `set_cookie`, zavolejte `createSession([], 'user-1', true)` a v rodičovském testu ověřte:

```php
assert_same(true, $sessionRow['remember']);
assert_same(30 * 86400, $sessionExpiry - $createdAt);
assert_same($sessionExpiryUnix, $cookieOptions['expires']);
assert_same(true, $cookieOptions['secure']);
assert_same(true, $cookieOptions['httponly']);
```

- [ ] **Step 2: Ověřit RED**

Run: `php tests/auth-helpers-test.php`

Expected: FAIL, protože třetí argument ani uložený `remember` zatím neexistují.

- [ ] **Step 3: Napsat padající test session cookie a obnovení**

Ověřte, že `createSession([], 'user-1', false)` vloží `remember => false` a nastaví `expires => 0`. Pro platnou relaci `getCurrentUser([])` musí test zachytit PATCH:

```php
['sessions', ['session_token' => str_repeat('a', 64)], ['expires_at' => $newExpiry]]
```

a nové nastavení cookie se stejným tokenem. Select relace musí testovat `user_id,remember`.

- [ ] **Step 4: Ověřit RED**

Run: `php tests/auth-helpers-test.php`

Expected: FAIL, protože žádný PATCH ani obnova cookie zatím neexistují.

- [ ] **Step 5: Implementovat minimum**

V `lib/auth-helpers.php` nastavte `SESSION_DAYS = 30` a přidejte adaptér pro `sb_update()`:

```php
function _auth_update(array $cfg, string $table, array $eq, array $patch): array {
  $adapter = _auth_adapter('update');
  if ($adapter !== null) {
    $result = $adapter($cfg, $table, $eq, $patch);
    return is_array($result) ? $result : ['error' => 'Invalid update result'];
  }
  return sb_update($cfg, $table, $eq, $patch);
}
```

Změňte podpis na:

```php
function createSession(array $cfg, string $userId, bool $remember = false): string
```

a vložte do řádku relace `'remember' => $remember`; databázová expirace je vždy `gmdate('Y-m-d\\TH:i:s\\Z', $now + (30 * 86400))`. Cookie používejte se stejnou expirací pro `true` a s `expires => 0` pro `false`. V `getCurrentUser()` načtěte `user_id,remember`; až po úspěšném bezpečném načtení uživatele aktualizujte `expires_at` podle `session_token` a znovu nastavte cookie. Při neúspěšném PATCH nebo `setcookie` vraťte `jsonErr('Unable to renew session', 500)`.

- [ ] **Step 6: Ověřit GREEN**

Run: `php tests/auth-helpers-test.php`

Expected: PASS; testy pokrývají 30denní persistentní cookie, cookie bez expirace, tokenový PATCH a bezpečnostní atributy.

- [ ] **Step 7: Commitnout**

```bash
git add lib/auth-helpers.php tests/auth-helpers-test.php
git commit -m "feat: renew remembered sessions for 30 days"
```

### Task 3: Endpoint přijme výhradně boolean

**Files:**
- Modify: `api/login.php:84-116`
- Test: `tests/login-test.php:45-189,273-340`

- [ ] **Step 1: Napsat padající testy**

Do úspěšného scénáře předejte `{"remember":true}` a ověřte, že `createSession` dostane `true`. Přidejte scénář `{"remember":"true"}`, který očekává HTTP 400 a:

```json
{"error":"Neplatná volba zapamatování."}
```

- [ ] **Step 2: Ověřit RED**

Run: `php tests/login-test.php`

Expected: FAIL, protože endpoint volbu nevaliduje ani ji nepředává.

- [ ] **Step 3: Implementovat validaci bez změny hesla**

Po rozparsování JSON přidejte:

```php
$remember = $payload['remember'] ?? false;
if (!is_bool($remember)) {
  jsonErr('Neplatná volba zapamatování.');
}
```

a zavolejte:

```php
createSession($cfg, $userId, $remember);
```

E-mail dál `trim()` a zmenšete na lowercase; heslo neorezávejte.

- [ ] **Step 4: Ověřit GREEN**

Run: `php tests/login-test.php && php tests/auth-helpers-test.php`

Expected: oba testy PASS včetně rozlišení hesel s okrajovým bílým znakem.

- [ ] **Step 5: Commitnout**

```bash
git add api/login.php tests/login-test.php
git commit -m "feat: support remembered login"
```

### Task 4: Jeden formulář s checkboxem

**Files:**
- Modify: `login.html:19-119`
- Create: `tests/login-page-test.php`

- [ ] **Step 1: Napsat padající kontrakt stránky**

Vytvořte `tests/login-page-test.php`, který načte `login.html` a vyžaduje:

```php
assert_contains('id="loginForm"', $html);
assert_contains('id="inputEmail"', $html);
assert_contains('id="inputPass"', $html);
assert_contains('id="inputRemember"', $html);
assert_contains('name="remember"', $html);
assert_contains('body: JSON.stringify({ email: email, password: pass, remember: remember })', $html);
assert_not_contains('id="stepEmail"', $html);
assert_not_contains('id="stepPass"', $html);
```

- [ ] **Step 2: Ověřit RED**

Run: `php tests/login-page-test.php`

Expected: FAIL, protože stránka je nyní dvoukroková a neposílá `remember`.

- [ ] **Step 3: Implementovat formulář**

Dvoukrokové bloky nahraďte:

```html
<form id="loginForm" class="step">
  <!-- stávající e-mail a heslo -->
  <label class="remember-control" for="inputRemember">
    <input id="inputRemember" name="remember" type="checkbox">
    <span>Zapamatovat si mě na tomto zařízení</span>
  </label>
  <!-- odkaz obnovy hesla a submit tlačítko -->
</form>
```

Odstraňte logiku pokračování/zpět. Na `submit` zavolejte `event.preventDefault()`, validujte e-mail i heslo a odešlete:

```js
var remember = inputRemember.checked;
body: JSON.stringify({ email: email, password: pass, remember: remember })
```

Zachovejte `credentials: 'same-origin'`, stávající chybové hlášení a přesměrování na `index.html`.

- [ ] **Step 4: Ověřit GREEN**

Run: `php tests/login-page-test.php && php tests/login-test.php && php tests/auth-helpers-test.php && php -l api/login.php && php -l lib/auth-helpers.php`

Expected: všechny testy PASS a obě PHP kontroly hlásí `No syntax errors detected`.

- [ ] **Step 5: Commitnout**

```bash
git add login.html tests/login-page-test.php
git commit -m "feat: combine login fields into one form"
```

### Task 5: Nasazení a úplná kontrola

**Files:**
- Verify: `sql/migrations/005_session_remember.sql`, `lib/auth-helpers.php`, `api/login.php`, `login.html`

- [ ] **Step 1: Úplná lokální kontrola**

Run: `php tests/auth-helpers-test.php && php tests/login-test.php && php tests/login-page-test.php && php -l lib/auth-helpers.php && php -l api/login.php && git diff --check`

Expected: PASS, žádné PHP syntax errors a žádný výstup z `git diff --check`.

- [ ] **Step 2: Spustit migraci v Supabase SQL Editoru**

Spusťte obsah `sql/migrations/005_session_remember.sql` a ověřte:

```sql
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sessions'
  and column_name = 'remember';
```

Expected: jeden řádek `boolean`, výchozí `false`, `NO`.

- [ ] **Step 3: Ověřit v prohlížeči**

Přihlaste se se zaškrtnutou volbou, obnovte `index.html` a ověřte expiraci `__vvsession` znovu přibližně za 30 dní. Ověřte `HttpOnly`, `Secure`, `SameSite=Lax`; odhlaste se a ověřte odstranění cookie i relace. Přihlaste se bez volby a ověřte cookie bez atributu `Expires`.
