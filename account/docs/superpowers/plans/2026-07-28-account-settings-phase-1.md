# VEVIT Account Settings Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the routed responsive account shell, login password visibility, real overview, and editable profile as a production-ready first slice.

**Architecture:** Keep the existing PHP authentication gate and vanilla HTML/CSS/JavaScript stack. Render the safe bootstrap identity immediately, route account sections through Apache plus the History API, and load optional overview data independently with terminal section states.

**Tech Stack:** PHP 8.1+, Supabase PostgREST, Apache mod_rewrite, semantic HTML, CSS, vanilla JavaScript, repository PHP test scripts.

---

## File map

- Modify `login.html`: accessible password visibility control and supplied
  four-frame decorative animation.
- Modify `index.php`: account-path rendering and safe route bootstrap.
- Replace `index.html`: responsive account shell, sidebar, overview and profile.
- Modify `assets/styles.css`: control-center layout, states, forms and responsive behavior.
- Modify `assets/app.js`: identity, routing, menu, overview and profile controllers.
- Modify `api/profile-update.php`: shared nickname policy and safe updated-user response.
- Create `api/account-overview.php`: authenticated profile/security/activity summary.
- Modify `.htaccess`: canonical `/account/*` rewrites without a login loop.
- Modify `tests/login-page-test.php`: password control contract.
- Modify `tests/index-page-test.php`: shell, routes, accessibility and state hooks.
- Create `tests/account-overview-test.php`: overview endpoint contract.
- Create `tests/profile-update-test.php`: profile validation and response contract.
- Create `tests/account-routing-test.php`: Apache and server route behavior.

### Task 1: Accessible password visibility and girl animation on login

**Files:**
- Modify: `tests/login-page-test.php`
- Modify: `login.html`
- Track unchanged assets: `images/holka odkryté oči.png`,
  `images/zakrývání 1.png`, `images/zakrývání 2.png`,
  `images/holka zakryté oči.png`

- [ ] **Step 1: Write a failing page-contract test**

Add assertions requiring a button with `id="toggleLoginPassword"`,
`type="button"`, `aria-controls="inputPass"`, `aria-pressed="false"`, a
non-empty accessible label, and JavaScript that changes the password input type
without changing its value. Also require the case-sensitive `images/` paths in
the exact four-frame order, an initially open-eyes decorative image, preloading,
cancelled animation timers, a 90–130 ms interval, reduced-motion handling,
`pointer-events: none`, stable bottom alignment, mobile hiding and no page
overflow.

- [ ] **Step 2: Verify the test fails for the missing control**

Run: `php tests/login-page-test.php`
Expected: FAIL mentioning `toggleLoginPassword`.

- [ ] **Step 3: Add the minimal accessible control**

Wrap the input in `.password-field`, add an inline SVG eye icon and toggle
button, then attach a click handler that changes `inputPass.type`, updates
`aria-pressed`, `aria-label`, `title`, and the icon state. Preserve
`autocomplete="current-password"` and the exact input value.

Add one fixed `.login-girl` container with one `img` using `alt=""` and
`aria-hidden="true"`. Implement a four-path frame controller that preloads the
images, keeps one current index, clears its one pending timeout before changing
direction, advances one frame every 110 ms toward the current password-state
target, and jumps directly to the target under `prefers-reduced-motion`.
Use `object-fit: contain` and `object-position: bottom center`; hide the
decoration at the first breakpoint where it could overlap the 480 px card.

- [ ] **Step 4: Verify login page tests**

Run: `php tests/login-page-test.php && php tests/login-test.php`
Expected: both PASS.

- [ ] **Step 5: Commit only Task 1 files**

```bash
git add login.html tests/login-page-test.php images/holka\\ odkryté\\ oči.png images/zakrývání\\ 1.png images/zakrývání\\ 2.png images/holka\\ zakryté\\ oči.png
git commit -m "feat: add animated login password privacy"
```

### Task 2: Canonical account routes and authenticated shell

**Files:**
- Create: `tests/account-routing-test.php`
- Modify: `tests/login-gate-test.php`
- Modify: `.htaccess`
- Modify: `index.php`

- [ ] **Step 1: Write failing routing tests**

Assert that `/account` and every approved child path rewrite internally to
`index.php`, that static/API/login paths are excluded, and that `index.php`
embeds a safe initial route string alongside the safe user bootstrap.

- [ ] **Step 2: Verify expected failures**

