# VeVit Support Page and Link Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved B2 support page and replace every broken, empty, generic, or currently unsafe homepage link with a verified destination.

**Architecture:** Add a standalone static `support.html` page that reuses the portal design tokens and adds focused page styles and JavaScript. Keep FAQ data in semantic HTML, then progressively enhance it with category/search filtering and accessible accordion controls. Reuse the existing FormSubmit delivery pattern without introducing browser-visible secrets or a new backend.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, PHP source-level regression tests, Playwright browser verification.

**Repository note:** The checkout has an empty `.git` directory and is not a functional Git repository. Commit steps are replaced by explicit verification checkpoints; do not initialize Git.

---

## File map

- Create `support.html`: semantic support page, FAQ content, form, verified navigation, and footer.
- Create `assets/css/support.css`: B2 layout, responsive category navigation, FAQ, form, focus, and reduced-motion styles.
- Create `assets/js/support.js`: FAQ accordion, combined search/category filtering, no-result state, form submission, and dynamic year.
- Create `tests/support-page-test.php`: source-level contract for the support page and link repairs.
- Modify `index.html`: correct homepage destinations and remove unsupported generic destinations.

### Task 1: Lock the link contract with a failing test

**Files:**
- Create: `tests/support-page-test.php`
- Inspect: `index.html`

- [ ] **Step 1: Write the failing homepage-link assertions**

Create a PHP test that loads `index.html` and fails unless all of these statements are true:

```php
$requiredHomepageLinks = [
    'href="/"',
    'href="https://account.vevit.cz/login"',
    'href="https://account.vevit.cz/register.html"',
    'href="#premium"',
    'href="/support.html#contact"',
    'href="/support.html#faq"',
    'href="https://github.com/VeVitOfficial"',
    'href="https://x.com/VeVitOfficial"',
];

foreach ($requiredHomepageLinks as $link) {
    expect_support(str_contains($home, $link), "Missing homepage link: {$link}");
}

foreach (['href="#"', '/login.php', '/register.php', '/premium"',
          'href="https://github.com"', 'href="https://twitter.com"',
          'href="https://ko-fi.com"', 'href="https://games.vevit.cz"'] as $broken) {
    expect_support(!str_contains($home, $broken), "Broken homepage destination remains: {$broken}");
}
```

- [ ] **Step 2: Run the test and verify RED**

Run: `php tests/support-page-test.php`

Expected: FAIL listing current empty fragments, `.php` Account routes, generic social/support links, missing support page, and unsafe Games destination.

### Task 2: Repair homepage links

**Files:**
- Modify: `index.html`
- Test: `tests/support-page-test.php`

- [ ] **Step 1: Replace the confirmed broken targets**

Apply this mapping consistently in desktop navigation, mobile navigation, Premium, and footer:

```text
# wordmark                         -> /
account.vevit.cz/login.php        -> account.vevit.cz/login
account.vevit.cz/register.php     -> account.vevit.cz/register.html
account.vevit.cz/premium          -> #premium
footer Premium #                  -> #premium
footer Kontakt #                  -> /support.html#contact
footer FAQ #                      -> /support.html#faq
footer Status #                   -> /support.html#contact, label Nahlásit chybu
github.com                        -> github.com/VeVitOfficial
twitter.com                       -> x.com/VeVitOfficial
games.vevit.cz                    -> /#roadmap
generic Ko-fi links               -> remove; use /support.html#contact only where a CTA must remain
```

- [ ] **Step 2: Run the test and record the remaining expected support-page failures**

Run: `php tests/support-page-test.php`

Expected: homepage link assertions PASS; support-page file assertions still FAIL because the page is not created yet.

### Task 3: Add semantic support-page markup

**Files:**
- Create: `support.html`
- Modify: `tests/support-page-test.php`

- [ ] **Step 1: Add failing support-page structure assertions**

The test must require:

