# VeVit Tools — UX audit

Audit date: 2026-08-26  
Baseline: commit `e4c81ef31825faef38fc047ad5972c6a286fb195` plus the current uncommitted Vercel migration work.

## Inventory

- Registry: 107 public tool slugs in 8 categories.
- Interactive implementations: 104 PHP templates and 104 matching JavaScript controllers.
- Information-only pages: `ai-image-gen`, `pdf-password`, `screenshot-tool`.
- Categories: PDF 14, image 14, media 11, text 12, AI 6, developer 23, security 10, calculators 17.
- Rendering remains server-side PHP with progressively enhanced vanilla JavaScript. Existing slugs, localized URLs, registry metadata and processing paths are the compatibility contract.

## Current strengths

- One canonical registry already describes availability, processing location and requirements.
- Most file tools process data locally and already expose that fact in metadata.
- Shared layout, asset loader, icon system and a small `ToolUI` helper exist.
- Seven locale bundles have key parity and tools are statically exportable for Vercel.
- Structural, rate-limit, security and search tests already exist.

## Main UX and implementation gaps

1. Tool pages look like isolated forms instead of one coherent application. Upload, setup, processing and result states are not explicit.
2. File tools usually show filenames only. Preview, metadata, reordering affordances, validation and replacement are inconsistent.
3. Results are commonly downloaded immediately, which removes user control and makes retry or comparison difficult.
4. Errors and progress are mostly plain text; cancellation, recovery and actionable limits are missing.
5. Tool scripts contain Czech strings and locale-specific formatting, so changing language does not translate the entire experience.
6. Keyboard behavior, focus management, live-region announcements and touch target sizes are inconsistent.
7. Media tools depend on WebAssembly but were marked `working` with `requires_browser_support`. That contradicts the registry invariant and caused both the hub test and Vercel export check to fail. They are now classified as `limited` with the requirement retained.
8. Some heavyweight libraries are loaded without a common loading/error lifecycle or object-URL cleanup.
9. Information-only tools need honest explanation and alternatives rather than disabled controls that imply functionality.

## Baseline verification

Run from the repository root before the redesign:

| Check | Baseline result |
| --- | --- |
| `php tools/tests/hub/run-task-1.php` | Failed: `video-convert` was `working` but not `available` |
| `php tools/scripts/export-tools.php --check` | Failed for the same registry invariant |
| `php tools/tests/request-rate-limit-test.php` | Passed |
| `php tools/tests/ssl-checker-test.php` | Passed |
| `node tools/tests/hub/search-test.js` | Passed |
| PHP lint of all 104 templates | Passed |
| JS syntax check of tool and library scripts | Passed |
| `python -m py_compile generate-index.py` | Passed |
| `git diff --check -- tools` | Passed |

## Constraints and risks

- No React, new bundler or CDN dependency. The static Vercel export must remain deterministic.
- ffmpeg.wasm, PDF and image processing can exhaust memory on mobile; the UI must state limits before processing and release temporary URLs afterward.
- AI and server tools may send input outside the browser. Their privacy copy must be derived from registry metadata, not a generic local-processing promise.
- Calculator assumptions, units and locale-dependent currency/date formatting must stay visible and editable.
- Existing user work in the dirty worktree is preserved; generated exports are updated only through the established exporter.

## Definition of done

A tool is complete only when it has a clear initial/input/processing/result/error flow, responsive controls, keyboard operation, localized UI text, honest processing and limit information, deterministic status metadata, and a recorded structural plus browser-oriented test result. The detailed per-tool status lives in `checklist.md`.
