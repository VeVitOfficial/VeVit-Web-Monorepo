# VeVit Tools — redesign execution plan

This is an implementation plan for all 107 registered tools. It deliberately keeps PHP rendering and vanilla JavaScript, and introduces reusable primitives before tool-specific markup.

## Architecture decisions

1. **Progressive enhancement.** Every page renders its title, purpose, status, privacy and primary inputs in PHP. JavaScript adds processing and rich preview behavior.
2. **Registry remains canonical.** Availability, processing location, requirements and privacy are read from `registry.php`; UI code does not duplicate hosting policy.
3. **One shared lifecycle.** `ToolUI` owns `idle`, `ready`, `processing`, `success` and `error` states, live announcements, inline errors, progress, cancellation and cleanup.
4. **Reusable components.** Drop zone, file card/grid, settings panel, action bar, result card, empty state, segmented controls and disclosure styles live in shared CSS/JS.
5. **Localized runtime dictionary.** PHP injects only the current locale's escaped ToolUI strings as JSON. Tool scripts use keys and parameters instead of hardcoded Czech messages.
6. **No surprise downloads.** New and redesigned flows show an explicit result card with preview, filename/size where available and a deliberate download action. Batch tools offer per-item and ZIP actions where their existing libraries support it.
7. **Resource hygiene.** Object URLs, workers and abort controllers are registered with the tool lifecycle and released on replacement, reset, completion or page exit.
8. **Responsive by default.** Desktop split views collapse into a single logical order; sticky actions use safe-area padding; controls have at least 44 px touch targets and never require horizontal page scrolling.

## Delivery sequence

### Phase 1 — foundation

- Correct registry status invariants and preserve export compatibility.
- Add shared state shell, status/live region, validation, action/result components and responsive styles.
- Add runtime translations for common interaction messages in all seven locales.
- Add structural tests for registry/template/script parity and component hooks.

### Phase 2 — representative pilots

- `pdf-rotate`: page thumbnails, rotation selection, range feedback and result step.
- `pdf-organize`: thumbnail grid, reorder/remove, undo and output summary.
- `image-crop`: accessible numeric crop controls beside canvas interaction, presets and preview.
- `video-trim`: media preview, range summary, capability/size warning, progress and cancellation.
- `json-formatter`: editor workspace, validation location, copy/download and explicit output state.
- `ai-chat`: starter prompts, readable message actions, sending/streaming states and privacy.
- `loan-calc`: editable assumptions, localized summary, chart/table disclosure and print-friendly result.

### Phase 3 — category rollout

- PDF and images: shared file-preview workflow, batch handling and deterministic result cards.
- Media: browser capability gate, duration/range controls, resource estimates and cancellation.
- Text and AI: editor/chat patterns, copy/download actions, external-processing disclosure and retry.
- Developer and security: paired input/output workspaces, safe reveal/copy patterns and validation details.
- Calculators: shared field groups, units, localized numeric output, assumptions and compact result visualizations.

### Phase 4 — QA and export

- Run locale parity, PHP lint, JS syntax, structural and service tests.
- Exercise representative flows at 360, 768 and 1440 px and with keyboard only.
- Verify light/dark contrast, reduced motion, focus visibility and long translated labels.
- Regenerate the static Vercel export, run its check, then run the production build.
- Record final status, known browser limits and test evidence in `checklist.md`.

## Test matrix

| Layer | Required evidence |
| --- | --- |
| Registry | 107 unique slugs; valid status/availability combinations; info-only tools load no controller |
| Templates | PHP lint; labels connected to controls; heading order; state/status container present |
| Scripts | Syntax check; no user-facing hardcoded Czech; cleanup registered for temporary resources |
| Interaction | Upload/select, invalid input, process, cancel where applicable, success, retry/reset |
| Accessibility | Keyboard reachability, visible focus, live progress/errors, reduced motion, 200% zoom |
| Responsive | 360/768/1440 px, portrait/landscape media preview, sticky action without overlap |
| Localization | cs/en/de/es/uk/fr/sk key parity and long-label layout |
| Deployment | exporter `--check`, Vercel production build and direct localized route load |

## Rollback boundaries

Shared primitives are additive and tool controllers keep their existing processing functions. A tool can therefore fall back to its previous form markup independently without changing its slug, registry entry or exported route. Processing algorithms are changed only when a verified UX bug requires it.
