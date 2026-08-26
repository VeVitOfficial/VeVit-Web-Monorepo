# VeVit Tools — 107-tool redesign checklist

Legend: `[ ]` audited only, `[~]` shared foundation applied / tool-specific work pending, `[x]` redesigned and verified, `[i]` intentionally information-only.

The registry is the source of truth. This file tracks UX implementation and verification, not availability policy.

## PDF (14)

- [x] pdf-merge
- [x] pdf-split
- [x] pdf-compress
- [x] pdf-to-word
- [x] html-to-pdf
- [x] invoice-gen
- [x] pdf-to-images
- [x] images-to-pdf
- [x] pdf-rotate — pilot
- [x] pdf-organize — pilot
- [x] pdf-watermark
- [x] pdf-page-numbers
- [x] pdf-extract-text
- [i] pdf-password — honest WEDOS limitation and alternatives only

## Images (14)

- [x] img-compress
- [x] bg-remover
- [x] img-upscaler
- [x] gif-maker
- [i] screenshot-tool — honest WEDOS limitation and alternatives only
- [x] image-convert
- [x] image-crop — pilot
- [x] image-rotate-flip
- [x] image-filters
- [x] image-watermark
- [x] image-exif
- [x] image-collage
- [x] favicon-generator
- [x] meme-generator

## Media (11)

- [x] video-convert
- [x] video-compress
- [x] video-trim — pilot
- [x] audio-convert
- [x] video-thumbnail
- [x] audio-waveform
- [x] video-extract-audio
- [x] video-to-gif
- [x] video-merge
- [x] video-target-size
- [x] audio-trim-normalize

## Text (12)

- [x] translate
- [x] summarize-text
- [x] markdown-editor
- [x] mind-map
- [x] text-counter
- [x] text-case-converter
- [x] lorem-ipsum
- [x] remove-diacritics
- [x] text-to-speech
- [x] text-lines-tool
- [x] grammar-check
- [x] ai-email-writer

## AI (6)

- [x] ai-chat — pilot
- [x] ai-vision
- [x] ai-seo
- [i] ai-image-gen — coming-soon explanation only
- [x] ai-sql-gen
- [x] ai-text-qa

## Developer (23)

- [x] ai-commit-message
- [x] ai-regex-generator
- [x] ai-code-explainer
- [x] regex-tester
- [x] json-formatter — pilot
- [x] gradient-gen
- [x] uuid-gen
- [x] jwt-decoder
- [x] base64-tool
- [x] url-encoder
- [x] jwt-generator
- [x] yaml-json-converter
- [x] csv-json-converter
- [x] cron-builder
- [x] timestamp-converter
- [x] code-diff
- [x] css-js-html-formatter
- [x] contrast-checker
- [x] qr-generator
- [x] og-meta-generator
- [x] gitignore-generator
- [x] fake-data-generator
- [x] color-palette-generator

## Security (10)

- [x] hash-gen
- [x] password-gen
- [x] encrypt-decrypt
- [x] steganography
- [x] certificate-info
- [x] password-strength
- [x] totp-generator
- [x] password-breach-check
- [x] file-encryption
- [x] token-generator

## Calculators (17)

- [x] percentage-calc
- [x] loan-calc — pilot
- [x] unit-converter
- [x] color-converter
- [x] number-base-converter
- [x] bmi-calc
- [x] discount-calc
- [x] vat-calc
- [x] net-salary-calc
- [x] date-diff-calc
- [x] compound-interest-calc
- [x] grade-average-calc
- [x] fuel-consumption-calc
- [x] bmr-calc
- [x] time-calc
- [x] iban-converter
- [x] birth-number-validator

## Completion evidence

