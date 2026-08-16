# Prémiová registrace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zpřístupnit moderní responzivní registraci s průběžnou klientskou validací a identickými serverovými pravidly.

**Architecture:** `api/register.php` bude zdrojem pravdy pro pravidla hesla a přezdívky; `api/nickname-availability.php` vrátí pouze boolean dostupnosti. `register.html` udržuje validační stav formuláře, zobrazuje přístupné chyby a odešle request až při platných hodnotách.

**Tech Stack:** PHP 8, Supabase PostgREST, vanilla HTML/CSS/JavaScript, dependency-free PHP testy.

---

### Task 1: Serverová validace a dostupnost přezdívky

**Files:**
- Modify: `api/register.php`
- Create: `api/nickname-availability.php`
- Test: `tests/register-endpoint-test.php`, `tests/nickname-availability-test.php`

- [x] **Step 1: Write failing tests**

Vyžadujte regex přezdívky `/^[a-z0-9_.]+$/i`, kontrolu 8–72 bajtů hesla a požadavky `/[A-Z]/`, `/[a-z]/`, `/\\d/`, `/[^A-Za-z0-9]/`. Test endpointu dostupnosti požaduje GET, validuje nickname a vrací jen `available`.

- [x] **Step 2: Verify RED**

Run: `php tests/register-endpoint-test.php && php tests/nickname-availability-test.php`

Expected: FAIL, protože registrace dovoluje slabé heslo a endpoint neexistuje.

- [x] **Step 3: Implement minimum**

V `api/register.php` odmítněte heslo, které neprojde všemi pravidly, a přezdívku mimo `[a-z0-9_.]`. Vytvořte endpoint:

```php
$nickname = trim((string) ($_GET['nickname'] ?? ''));
if (!preg_match('/^[a-z0-9_.]{3,30}$/i', $nickname)) {
  jsonOk(['available' => false]);
}
$result = sb_find_one($cfg, 'users', ['nickname' => $nickname], 'id');
if (isset($result['error'])) jsonErr('Chyba serveru.', 500);
jsonOk(['available' => ($result['data'] ?? null) === null]);
```

- [x] **Step 4: Verify GREEN**

Run: `php tests/register-endpoint-test.php && php tests/nickname-availability-test.php && php -l api/register.php && php -l api/nickname-availability.php`

Expected: PASS and no PHP syntax errors.

### Task 2: Prémiový dostupný formulář

**Files:**
- Modify: `register.html`
- Test: `tests/register-page-test.php`

- [x] **Step 1: Write failing contract test**

Vyžadujte `registerForm`, pole `inpPassConfirm`, tlačítka oka, `aria-live`, seznam pravidel hesla, `nickname-availability.php`, `autocomplete` a blokování submitu.

- [x] **Step 2: Verify RED**

Run: `php tests/register-page-test.php`

Expected: FAIL, protože současná stránka obsahuje pouze jedno heslo a nemá validační stavy.

- [x] **Step 3: Implement form**

Použijte CSS grid pro dvojici jméno/přezdívka s media query 640 px. Přidejte validátory, debounce 350 ms, jednorázovou třídu `is-valid`, chyby přes `aria-describedby`, tlačítka viditelnosti hesel, zablokování celého formu při requestu a úspěšný stav s redirectem na `/` za 1200 ms.

- [x] **Step 4: Verify GREEN**

Run: `php tests/register-page-test.php && php tests/register-endpoint-test.php && php tests/nickname-availability-test.php && php -l api/register.php && php -l api/nickname-availability.php && git diff --check`

Expected: všechny testy PASS a syntaxe bez chyb.

### Task 3: Manuální kontrola

- [ ] Ověřte desktop dvousloupcový a mobilní jednosloupcový layout, validaci při psaní, oko, Enter, disabled state, obsazenou přezdívku, úspěšnou animaci a přesměrování.
