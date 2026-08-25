# Orbit Logo and Services Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the supplied VeVit logo inside the hero orbit and replace misleading Services utility copy with the approved services-marketplace positioning.

**Architecture:** Reuse the existing orbit markup and CSS without touching animation geometry. Store all changed Services copy in the active Czech `ui.js` landing namespace and hydrate the existing HTML positions with `data-ui-text`.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, PHP regression test, Chromium browser verification.

---

### Task 1: Add regression coverage

**Files:**
- Modify: `tests/copy-p0-test.php`

- [x] Assert that `.orbit-core` contains `images/logo_text.png` and no legacy `Ve / CORE` text.
- [x] Assert that the three Services descriptions and metadata bind to `landing.services.*` keys.
- [x] Assert that the approved guild-board copy exists in `assets/js/ui.js`.
- [x] Run `php tests/copy-p0-test.php` and confirm the new assertions fail for the missing implementation.

### Task 2: Implement the approved logo and copy

**Files:**
- Modify: `index.html`
- Modify: `assets/css/main.css`
- Modify: `assets/js/ui.js`

- [x] Replace the two legacy orbit text spans with a decorative image using `images/logo_text.png`.
- [x] Add a scoped `.orbit-core-logo` rule with contained dimensions and no layout or animation changes.
- [x] Add `landing.services` Czech translations for navigation, card, metadata, and roadmap.
- [x] Replace only the affected Services literals in `index.html` with `data-ui-text` bindings.
- [x] Run `php tests/copy-p0-test.php` and confirm it passes.

### Task 3: Verify visually and document

**Files:**
- Modify: `copy-audit.md`
- Create: screenshot under `/tmp` for review only

- [x] Serve the unchanged PHP/static application locally.
- [x] Inspect the orbit at desktop viewport size in Chromium and confirm logo edge/text contrast against the dark core.
- [x] Save a focused screenshot and provide it to the user before any commit.
- [x] Record the implemented file-level changes in `copy-audit.md`.