| Check | Result |
| --- | --- |
| Registry count/status validation | PASS — 107 routes and metadata invariant |
| 104 PHP templates lint | PASS |
| 104 controllers syntax | PASS |
| Seven-locale key parity | PASS — 1,256 keys per locale |
| Representative keyboard/mobile smoke tests | PASS — 50 checks at 320/375/768/1024/1440 px |
| Static exporter check | PASS — 107 × 7 localized routes regenerated |
| Vercel production build | PASS — Next.js 16.3.2 |


## Final 107-tool status

“Implemented” means the shared redesign contract is active on the tool route; the richer pilot-specific behavior is named explicitly where applicable. “Information-only” means the route intentionally performs no operation.

| Tool | Status | Implemented change |
| --- | --- | --- |
| `pdf-merge` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `pdf-split` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `pdf-compress` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `pdf-to-word` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `html-to-pdf` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `invoice-gen` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `pdf-to-images` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `images-to-pdf` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `pdf-rotate` | implemented | DocumentPageGrid thumbnails, page selection, live rotation preview and persistent PDF result. |
| `pdf-organize` | implemented | Thumbnail grid, drag/keyboard reorder, remove, undo and persistent PDF result. |
| `pdf-watermark` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `pdf-page-numbers` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `pdf-extract-text` | implemented | Accessible validated PDF input, honest local-processing details, unified lifecycle and persistent result/download card. |
| `pdf-password` | information-only | No fake action; explains the real limitation, sends nothing and offers a safe alternative. |
| `img-compress` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `bg-remover` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `img-upscaler` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `gif-maker` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `screenshot-tool` | information-only | No fake action; explains the real limitation, sends nothing and offers a safe alternative. |
| `image-convert` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `image-crop` | implemented | Canvas crop plus numeric keyboard controls, presets, output preview and explicit download. |
| `image-rotate-flip` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `image-filters` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `image-watermark` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `image-exif` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `image-collage` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `favicon-generator` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `meme-generator` | implemented | Validated image input, responsive preview-ready workspace, resource cleanup and persistent result/download card. |
| `video-convert` | implemented | Capability/size-aware media input, processing lifecycle, ffmpeg/browser limits and persistent result/download card. |
| `video-compress` | implemented | Capability/size-aware media input, processing lifecycle, ffmpeg/browser limits and persistent result/download card. |
| `video-trim` | implemented | Player, synchronized in/out controls, mode choice, cancellable ffmpeg job and output player. |
| `audio-convert` | implemented | Capability/size-aware media input, processing lifecycle, ffmpeg/browser limits and persistent result/download card. |
| `video-thumbnail` | implemented | Capability/size-aware media input, processing lifecycle, ffmpeg/browser limits and persistent result/download card. |
| `audio-waveform` | implemented | Capability/size-aware media input, processing lifecycle, ffmpeg/browser limits and persistent result/download card. |
| `video-extract-audio` | implemented | Capability/size-aware media input, processing lifecycle, ffmpeg/browser limits and persistent result/download card. |
| `video-to-gif` | implemented | Capability/size-aware media input, processing lifecycle, ffmpeg/browser limits and persistent result/download card. |
| `video-merge` | implemented | Capability/size-aware media input, processing lifecycle, ffmpeg/browser limits and persistent result/download card. |
| `video-target-size` | implemented | Capability/size-aware media input, processing lifecycle, ffmpeg/browser limits and persistent result/download card. |
| `audio-trim-normalize` | implemented | Capability/size-aware media input, processing lifecycle, ffmpeg/browser limits and persistent result/download card. |
| `translate` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `summarize-text` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `markdown-editor` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `mind-map` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `text-counter` | implemented | Live localized counts, editor metadata and responsive KPI result. |
| `text-case-converter` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `lorem-ipsum` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `remove-diacritics` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `text-to-speech` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `text-lines-tool` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `ai-chat` | implemented | Starter prompts, new chat, autosize input, streaming/stop state, response/code copy, retry and privacy warning. |
| `ai-vision` | implemented | Explicit external-AI disclosure, shared streaming/error lifecycle, preserved input and retry-ready result workflow. |
| `ai-seo` | implemented | Explicit external-AI disclosure, shared streaming/error lifecycle, preserved input and retry-ready result workflow. |
| `ai-image-gen` | information-only | No fake action; explains the real limitation, sends nothing and offers a safe alternative. |
| `ai-sql-gen` | implemented | Explicit external-AI disclosure, shared streaming/error lifecycle, preserved input and retry-ready result workflow. |
| `grammar-check` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `ai-email-writer` | implemented | Responsive editor, live input metadata, localized processing state, copy/result workflow and privacy disclosure. |
| `ai-text-qa` | implemented | Explicit external-AI disclosure, shared streaming/error lifecycle, preserved input and retry-ready result workflow. |
| `ai-commit-message` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `ai-regex-generator` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `ai-code-explainer` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `regex-tester` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `json-formatter` | implemented | Two-pane editor, live size/line metadata, inline parse errors, copy and JSON download. |
| `gradient-gen` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `uuid-gen` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `jwt-decoder` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `base64-tool` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `url-encoder` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `jwt-generator` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `yaml-json-converter` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `csv-json-converter` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `cron-builder` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `timestamp-converter` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `code-diff` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `css-js-html-formatter` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `contrast-checker` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `qr-generator` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `og-meta-generator` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `gitignore-generator` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `fake-data-generator` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `color-palette-generator` | implemented | Responsive editor controls, live text metadata, inline error state, localized copy and persistent result workflow. |
| `hash-gen` | implemented | Sensitive-field hardening, no persistence, local/server disclosure, accessible validation and explicit result action. |
| `password-gen` | implemented | Character/passphrase modes, ambiguity filter, Web Crypto, entropy estimate and safe copy. |
| `encrypt-decrypt` | implemented | Sensitive-field hardening, no persistence, local/server disclosure, accessible validation and explicit result action. |
| `steganography` | implemented | Sensitive-field hardening, no persistence, local/server disclosure, accessible validation and explicit result action. |
| `certificate-info` | implemented | Sensitive-field hardening, no persistence, local/server disclosure, accessible validation and explicit result action. |
| `password-strength` | implemented | Sensitive-field hardening, no persistence, local/server disclosure, accessible validation and explicit result action. |
| `totp-generator` | implemented | Sensitive-field hardening, no persistence, local/server disclosure, accessible validation and explicit result action. |
| `password-breach-check` | implemented | Sensitive-field hardening, no persistence, local/server disclosure, accessible validation and explicit result action. |
| `file-encryption` | implemented | Sensitive-field hardening, no persistence, local/server disclosure, accessible validation and explicit result action. |
| `token-generator` | implemented | Sensitive-field hardening, no persistence, local/server disclosure, accessible validation and explicit result action. |
| `percentage-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `loan-calc` | implemented | Localized output, extra-payment scenario, composition chart, amortization and print result. |
| `unit-converter` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `color-converter` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `number-base-converter` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `bmi-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `discount-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `vat-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `net-salary-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `date-diff-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `compound-interest-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `grade-average-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `fuel-consumption-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `bmr-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `time-calc` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `iban-converter` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |
| `birth-number-validator` | implemented | 44px numeric controls, locale-aware values, live result state, responsive KPIs/tables and visible methodology note. |

## Known limits and follow-up work

- Browser/WASM media tools remain subject to the documented 100 MB input limit and available device memory; cancellation terminates the active worker.
- Rich PDF previews are intentionally capped at 24 pages for rotation and 60 pages for organization to keep interaction responsive.
- Automated binary happy-path coverage currently exercises PDF rotation and image cropping. Video/WASM behavior is covered by loading, validation and cancellation checks, but not a full encoded-output fixture.
- AI screens have automated interaction, interruption and error-state coverage; live model output is not invoked by the deterministic test suite because it depends on the external AI service.
- `ai-image-gen`, `pdf-password` and `screenshot-tool` remain honest information-only screens until their required backend/browser capability exists.
