# VeVit Account Integration

Central authentication for `store.vevit.cz` is delegated entirely to `account.vevit.cz`.
This document records the design, open blockers, and security contract.

---

## Architecture

```
Browser (store.vevit.cz page)
  └─ JS: fetch('https://account.vevit.cz/api/me.php', { credentials: 'include' })
         ↑ browser automatically includes HttpOnly vevit_session cookie
         ↓ CORS response from account.vevit.cz with user data

PHP (store.vevit.cz server)
  └─ Cannot see vevit_session (host-only cookie, set without Domain=.vevit.cz)
  └─ VevitAccount::checkSession() always returns null until server-to-server contract confirmed [BLOCKER]
```

Authentication state is checked on every page load by `assets/js/vevit-account.js`.
On auth success, the adapter updates the `#navAuth` DOM node with the user chip.
On any failure state, the login button is left in place. Content remains fully accessible.

---

## What this app MUST NOT do

- Verify passwords
- Create VeVit Account sessions
- Issue auth JWTs on behalf of VeVit Account
- Read or decode `vevit_session` cookie (it is HttpOnly and host-only for `account.vevit.cz`)
- Store session data in `localStorage` or `sessionStorage`
- Pass session tokens via URL parameters or DOM attributes

---

## Cookie contract

| Property | Value |
|---|---|
| Name | `vevit_session` |
| HttpOnly | yes |
| Secure | yes |
| SameSite | `Lax` |
| Domain attribute | **none** (host-only for `account.vevit.cz`) |

`store.vevit.cz` and `account.vevit.cz` are same-site (same eTLD+1: `vevit.cz`).
With `SameSite=Lax`, the browser sends the cookie in cross-site fetches that originate from
a same-site page when using `credentials: 'include'`.
The cookie is **never** sent with `Domain=.vevit.cz` — it is not shared across subdomains at
the transport level.

---

## JS adapter: `assets/js/vevit-account.js`

### Configuration

Set `window.VEVIT_ACCOUNT_CONFIG` before the script loads:

```js
window.VEVIT_ACCOUNT_CONFIG = {
  meUrl:    'https://account.vevit.cz/api/me.php', // [B1]
  loginUrl: 'https://account.vevit.cz/login',      // [B2]
  appOrigin: 'https://store.vevit.cz',
};
```

### API surface

```js
// Check session — returns Promise<{ state, user, retryAfter? }>
VevitAccount.checkSession({ signal? })

// Redirect to login — ONLY call on explicit user action
VevitAccount.openLogin()

// Retry after 429 rate-limit (respects Retry-After header, max 120 s)
VevitAccount.retrySessionCheck()

// Render auth state into a container element
VevitAccount.renderAccountState(container, result, { onLogin? })
```

### Six client states

| State | Meaning |
|---|---|
| `loading` | Request in flight |
| `authenticated` | Valid session; `result.user` is populated |
| `unauthenticated` | No session (401) or `authenticated: false` |
| `forbidden` | Session valid but access denied (403) |
| `rate_limited` | Too many requests (429); `result.retryAfter` set |
| `temporarily_unavailable` | Network error, non-JSON body, or malformed response |

### Security properties

- Never reads `document.cookie`
- Never writes to `localStorage` or `sessionStorage`
- Never uses `innerHTML` with user-supplied data — all names/text go through `textContent`
- Never redirects automatically on 401 or other failures
- Avatar URL validated: only `https:` protocol accepted; anything else → fallback avatar

---

## PHP class: `lib/VevitAccount.php`

```php
$va = VevitAccount::fromConfig($storeConfig['vevit_account']);
header('Location: ' . $va->loginRedirectUrl($_SERVER['REQUEST_URI']));
```

`checkSession()` always returns `null` — server-side PHP on `store.vevit.cz` cannot receive
the `vevit_session` cookie because it is host-only for `account.vevit.cz`.
This is a hard constraint, not a code bug.

---

## Required changes on `account.vevit.cz`