Run: `php tests/account-routing-test.php && php tests/login-gate-test.php`
Expected: the new route assertions FAIL while existing auth-gate assertions
remain valid.

- [ ] **Step 3: Implement the route contract**

Add explicit account rewrite rules before the generic login route. Parse only
the allow-listed request path in `index.php`, default unknown values to
`overview`, and embed `window.__VV_ROUTE__` using JSON hex escaping.

- [ ] **Step 4: Verify route and auth tests**

Run: `php tests/account-routing-test.php && php tests/login-gate-test.php && php tests/htaccess-compat-test.php`
Expected: all PASS.

- [ ] **Step 5: Commit only routing files**

```bash
git add .htaccess index.php tests/account-routing-test.php tests/login-gate-test.php
git commit -m "feat: add canonical account section routes"
```

### Task 3: Responsive control-center shell

**Files:**
- Modify: `tests/index-page-test.php`
- Replace: `index.html`
- Modify: `assets/styles.css`

- [ ] **Step 1: Write failing semantic shell assertions**

Require the eight navigation destinations, a sticky desktop sidebar, mobile
section selector, user-menu button, initials avatar fallback, one main heading,
`aria-live` region, Overview/Profile panels, skeleton/error/empty hooks, and
the absence of static subscription/payment/demo values.

- [ ] **Step 2: Verify the shell test fails**

Run: `php tests/index-page-test.php`
Expected: FAIL for missing sidebar and state hooks.

- [ ] **Step 3: Implement the new semantic HTML shell**

Replace horizontal tabs and the global splash with the approved header,
sidebar, mobile selector, content header, overview cards, activity list,
profile cards, user menu, local loading/error/empty templates, toast region,
and dirty-changes dialog. Keep later destinations present but render an honest
“section not loaded yet” state rather than product data.

- [ ] **Step 4: Implement the visual system**

Extend the existing VEVIT tokens with consistent spacing, control heights,
focus rings, shadows and 150–250 ms transitions. Add desktop two-column layout,
sticky sidebar, mobile selector, no-horizontal-scroll safeguards, skeletons,
error cards, initials avatars, dropdowns, dialogs, and reduced-motion rules.

- [ ] **Step 5: Verify shell/static regressions**

Run: `php tests/index-page-test.php && php tests/hidden-state-styles-test.php && php tests/index-cache-bust-test.php`
Expected: all PASS.

- [ ] **Step 6: Commit shell files**

```bash
git add index.html assets/styles.css tests/index-page-test.php tests/hidden-state-styles-test.php tests/index-cache-bust-test.php
git commit -m "feat: redesign account settings shell"
```

### Task 4: Real overview endpoint with safe summaries

**Files:**
- Create: `tests/account-overview-test.php`
- Create: `api/account-overview.php`

- [ ] **Step 1: Write failing endpoint-contract tests**

Test method handling before body parsing, authenticated ownership, safe selected
columns, profile completion calculation, normalized security summary, activity
limit/order, and a result that never includes password, session token, TOTP
secret, or full payment identifiers.

- [ ] **Step 2: Verify expected endpoint test failure**

Run: `php tests/account-overview-test.php`
Expected: FAIL because the endpoint does not exist.

- [ ] **Step 3: Implement minimal safe aggregation**

Use `requireAuth()`, calculate completion from the authenticated safe user,
query only the count of active sessions and the latest account activity, and
reuse `subscription.php` data through a shared pure formatter rather than
making an HTTP self-request. Return independent nullable summaries so absence
of optional records is an empty state, not an endpoint failure.

- [ ] **Step 4: Verify endpoint tests**

Run: `php tests/account-overview-test.php`
Expected: PASS.

- [ ] **Step 5: Commit endpoint files**

```bash
git add api/account-overview.php tests/account-overview-test.php
git commit -m "feat: add safe account overview endpoint"
```

### Task 5: Route, menu, and independent overview controllers

**Files:**
- Modify: `tests/index-page-test.php`
- Modify: `assets/app.js`

- [ ] **Step 1: Add failing client-contract assertions**

Require an allow-listed route map, `pushState`, `popstate`, document-title
updates, section cache, request timeout, section-local `finally`, retry actions,
menu dismissal, Escape support, and no whole-page spinner dependency.

- [ ] **Step 2: Verify the new assertions fail**

Run: `php tests/index-page-test.php && php tests/account-boot-timeout-test.php`
Expected: FAIL for the missing route/state controller.