```php
$requiredSupportHooks = [
    'id="support-main"',
    'id="support-search"',
    'data-support-category="all"',
    'id="faq"',
    'data-faq-item',
    'data-faq-question',
    'aria-expanded="false"',
    'id="support-no-results"',
    'id="contact"',
    'id="support-form"',
    'name="application"',
    'name="request_type"',
    'id="support-status"',
    'data-current-year',
    'assets/css/support.css',
    'assets/js/support.js',
];
```

Require the exact confirmed Account targets and at least eight `data-faq-item` articles. Require category values `account`, `tools`, `edu`, `services`, and `other` in the FAQ data.

- [ ] **Step 2: Run the test and verify RED**

Run: `php tests/support-page-test.php`

Expected: FAIL because `support.html` and its required hooks do not exist.

- [ ] **Step 3: Create `support.html` with the approved B2 hierarchy**

The document must contain:

```html
<a class="skip-link" href="#support-main">Přejít k obsahu</a>
<main id="support-main">
  <header class="support-hero">
    <span class="eyebrow">Centrum podpory</span>
    <h1>Nápověda a časté otázky</h1>
    <p>Najděte odpověď nebo nám rovnou napište.</p>
    <label class="sr-only" for="support-search">Hledat v otázkách a odpovědích</label>
    <input id="support-search" type="search" autocomplete="off"
           placeholder="Hledat v otázkách a nápovědě...">
    <p data-support-result-count role="status" aria-live="polite"></p>
  </header>
</main>
```

Add category buttons for all six approved categories. Add eight FAQ articles with question buttons and answer regions. Every article has `data-faq-item` and one of the approved category values. Answers use factual wording from the spec and direct links to Account, roadmap, contact, or Tools where relevant.

Add the support form with required `name`, `email`, `application`, `request_type`, and `message` controls. Add `support-status` with `role="status" aria-live="polite" hidden`.

- [ ] **Step 4: Run the source test**

Run: `php tests/support-page-test.php`

Expected: markup assertions PASS; missing CSS/JavaScript behavior assertions remain RED.

### Task 4: Implement FAQ, search, and category behavior

**Files:**
- Create: `assets/js/support.js`
- Test: `tests/support-page-test.php`

- [ ] **Step 1: Add failing JavaScript contract assertions**

Require these named units and state hooks in `support.js`:

```php
foreach (['normalizeSearch', 'filterFaq', 'initFaq', 'initSupportForm',
          'new Date().getFullYear()', 'FormSubmit'] as $needle) {
    expect_support(str_contains($supportJs, $needle), "Missing support behavior: {$needle}");
}
```

- [ ] **Step 2: Run the test and verify RED**

Run: `php tests/support-page-test.php`

Expected: FAIL because `assets/js/support.js` does not exist.

- [ ] **Step 3: Implement search normalization and combined filtering**

Use this behavior contract:

```js
const normalizeSearch = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('cs-CZ')
  .trim();

const filterFaq = () => {
  const query = normalizeSearch(search.value);
  let visible = 0;
  items.forEach((item) => {
    const categoryMatch = activeCategory === 'all' || item.dataset.category === activeCategory;
    const textMatch = normalizeSearch(item.textContent).includes(query);
    item.hidden = !(categoryMatch && textMatch);
    if (!item.hidden) visible += 1;
  });
  noResults.hidden = visible !== 0;
  resultCount.textContent = visible === 1 ? '1 nalezená odpověď' : `${visible} nalezených odpovědí`;
};
```

Category button activation updates `aria-pressed`, sets the active category, and calls `filterFaq()`. Search calls `filterFaq()` on `input`.

- [ ] **Step 4: Implement accessible FAQ expansion**

Each question button toggles its own `aria-expanded` state and the `hidden` state of the answer referenced by `aria-controls`. Do not require JavaScript for answer content to exist in the document.

- [ ] **Step 5: Run the test**

Run: `php tests/support-page-test.php && node --check assets/js/support.js`

Expected: PASS for source contracts and JavaScript syntax.

### Task 5: Implement support-form submission

**Files:**
- Modify: `assets/js/support.js`
- Test: `tests/support-page-test.php`

