# Serverový login gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přesměrovat nepřihlášené návštěvníky adresy `/` a `/index.html` na čistou adresu `/login` ještě před načtením stránky účtu.

**Architecture:** Apache odešle vstupní požadavky do `index.php`; ten používá stávající serverové ověření relace a při chybějící relaci vrátí redirect. Pravidlo `.htaccess` mapuje `/login` na statický `login.html` bez změny adresy v prohlížeči.

**Tech Stack:** Apache `.htaccess`, PHP 8, stávající cookie relace, dependency-free PHP testy.

---

## File structure

- `.htaccess` — interní rewrites pro `/`, `/index.html` a `/login`.
- `index.php` — serverový gate a bezpečné předání statické stránky účtu.
- `tests/login-gate-test.php` — testy PHP gate a Apache pravidel.

### Task 1: Napsat padající test serverového gate

**Files:**
- Create: `tests/login-gate-test.php`

- [ ] **Step 1: Napsat test bez relace**

V testu načtěte `index.php` s konstantou `LOGIN_GATE_NO_MAIN`. Spusťte child proces se serverovými proměnnými:

```php
$_SERVER = ['HTTPS' => 'on', 'REQUEST_URI' => '/'];
$_COOKIE = [];
login_gate_run([]);
```

Očekávejte HTTP 302 a hlavičku `Location: /login`.

- [ ] **Step 2: Napsat test platné relace**

Použijte adaptéry `filtered_get`, `find_one`, `update` a `set_cookie`, aby `getCurrentUser([])` vrátil uživatele a obnovil relaci. Očekávejte HTTP 200 a načtený obsah `index.html`, například řetězec `id="app"`.

- [ ] **Step 3: Napsat test Apache pravidel**

Ověřte v obsahu `.htaccess`:

```php
assert_contains('DirectoryIndex index.php', $rules);
assert_contains('^login/?$', $rules);
assert_contains('^$', $rules);
assert_contains('^index\\.html$', $rules);
```

- [ ] **Step 4: Ověřit RED**

Run: `php tests/login-gate-test.php`

Expected: FAIL, protože `index.php` neexistuje a `.htaccess` stále používá `index.html`.

### Task 2: Implementovat serverové přesměrování

**Files:**
- Create: `index.php`
- Modify: `.htaccess:1-8`
- Test: `tests/login-gate-test.php`

- [ ] **Step 1: Implementovat PHP gate**

Vytvořte `index.php`:

```php
<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/auth-helpers.php';

function login_gate_run(array $cfg): never {
  $user = getCurrentUser($cfg);
  if ($user === null) {
    header('Location: /login', true, 302);
    exit;
  }

  header('Content-Type: text/html; charset=utf-8');
  readfile(__DIR__ . '/index.html');
  exit;
}

if (!defined('LOGIN_GATE_NO_MAIN')) {
  login_gate_run(auth_load_config());
}
```

- [ ] **Step 2: Implementovat Apache pravidla**

Za HTTPS pravidlo vložte a nahraďte `DirectoryIndex index.html`:

```apache
DirectoryIndex index.php

RewriteRule ^login/?$ login.html [L]
RewriteRule ^$ index.php [L]
RewriteRule ^index\.html$ index.php [L]
```

- [ ] **Step 3: Ověřit GREEN**

Run: `php tests/login-gate-test.php && php tests/login-test.php && php tests/login-page-test.php && php -l index.php && git diff --check`

Expected: všechny testy PASS, PHP vypíše `No syntax errors detected` a kontrola diffu nemá výstup.

- [ ] **Step 4: Commitnout pouze gate soubory**

```bash
git add .htaccess index.php tests/login-gate-test.php
git commit -m "feat: redirect guests to login"
```

### Task 3: Ručně ověřit na hostingu

**Files:**
- Verify: `.htaccess`, `index.php`, `login.html`

- [ ] **Step 1: Ověřit bez relace**

Otevřete `https://account.vevit.cz/` v anonymním okně.

Expected: prohlížeč skončí na `https://account.vevit.cz/login`.

- [ ] **Step 2: Ověřit přihlášeného uživatele**

Přihlaste se na `https://account.vevit.cz/login` a otevřete `https://account.vevit.cz/`.

Expected: zobrazí se účet a neproběhne redirect na login.
