# VeVit support page and link repair design

Date: 2026-08-02
Status: user-approved visual direction B2, pending written-spec review

## Goal

Create a standalone `support.html` page for VeVit with searchable FAQ content, application-specific navigation, and its own support and bug-report form. Repair broken, placeholder, generic, or unsafe homepage links at the same time.

The page must match the existing VeVit portal rather than introduce a separate visual system. Public text must stay direct and factual. It must not invent documentation, service guarantees, response times, or a status platform that does not exist.

## Approved visual direction

Use the approved B2 layout:

- Existing dark VeVit visual language, Sora typography, emerald accent, borders, and restrained card treatment.
- Compact header with VeVit wordmark, link back to the homepage, application navigation, and the active Support item.
- Centered introduction headed `Nápověda a časté otázky`.
- A prominent search field directly below the introduction.
- Two-column desktop content with category navigation on the left and FAQ content on the right.
- Category navigation becomes a compact responsive grid or horizontal control on mobile.
- The support form appears below the FAQ list on the same page.
- Quick links for Account access, reporting a bug, and direct contact appear below the main content.

## Page structure

### Header

- Wordmark links to `/`.
- `Domů` links to `/`.
- `Aplikace` links to `/#platforms`.
- `Podpora` identifies the current page and links to `/support.html`.
- Account actions use the confirmed public routes:
  - Sign in: `https://account.vevit.cz/login`
  - Register: `https://account.vevit.cz/register.html`

### Hero and search

- Heading: `Nápověda a časté otázky`.
- Supporting text: `Najděte odpověď nebo nám rovnou napište.`
- Search is client-side and filters FAQ questions and answers as the visitor types.
- Matching is case-insensitive and ignores Czech diacritics so common unaccented searches still work.
- A visible empty state explains that no answer matched and points to the form.
- Search uses a proper label, search input semantics, and an `aria-live` result count.

### FAQ categories

The initial category set is:

- Vše
- Account
- Tools
- Edu
- Services
- Ostatní

Each question carries one category. Search and category filters combine: a question is visible only when it matches both the current category and search text.

FAQ answers cover only verified public behavior:

1. Account sign-in and registration, with the confirmed routes.
2. Password reset, linked to the Account recovery page already exposed by the login page.
3. Local file processing in browser-based tools, with wording that says most tools rather than all tools.
4. How to report a broken tool or application.
5. What information to include in a useful bug report.
6. Availability of VeVit Tools and the current beta applications.
7. Where to find the public roadmap.
8. How to contact VeVit directly.

Questions use native buttons with `aria-expanded` and connected answer regions. Opening one answer must work with keyboard and touch. JavaScript enhances the accordion, but all answers remain readable without JavaScript.

### Support and bug-report form

The page contains its own form with:

- Name, required.
- Email, required and validated by the browser.
- Application, required select with General, Account, Tools, Edu, Services, Studios, and Art.
- Request type, required select with Dotaz, Nahlášení chyby, and Zpětná vazba.
- Message, required.

Submission reuses the homepage FormSubmit integration to `info@vevit.cz`; no API key or secret is placed in browser code. The request subject includes the selected application and request type. The form shows sending, success, and failure states in an `aria-live` region, disables the submit button while sending, and retains the entered data on failure. No response-time promise is shown.

### Footer

- Use the dynamic copyright pattern already present on the homepage: `© 2025 - current year VeVit`.
- Link to the homepage, support page, FAQ anchor, support form anchor, verified social profiles, and confirmed Account routes.
- Do not add a Status link unless a functioning status page exists.
- Do not add a generic or guessed Ko-fi destination.

## Homepage link repair

The link audit found the following root causes and required corrections:

| Existing destination | Problem | Replacement |
| --- | --- | --- |
| `href="#"` on wordmark | Empty fragment | `/` |
| `https://account.vevit.cz/login.php` | Returns 404 | `https://account.vevit.cz/login` |
| `https://account.vevit.cz/register.php` | Returns 404 | `https://account.vevit.cz/register.html` |
| `https://account.vevit.cz/premium` | Returns 404 | `#premium` on homepage |
| Footer `Premium` with `href="#"` | Empty fragment | `#premium` |
| Footer `Kontakt` with `href="#"` | Empty fragment | `/support.html#contact` |
| Footer `FAQ` with `href="#"` | Empty fragment | `/support.html#faq` |
| Footer `Status` with `href="#"` | No status page exists | Replace item with `Nahlásit chybu` linking to `/support.html#contact` |
| Generic `https://github.com` | Does not lead to VeVit | `https://github.com/VeVitOfficial` |
| Generic `https://twitter.com` | Does not lead to VeVit | `https://x.com/VeVitOfficial` |
| Generic Ko-fi homepage links | No verified VeVit profile route found | Remove them until an exact profile is supplied |
| `https://games.vevit.cz` | Public TLS certificate does not match the hostname | Link to `/#roadmap` until the Games hostname has a valid certificate |

The eight latest-tool links remain unchanged because all eight verified routes return HTTP 200.

## Files and boundaries

- Add `support.html` for the page markup.
- Add `assets/css/support.css` for page-specific styles while reusing tokens and base components from existing CSS.
- Add `assets/js/support.js` for FAQ search, category filtering, accordion behavior, form submission, and the dynamic year.
- Update `index.html` only for corrected links.
- Update automated tests to validate link targets, eliminate empty fragments, verify FAQ/search/form hooks, and ensure the Account routes remain correct.
- Do not modify other VeVit repositories, DNS, TLS certificates, or production hosting configuration in this change.

## Accessibility and responsive behavior

- A skip link targets the main support content.
- Form fields have visible labels and linked error/status descriptions.
- FAQ controls are real buttons and expose expanded state.
- Search results and form states are announced without moving focus unexpectedly.
- Focus styles remain visible.
- Desktop uses the approved sidebar layout. Tablet and mobile collapse it without horizontal overflow.
- Animations respect `prefers-reduced-motion`.

## Verification

- A regression test first fails on current placeholder and 404 Account links.
- Static tests confirm there are no `href="#"` values in public page markup.
- Static tests confirm the exact Account routes and all support-page section anchors.
- JavaScript syntax checks pass.
- PHP lint and existing copy regression tests pass.
- Browser tests cover FAQ expansion, search filtering, category filtering, the no-results state, support-form validation, dynamic year, keyboard use, and mobile overflow.
- A live HTTP check confirms every externally linked VeVit destination that can be controlled from this repository. The Games certificate remains an external hosting issue and therefore the public link points to the roadmap until it is fixed.

## Out of scope

- A knowledge-base backend or CMS.
- User accounts or support-ticket persistence.
- File attachments in bug reports.
- Live service-status monitoring.
- Publishing or configuring the Games TLS certificate.
- Inventing a Ko-fi profile URL.