- [ ] **Step 3: Implement minimal client routing and state**

Hydrate identity from `window.__VV_USER__`, resolve the initial route, navigate
with `history.pushState`, respond to `popstate`, sync desktop/mobile
navigation, update titles, and lazy-load overview once. Render overview cards
from backend values only. Each overview subsection transitions through local
loading/success/empty/error state and retry replaces only that subsection.

- [ ] **Step 4: Implement user menu accessibility**

Add click/keyboard toggling, correct expanded state, outside-click and Escape
dismissal, focus restoration, initials/photo rendering, and logout through the
existing endpoint.

- [ ] **Step 5: Verify controller tests**

Run: `php tests/index-page-test.php && php tests/account-boot-timeout-test.php`
Expected: PASS.

- [ ] **Step 6: Commit controller files**

```bash
git add assets/app.js tests/index-page-test.php
git commit -m "feat: add routed account overview controller"
```

### Task 6: Validated dirty-state profile editing

**Files:**
- Create: `tests/profile-update-test.php`
- Modify: `api/profile-update.php`
- Modify: `assets/app.js`
- Modify: `index.html`

- [ ] **Step 1: Write failing server validation tests**

Require the shared `registerNicknameIsValid()` policy, dot acceptance, hyphen
rejection, ownership from session, allow-listed profile fields, duplicate
nickname mapping, and a safe updated user in the response.

- [ ] **Step 2: Verify server tests fail for the policy mismatch**

Run: `php tests/profile-update-test.php`
Expected: FAIL because profile update currently accepts hyphen and rejects dot.

- [ ] **Step 3: Implement minimal server correction**

Reuse `lib/registration-validation.php`, remove arbitrary `avatar_url` writes,
validate normalized text lengths, preserve nullable optional fields, update by
the authenticated user ID, and return only the safe user fields.

- [ ] **Step 4: Verify server profile tests**

Run: `php tests/profile-update-test.php && php tests/nickname-availability-test.php && php tests/register-endpoint-test.php`
Expected: all PASS.

- [ ] **Step 5: Add failing client profile assertions**

Require original/draft state, validity calculation, disabled unchanged save,
350 ms nickname debounce with abort, field-level errors, submit lock,
response-driven identity update, toast, `beforeunload`, and a keyboard-safe
dirty-changes dialog.

- [ ] **Step 6: Verify client assertions fail**

Run: `php tests/index-page-test.php`
Expected: FAIL for missing profile controller hooks.

- [ ] **Step 7: Implement profile controller and dialog**

Hydrate all supported profile fields, calculate completion and initials,
validate during input, debounce availability checks, enable save only for a
valid change, disable fields during submission, update local identity from the
safe response, announce success/failure, and intercept in-app/browser
navigation while dirty.

- [ ] **Step 8: Verify profile and shell tests**

Run: `php tests/profile-update-test.php && php tests/index-page-test.php`
Expected: PASS.

- [ ] **Step 9: Commit profile files**

```bash
git add api/profile-update.php assets/app.js index.html tests/profile-update-test.php tests/index-page-test.php
git commit -m "feat: add validated account profile editing"
```

### Task 7: Full verification and browser QA

**Files:**
- Modify only if a failing verification identifies a phase-1 regression.

- [ ] **Step 1: Run PHP syntax checks**

Run:

```bash
find . -path './.git' -prune -o -path './.superpowers' -prune -o -name '*.php' -print0 | xargs -0 -n1 php -l
```

Expected: no syntax errors.

- [ ] **Step 2: Run the complete repository test suite**

Run:

```bash
for test_file in tests/*-test.php; do php "$test_file" || exit 1; done
```

Expected: every test exits 0.

- [ ] **Step 3: Run authenticated browser QA with test data**

Verify at desktop and mobile widths: login eye, `/account` direct load,
refresh/deep links, back/forward, sidebar/mobile selector, user menu keyboard
behavior, initials fallback, overview loading/error/empty/retry, profile dirty
state, nickname error correction, save lock/toast, Escape and focus restoration.
Do not execute production mutations or destructive endpoints.

- [ ] **Step 4: Inspect working tree scope**

Run: `git status --short && git diff --check`
Expected: no whitespace errors and no unrelated user files staged.

- [ ] **Step 5: Commit verification-only corrections if needed**

Stage only files changed by this phase and use:

```bash
git commit -m "fix: address account settings phase one verification"
```