1. **CORS allowlist** — add `https://store.vevit.cz` (and staging/preview origins as needed)
   to the allowed origins for `api/me.php`. Never use `Access-Control-Allow-Origin: *` with
   `Access-Control-Allow-Credentials: true`.
2. **Response headers** on `api/me.php`:
   ```
   Access-Control-Allow-Origin: <allowed origin>
   Access-Control-Allow-Credentials: true
   Vary: Origin
   Cache-Control: no-store, private
   ```
3. **Response schema** (assumed — confirm [B3]):
   ```json
   {
     "authenticated": true,
     "user": {
       "id": "string",
       "display_name": "string",
       "avatar_url": "https://... or null"
     }
   }
   ```
   When unauthenticated: `{ "authenticated": false, "user": null }` or HTTP 401.

---

## Open blockers

All blockers must be resolved with the VeVit Account team before production launch.
Until then the integration runs in a safe degraded mode (login button always shown).

| ID | Blocker | Impact |
|---|---|---|
| **[B1]** | Exact URL for the `me` endpoint on `account.vevit.cz` | JS never makes the check call |
| **[B2]** | Login redirect URL and exact `return_url` parameter name | Login redirect may be broken |
| **[B3]** | Response JSON schema (`authenticated` flag, `user` object fields) | User chip not rendered |
| **[B4]** | CORS allowlist on `account.vevit.cz` must include `store.vevit.cz` | Fetch blocked by CORS |
| **[B5]** | Logout endpoint, HTTP method, CSRF token contract, post-logout redirect | Logout stays local only |

---

## Allowed origins (store.vevit.cz side)

Configure `STORE_ALLOWED_ORIGINS` in `config_secret.php` for `api/me.php` CORS:

```
STORE_ALLOWED_ORIGINS=https://store.vevit.cz,https://account.vevit.cz
```

---

## Changed files

| File | Change |
|---|---|
| `assets/js/vevit-account.js` | New — universal auth adapter |
| `lib/VevitAccount.php` | New — PHP helper class (checkSession BLOCKER) |
| `lib/auth.php` | Removed `loginUser()`; `requireLogin()` redirects to account.vevit.cz |
| `lib/header.php` | Login modal removed; nav hydrated by vevit-account.js |
| `api/login.php` | Returns 410 Gone |
| `api/me.php` | Removed `Access-Control-Allow-Origin: *`; proper CORS allowlist |
| `lib/config.php` | Loads `VEVIT_ACCOUNT_ME_URL` / `VEVIT_ACCOUNT_LOGIN_URL` |
| `config.example.php` | Documents the two new env constants |
| `index.html` | Login modal removed; nav hydrated by vevit-account.js |

---

## Tests

**JS adapter (manual / unit):**
- `checkSession()` with 200 + `authenticated: true` → state `authenticated`, user populated
- `checkSession()` with 200 + `authenticated: false` → state `unauthenticated`
- `checkSession()` with 401 → state `unauthenticated`
- `checkSession()` with 403 → state `forbidden`
- `checkSession()` with 429 + `Retry-After: 5` → state `rate_limited`, retryAfter set
- `checkSession()` with 500 → state `temporarily_unavailable`
- `checkSession()` with non-JSON body → state `temporarily_unavailable`
- `checkSession()` with `avatar_url: "http://..."` → avatarUrl null (http rejected)
- `openLogin()` builds URL with `return_url` param, does not call on 401
- `retrySessionCheck()` waits ≤ 120 s, does not loop on persistent 429
- `renderAccountState()` uses `textContent` for display name (not innerHTML)
- `renderAccountState()` renders fallback avatar when `avatarUrl` is null
- Nav button states: loading spinner, login button, user chip each render correctly
- Keyboard Escape does not interfere with auth flow

**CORS:**
- Fetch from `store.vevit.cz` with `credentials: include` reaches `account.vevit.cz/api/me.php`
- Response includes correct CORS headers for the requesting origin
- Wildcard `Access-Control-Allow-Origin: *` is not present on credentialed responses