- [ ] **Step 1: Add failing form-flow assertions**

Require `fetch('https://formsubmit.co/ajax/info@vevit.cz'`, `form.checkValidity()`, `form.reportValidity()`, button disabling, success text, error text, and `aria-live` status output.

- [ ] **Step 2: Run the test and verify RED**

Run: `php tests/support-page-test.php`

Expected: FAIL on missing submission flow.

- [ ] **Step 3: Implement the minimal submission flow**

On submit:

1. Prevent default submission.
2. Stop and call `reportValidity()` when `checkValidity()` is false.
3. Build the payload from `FormData`.
4. Set `_subject` to `VeVit podpora: <application> / <request_type>` and `_template` to `table`.
5. Disable the button and show `Odesílám...`.
6. POST JSON to the existing FormSubmit endpoint.
7. On success, show `Zpráva byla odeslána. Děkujeme.`, reset the form, and keep the status visible.
8. On failure, show `Zprávu se nepodařilo odeslat. Napište na info@vevit.cz.`, preserve form values, and mark the status as an error.
9. Restore the submit button in `finally`.

- [ ] **Step 4: Run source and syntax tests**

Run: `php tests/support-page-test.php && node --check assets/js/support.js`

Expected: PASS.

### Task 6: Implement the approved B2 visual system

**Files:**
- Create: `assets/css/support.css`
- Test: `tests/support-page-test.php`

- [ ] **Step 1: Add failing CSS contract assertions**

Require selectors `.support-hero`, `.support-search`, `.support-layout`, `.support-categories`, `.faq-item`, `.support-form`, `.support-no-results`, `:focus-visible`, a mobile media query, and `prefers-reduced-motion`.

- [ ] **Step 2: Run the test and verify RED**

Run: `php tests/support-page-test.php`

Expected: FAIL because support styles do not exist.

- [ ] **Step 3: Add the page styles**

Reuse the variables from `assets/css/main.css`. Implement a centered hero, bordered search field, `minmax(0, 1fr)` content column, 220 px desktop category sidebar, restrained FAQ separators, and the existing emerald button treatment. At widths below 760 px, collapse the layout to one column and render category buttons in a wrapping grid. Include visible `:focus-visible` outlines and disable transitions under `prefers-reduced-motion: reduce`.

- [ ] **Step 4: Run the source test**

Run: `php tests/support-page-test.php`

Expected: PASS.

### Task 7: Browser and live-link verification

**Files:**
- Verify: `index.html`
- Verify: `support.html`
- Verify: `assets/css/support.css`
- Verify: `assets/js/support.js`
- Verify: `tests/copy-p0-test.php`
- Verify: `tests/support-page-test.php`

- [ ] **Step 1: Run all local static checks**

Run:

```bash
php tests/copy-p0-test.php
php tests/support-page-test.php
php -l tests/support-page-test.php
node --check assets/js/app.js
node --check assets/js/support.js
```

Expected: all PASS or exit 0 with no syntax errors.

- [ ] **Step 2: Verify browser behavior at desktop and mobile sizes**

Use Chromium against localhost and assert:

- `/support.html` returns 200.
- Eight FAQ items render.
- Searching `prihlaseni` finds the Account answer despite omitted diacritics.
- Selecting Tools hides non-Tools answers.
- A nonsense search shows the no-results state.
- An FAQ question toggles `aria-expanded` and its answer visibility.
- An empty form does not submit and browser validation is active.
- The displayed copyright is `2025 - <current year>`.
- Desktop and 390 px mobile layouts have no horizontal overflow.

- [ ] **Step 3: Recheck live destinations**

Confirm HTTP 200 for Tools, Edu, Account login, Account registration, Services, Studios, Art, all eight latest-tool routes, Instagram, X, Discord, and GitHub. Do not link Games until its certificate is valid. Report any third-party anti-bot response separately rather than calling it a page failure.

- [ ] **Step 4: Record the implementation checkpoint**

Because Git is unavailable, report the exact changed files and test outputs instead of claiming a commit was created.
