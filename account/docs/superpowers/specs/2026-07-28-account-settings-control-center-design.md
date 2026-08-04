# VEVIT Account Settings Control Center — Design

**Date:** 2026-07-28
**Status:** Approved for implementation
**Scope:** Production account settings, delivered as independently testable vertical slices

## Product direction

The account area will become a calm, compact control center. It keeps the
existing dark VEVIT identity, Sora typography, green accent, logo treatment and
PHP/vanilla JavaScript hosting model. The redesign improves hierarchy and
legibility without turning the product into a visually unrelated dashboard.

Desktop uses a sticky left navigation and a flexible content column within a
1180–1280 px shell. Mobile uses a compact section selector without horizontal
page scrolling. Cards are only slightly lighter than the page surface, green is
reserved for primary actions and success, and orange/red are reserved for
warnings and destructive actions.

## Delivery strategy

Implementation is split into functional vertical slices:

1. Foundation, routed shell, login password visibility, overview and profile.
2. Password security, 2FA, and enriched session management.
3. Subscription, invoices, connected accounts, notifications, and preferences.
4. Privacy, consent history, export workflow, verified email change, and
   multi-step account deletion.

Every slice must use authenticated backend data, include its own loading/error/
empty states, pass automated tests and remain deployable on WEDOS shared
hosting. A later slice must not require placeholders in an earlier slice.

## Architecture

The existing PHP + HTML/CSS + vanilla JavaScript stack remains. No frontend
framework or build step is introduced.

- `index.php` remains the server-side authentication gate.
- The account shell receives only the safe authenticated bootstrap user.
- Account sections use canonical paths:
  `/account`, `/account/profile`, `/account/security`, `/account/billing`,
  `/account/connections`, `/account/notifications`, `/account/preferences`,
  and `/account/privacy`.
- Apache rewrites account paths to `index.php`. Client-side navigation uses the
  History API, while direct loads and refreshes resolve the same section.
- Critical identity data renders immediately. Optional section data loads
  independently with a timeout and section-local terminal state.
- In-memory cache prevents duplicate requests during one page visit. Related
  mutations invalidate only their own cache entry.
- PHP endpoints derive the user ID exclusively from the verified session.

The login password control is a real button adjacent to the password input. It
toggles only `type="password"` and `type="text"`, keeps the entered value and
autocomplete behavior, supports keyboard use, and updates `aria-label` and
`aria-pressed`.

The login also uses the four supplied transparent PNG files from the
case-sensitive `images/` directory as a decorative password-state animation:

1. `holka odkryté oči.png`
2. `zakrývání 1.png`
3. `zakrývání 2.png`
4. `holka zakryté oči.png`

One stable fixed container is anchored to the bottom-right viewport edge and
shows exactly one frame at a time. All frames are preloaded. Showing the
password advances toward frame 4; hiding it reverses toward frame 1. A new
toggle cancels the pending timer and continues from the currently visible
frame, so rapid clicks cannot create overlapping animation loops or end in the
wrong state. Reduced-motion users jump directly to the target frame.

The decoration is `aria-hidden`, non-focusable, non-selectable and ignores
pointer events. It never changes form geometry, is hidden when the available
viewport would risk covering the login card, and cannot create horizontal
overflow. The supplied files are used unchanged.

## Data flow and profile

The page uses the embedded bootstrap user for the header and profile shell,
then loads overview summaries independently. `api/me.php` returns safe user
fields only. A dedicated overview endpoint returns calculated, display-ready
profile/security/activity summaries without exposing raw sensitive records.

Profile editing keeps original and draft values separately. Save is enabled
only when a valid value changed. Server-side and client-side nickname rules are
identical: 3–30 ASCII letters, numbers, underscore, and period. Availability
checks are debounced and superseded requests are aborted.

Successful mutation responses return the updated safe user, update header and
form state without reload, and announce the result through a toast and
`aria-live`. Navigation with dirty profile changes opens a confirmation dialog.

Email is read-only in the first slice. Its later change flow requires password
confirmation, a time-limited one-use token stored only as a hash, and keeps the
old email active until the new address is verified.

Avatar display uses a real photo when present and deterministic initials
otherwise. Upload will use a server endpoint, content/type verification and a
private, constrained storage path for the authenticated user. Accepted formats
are JPG, PNG, and WebP up to 5 MB. Arbitrary client-provided avatar URLs are not
accepted.

## Security model

Passwords are never trimmed or normalized. New passwords require at least
eight characters, one uppercase letter, one lowercase letter, one number and
one special character, with a 72-byte bcrypt ceiling. Password changes require
the current password, revoke other sessions and create an audit event.

State-changing requests use session-bound CSRF protection plus origin
validation. Cookies remain `Secure`, `HttpOnly`, and `SameSite=Lax`. Account and
authentication responses remain `no-store`.

2FA activation is a staged TOTP flow: create a pending secret, show QR/manual
key, verify a six-digit code, then activate and show one-time recovery codes.
Recovery codes are stored only as hashes. Disabling 2FA requires a password or
current TOTP code.

Session tokens are never returned to the browser. Session records gain
display-safe device, browser, operating system, anonymized IP, created time and
last activity. Approximate location is shown only when trustworthy server data
exists; otherwise the UI explicitly says it is unavailable. The current
session cannot be revoked through controls intended for other devices.

High-risk operations use recent reauthentication, request throttling, disabled
submitting controls, and exact ownership checks. Destructive confirmation
requires password, the exact text `SMAZAT`, and a final confirmation step.

## Loading, errors, routing, and accessibility

Each section implements:

```text
idle → loading → success | empty | error
```

Every request has a timeout and clears loading state in `finally`. First load
uses a skeleton matching the final geometry. Errors render a compact error card
with a retry action. Empty data renders an explanatory empty state and relevant
next action. One failed endpoint never replaces the entire account page with a
spinner.

Navigation updates the URL and document title. Browser back/forward works.
Unknown account paths fall back to Overview without a redirect loop. Cached
section data remains visible when navigating back.

All controls have visible `:focus-visible` treatment, labels and appropriate
ARIA attributes. Dialogs trap focus, close on Escape, restore focus to their
trigger, and use correct dialog roles. Toast and validation feedback use
`aria-live`. Motion is limited to approximately 150–250 ms and is disabled by
`prefers-reduced-motion`.

## Verification

Each behavior is implemented test-first. PHP tests cover endpoint method/auth
contracts, safe response fields, validation, ownership, and failure mapping.
Static page tests cover semantic markup and routing hooks. Browser verification
covers desktop/mobile layout, keyboard navigation, password visibility,
back/forward routing, per-section loading/error/empty states, dialogs, dirty
form protection, and successful profile updates using test data only.

No production database, authentication, subscription, or deletion mutation is
used during visual/browser verification.
