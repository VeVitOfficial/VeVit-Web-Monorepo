# VeVit Tools — univerzální konvertory (Fáze 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tři konvertory (Video / Audio / Text) jako první obsah hubu nástrojů. Každý rozpozná jakýkoliv soubor své kategorie z katalogu všech známých formátů a převede ho v prohlížeči tam, kam to jde.

**Architecture:** Čisté TS moduly v `src/lib/convert/**` (katalog formátů, rozpoznání podle magic bytes, plánování ffmpeg/textových převodů, kódování, titulky, data) jsou testované přes `node --test`. Klientské enginy obalují vendorovaný ffmpeg.wasm (WORKERFS mount, průběh, zrušení) a pandoc.wasm (gated). Sdílená React komponenta `ConverterApp` obsluhuje všechny tři druhy. Hub dostane `ConverterLaunchers` a předávání souborů v paměti (handoff).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, node:test, playwright-core (e2e + generátory schopností). Vendor v `public/tools/assets/js/lib/`: ffmpeg.wasm 0.12 (core 0.12.10), pandoc.wasm 3.9 (`wasm-pandoc` 1.0.1, gated), pdf.js, js-yaml, marked, DOMPurify.

**Spec:** `docs/superpowers/specs/2026-10-24-vevit-tools-brainstorm-konvertory-design.md` (sekce 3 = požadavky, sekce 6 = rozhodnutí)

## Global Constraints

- Před zásahem do routingu/stránek si přečti příslušný guide v `node_modules/next/dist/docs/` (Next 16 má breaking changes, viz `AGENTS.md`).
- Žádné nové npm závislosti. Těžké knihovny se vendorují do `public/tools/assets/js/lib/<lib>/` s `VENDOR.md` (verze, zdroj, licence) a načítají se přes `loadScript()` / dynamický import / Worker.
- `public/tools/assets/**` má `Cache-Control: immutable` na 1 rok. Každý změněný nebo nový soubor tam se referencuje s `?v=20261024a` (při další změně ve stejný den `b`, `c`…).
- Moduly v `src/lib/convert/**` (kromě `*-engine.ts` a `run-text.ts`) musí jít importovat z `node --test`: relativní importy s příponou `.ts`, typy jen přes `import type`, žádné `enum`/`namespace`/parameter properties, žádné `@/…` runtime importy.
- Vše běží v prohlížeči, žádný upload. Patička konvertorů: „Soubor neopouští váš prohlížeč.“
- Převedené HTML se na originu VeVit nikdy nevykreslí bez DOMPurify. Náhled jde do `<iframe sandbox="">`, tisk do iframe se sanitizovaným `srcdoc`.
- Limity: `MAX_MOUNT_BYTES = 2 * 1024 ** 3`, `MAX_MEMORY_BYTES = 300 * 1024 ** 2`, `WARN_BYTES = 500 * 1024 ** 2`.
- UI řetězce konvertorů se píšou ve všech 7 jazycích (cs/en/de/es/uk/fr/sk). Popisy formátů v katalogu jen cs + en (jiné jazyky → en).
- ClassName nových prvků začínají `cv-` (konvertor) nebo `hub-launcher` / `hub-drop-` (hub). Styly patří do nové sekce `/* ── Konvertory ── */` na konci `src/styles/tools.css` a používají jeho existující CSS proměnné.
- `src/styles/vevit-tailwind.css` má necommitnutou změnu uživatele: nikdy ji nestageuj (`git add` jen jmenovitě). Build ověřuj přes `npx next build`, ne `npm run build`, protože ten soubor přegeneruje.
- Commit zprávy: `feat(tools): …` / `test(tools): …` / `chore(tools): …`. Každá končí atribučními řádky, které aktuální session dostane v system-reminderu.
- Pracovní větev: `feat/tools-konvertory` ve worktree (superpowers:using-git-worktrees) z `feat/aifb-teorie`. Hlavní větev repa je `master` a nemá nic z React portu nástrojů (`feat/aifb-teorie` je o 69 commitů napřed, z toho 72 souborů v `src/components/tools` + `src/styles/tools.css`).
- Žádný deploy bez výslovného souhlasu uživatele.

## Review Focus

1. **Starý `ffmpeg-wrapper.js` z immutable cache (bez `mount`)** → engine nesmí spadnout. Přepne na kopii do paměti s limitem 300 MB a hláškou. Test: `inputStrategy` v Task 5, verzovaná URL v Task 6.
2. **Soubor se špatnou nebo chybějící příponou** (`.mp3`, který je WAV; `README` bez přípony) → rozhoduje obsah a UI ukáže nesoulad. Test: Task 2 (případy 2, 12).
3. **Zrušit a hned převést znovu** → druhý převod projde (worker se ukončí a znovu načte). Test: Task 15 e2e „cancel then convert“.
4. **Český text/titulky v CP1250** → výstup v UTF-8 se správnou diakritikou, žádné „Ĺ™“. Test: Task 2 (případ 17), Task 7 (`guessEncoding`), Task 15 e2e.
5. **Škodlivý markup v dokumentu uživatele** (raw `<img onerror>` v MD/DOCX → HTML/PDF) → nikdy se nespustí na originu VeVit. Test: Task 15 e2e „xss md preview/print“.

---

## File Structure

```
scripts/
  convert-ffmpeg-caps.mjs          T1  generátor schopností ffmpeg.wasm (playwright-core)
  convert-pandoc-caps.mjs          T9  generátor reader/writer seznamu pandoc.wasm
  fixtures/ffmpeg-wasm-*.txt       T1  surový výstup -formats/-encoders/-decoders
src/lib/convert/
  types.ts                         T2  MediaKind, FormatEntry, Detection, … (jen typy)
  ffmpeg-caps-parse.ts             T1  parseFormats / parseCodecs
  ffmpeg-caps.ts                   T1  GENEROVÁNO: FFMPEG_CAPS
  catalog/audio.ts                 T2 seed → T3 plný
  catalog/video.ts                 T2 seed → T3 plný
  catalog/text.ts                  T2 seed → T4 plný
  catalog/index.ts                 T2  ALL_FORMATS, catalogFor, findById, findByExtension, localized; T13 searchFormats
  catalog/counts.ts                T2  FORMAT_COUNTS (bez importu dat — pro hub)
  detect.ts                        T2  detectFile
  ffmpeg-plan.ts                   T5  AV_TARGETS, avTargetsFor, parseProbe, canRemux, buildFfmpegArgs, parseProgressTime, inputStrategy, outputFilename
  ffmpeg-engine.ts                 T6  (client) probeFile, convertAv
  text/encoding.ts                 T7
  text/subtitles.ts                T8
  text/data.ts                     T8
  text/pandoc-caps.ts              T9  GENEROVÁNO: PANDOC_CAPS
  pandoc-engine.ts                 T9  (client) runPandoc
  text/route.ts                    T10 textTargetsFor, planText, pandocArgs
  capability.ts                    T10 formatCapability
  run-text.ts                      T12 (client) runTextConversion
  route-kind.ts                    T14 converterSlugFor
src/lib/tools-handoff.ts           T11 stashFiles / takeStashedFiles
src/components/tools/
  media-shared.tsx                 T6  sdílené Dropzone/FileList/Progress/ResultArea + ffmpeg loadery (přesun z audio-convert.tsx)
  use-stashed-files.ts             T11 useStashedFiles
  converter-launchers.tsx          T14
  converter/i18n.ts                T11 CONVERTER_I18N (7 jazyků)
  converter/converter-app.tsx      T11 (+T12 text, +T13 encyklopedie)
  converter/detected-card.tsx      T11
  converter/target-picker.tsx      T11
  converter/av-options.tsx         T11
  converter/text-options.tsx       T12
  converter/print-pdf.ts           T12
  converter/format-encyclopedia.tsx T13
  tools/audio-convert.tsx          T6 re-export helperů, T11 → ConverterApp
  tools/video-convert.tsx          T11 → ConverterApp
  tools/text-convert.tsx           T12 nový
  tools/{video-compress,video-trim,video-to-gif,audio-trim-normalize}.tsx  T11 useStashedFiles
  hub-app.tsx                      T14 launchery + drop overlay
  registry/data.ts                 T11, T12, T14
  registry/text.ts                 T12
public/tools/assets/js/lib/
  ffmpeg-wrapper.js                T6  mount/unmount/onLog
  pandoc/                          T9  vendor + pandoc-worker.js
src/styles/tools.css               T11–T14 sekce Konvertory
tests/unit/convert-*.test.mjs, converter-i18n.test.mjs, tools-handoff.test.mjs
tests/e2e/converters.e2e.mjs       T15
package.json                       T15 script test:e2e:convert
```

---

### Task 1: Schopnosti ffmpeg.wasm (parser + generátor + vygenerovaný seznam)

**Files:**
- Create: `src/lib/convert/ffmpeg-caps-parse.ts`, `scripts/convert-ffmpeg-caps.mjs`, `src/lib/convert/ffmpeg-caps.ts` (generovaný), `scripts/fixtures/ffmpeg-wasm-formats.txt`, `scripts/fixtures/ffmpeg-wasm-encoders.txt`, `scripts/fixtures/ffmpeg-wasm-decoders.txt`
- Test: `tests/unit/convert-ffmpeg-caps.test.mjs`

**Interfaces:**
- Produces: `parseFormats(text: string): { demuxers: string[]; muxers: string[] }`, `parseCodecs(text: string): string[]`, `FFMPEG_CAPS: { readonly demuxers: readonly string[]; readonly muxers: readonly string[]; readonly encoders: readonly string[]; readonly decoders: readonly string[] }` (explicitní anotace, ne `as const`, aby šlo volat `.includes(name: string)`).

- [ ] **Step 1: Napiš failing test parseru**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { parseFormats, parseCodecs } from "../../src/lib/convert/ffmpeg-caps-parse.ts";

const FORMATS = `File formats:
 D. = Demuxing supported
 .E = Muxing supported
 --
 D  3dostr          3DO STR
  E 3g2             3GP2 (3GP2 file format)
 DE ac3             raw AC-3
 D  mov,mp4,m4a,3gp,3g2,mj2 QuickTime / MOV
`;
const ENCODERS = `Encoders:
 V..... = Video
 A..... = Audio
 ------
 V....D libx264              libx264 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10 (codec h264)
 A....D aac                  AAC (Advanced Audio Coding)
`;

test("parseFormats splits demux/mux and comma names", () => {
  assert.deepEqual(parseFormats(FORMATS), {
    demuxers: ["3dostr", "ac3", "mov", "mp4", "m4a", "3gp", "3g2", "mj2"],
    muxers: ["3g2", "ac3"],
  });
});
test("parseCodecs skips legend before ------", () => {
  assert.deepEqual(parseCodecs(ENCODERS), ["libx264", "aac"]);
});
```

- [ ] **Step 2: Spusť, ověř FAIL**

Run: `node --test tests/unit/convert-ffmpeg-caps.test.mjs`
Expected: FAIL — `Cannot find module …/ffmpeg-caps-parse.ts`

- [ ] **Step 3: Implementuj `parseFormats` a `parseCodecs` v `src/lib/convert/ffmpeg-caps-parse.ts`**

Řádky začnou být relevantní po řádku `--` (formats) nebo `------` (codecs). Formats: první dva znaky po úvodní mezeře jsou flagy `D`/`E`, název je první token a čárky ho dělí na víc jmen. Codecs: 6 znaků flagů, pak název. Duplicity odstraň, pořadí zachovej.

- [ ] **Step 4: Spusť, ověř PASS** — `node --test tests/unit/convert-ffmpeg-caps.test.mjs` → PASS

- [ ] **Step 5: Napiš generátor `scripts/convert-ffmpeg-caps.mjs`**

- Spustí `node:http` server na náhodném portu. `/ffmpeg/*` servíruje z `public/tools/assets/js/lib/ffmpeg/` (`.js` → `text/javascript`, `.wasm` → `application/wasm`), `/` vrací inline harness HTML (`<script type="module">`). Harness importuje `/ffmpeg/index.js`, zavolá `load({ coreURL: "/ffmpeg/ffmpeg-core.js", wasmURL: "/ffmpeg/ffmpeg-core.wasm" })`, pro každé z `["-hide_banner","-formats"]`, `["-hide_banner","-encoders"]`, `["-hide_banner","-decoders"]` sbírá `log` eventy (`message`) a návratový kód ignoruje. Výsledek uloží do `window.__caps = { formats, encoders, decoders }`.
- Chromium přes `playwright-core`: `executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium"`, `args: ["--no-sandbox"]`. Čeká na `window.__caps` (timeout 120 s).
- Zapíše surové texty do `scripts/fixtures/ffmpeg-wasm-{formats,encoders,decoders}.txt`. Pak naparsuje (import `../src/lib/convert/ffmpeg-caps-parse.ts`) a zapíše `src/lib/convert/ffmpeg-caps.ts` s hlavičkou `// GENEROVÁNO scripts/convert-ffmpeg-caps.mjs — needitovat ručně.` a seřazenými poli.

- [ ] **Step 6: Spusť generátor** — `node scripts/convert-ffmpeg-caps.mjs` → vzniknou 3 fixtures + `ffmpeg-caps.ts`, každé pole má > 50 položek.

- [ ] **Step 7: Doplň test reálného buildu (do stejného test souboru)**

```js
import { FFMPEG_CAPS } from "../../src/lib/convert/ffmpeg-caps.ts";
const has = (list, names) => { for (const n of names) assert.ok(list.includes(n), `missing ${n}`); };
test("ffmpeg.wasm build capabilities", () => {
  has(FFMPEG_CAPS.demuxers, ["mov","matroska","ogg","wav","flac","mp3","asf","avi","flv","mpegts","rm","bink","smacker","mxf","aiff","au","caf","ape","wv","tta","amr","aac","ac3","eac3","dts","gif","apng","webp_pipe"]);
  has(FFMPEG_CAPS.muxers, ["mp4","ipod","mov","matroska","webm","ogg","opus","mp3","adts","wav","w64","aiff","au","caf","voc","flac","asf","ac3","eac3","mp2","wv","tta","avi","flv","3gp","mpeg","mpegts","gif","webp","apng"]);
  has(FFMPEG_CAPS.encoders, ["libx264","libx265","libvpx","libvpx-vp9","libmp3lame","libvorbis","libopus","libtheora","libwebp_anim","aac","flac","alac","pcm_s16le","pcm_s16be","pcm_u8","wmav2","wmv2","mpeg4","mpeg1video","mp2","ac3","eac3","wavpack","tta","flv","gif","apng"]);
});
```

- [ ] **Step 8: Spusť** — `node --test tests/unit/convert-ffmpeg-caps.test.mjs` → PASS. Pokud nějaká položka v reálném buildu chybí, odstraň ji ze seznamu, zapiš do commit zprávy „chybí v buildu: …“ a v Task 5 nevytvářej cíl, který ji potřebuje.

- [ ] **Step 9: Commit**

```bash
git add src/lib/convert/ffmpeg-caps-parse.ts src/lib/convert/ffmpeg-caps.ts scripts/convert-ffmpeg-caps.mjs scripts/fixtures/ffmpeg-wasm-*.txt tests/unit/convert-ffmpeg-caps.test.mjs
git commit -m "feat(tools): generate ffmpeg.wasm capability list"
```

---

### Task 2: Typy, katalog (seed) a rozpoznání souboru

**Files:**
- Create: `src/lib/convert/types.ts`, `src/lib/convert/catalog/{audio,video,text,index,counts}.ts`, `src/lib/convert/detect.ts`
- Test: `tests/unit/convert-detect.test.mjs`, `tests/unit/convert-catalog.test.mjs`

**Interfaces:**
- Produces (`types.ts`):

```ts
export type MediaKind = "audio" | "video" | "text";
export type OtherKind = "image" | "archive";
export type AudioFamily = "lossy" | "lossless" | "uncompressed" | "speech" | "synth" | "game" | "playlist" | "drm";
export type VideoFamily = "modern" | "legacy" | "broadcast" | "camera" | "raw" | "game" | "animation" | "stream" | "drm";
export type TextFamily = "plain" | "code" | "markup" | "document" | "ebook" | "data" | "subtitle" | "pdf" | "legacy" | "spreadsheet" | "presentation";
export type FormatFamily = AudioFamily | VideoFamily | TextFamily;
export interface LocalizedText { cs: string; en: string }
export interface FormatEntry {
  id: string;                     // globálně unikátní, kebab-case
  kind: MediaKind;
  name: string;                   // "MP3", "Apple QuickTime"
  extensions: readonly string[];  // lowercase, bez tečky, první = výchozí
  mimes: readonly string[];
  family: FormatFamily;
  desc: LocalizedText;
  year?: number;
  demuxer?: string;               // ffmpeg demuxer (jen audio/video)
  codeLang?: string;              // jen family "code" — jazyk pro ```fence
  note?: LocalizedText;           // proč nejde převést / rada
}
export interface Detection {
  kind: MediaKind | OtherKind | null;
  entry: FormatEntry | null;      // null pro image/archive/unknown
  label: string | null;           // entry.name nebo "PNG", "ZIP"…
  by: "magic" | "extension" | "mime" | "content" | null;
  extMismatch: boolean;           // přípona patří jinému formátu než obsah
}
export type Quality = "low" | "medium" | "high" | "lossless";
export interface TargetOption { id: string; label: string; formatId: string; group: "recommended" | "video" | "audio" | "other" }
```

- Produces (`catalog/index.ts`): `ALL_FORMATS: readonly FormatEntry[]`, `catalogFor(kind: MediaKind): readonly FormatEntry[]`, `findById(id: string): FormatEntry | null`, `findByExtension(ext: string, kind?: MediaKind): FormatEntry[]` (ext bez tečky, case-insensitive), `localized(t: LocalizedText, locale: string): string` (`cs` → cs, jinak en).
- Produces (`catalog/counts.ts`): `FORMAT_COUNTS: { audio: number; video: number; text: number }`. Ručně udržované číslo, test hlídá shodu.
- Produces (`detect.ts`): `detectFile(input: { name: string; type: string; head: Uint8Array }, prefer?: MediaKind): Detection`. `head` = prvních ≤ 4096 bajtů.

- [ ] **Step 1: Napiš failing testy rozpoznání** (`tests/unit/convert-detect.test.mjs`)

Helper `bytes(...parts)`: string → ASCII bajty, pole → bajty, `{ at: n }` → doplnění nulami do offsetu n. Případy (každý jeden `test`):

| # | vstup | očekávání |
|---|---|---|
| 1 | `song.mp3`, `"ID3"` + nuly | `kind:"audio"`, `entry.id:"mp3"`, `by:"magic"`, `extMismatch:false` |
| 2 | `song.mp3`, `"RIFF"+[0,0,0,0]+"WAVE"` | `entry.id:"wav"`, `extMismatch:true` |
| 3 | `IMG_0001.MOV`, `[0,0,0,20]+"ftypqt  "` | `kind:"video"`, `entry.id:"mov"`, `extMismatch:false` |
| 4 | `a.bin`, `[0,0,0,20]+"ftypM4A "` | `kind:"audio"`, `entry.id:"m4a"` |
| 5 | `IMG.HEIC`, `[0,0,0,24]+"ftypheic"` | `kind:"image"`, `entry:null`, `label:"HEIC"` |
| 6 | `x.webm`, `[0x1A,0x45,0xDF,0xA3]+…+"webm"` | `entry.id:"webm"`; bez `"webm"` a jméno `x.mkv` → `"mkv"` |
| 7 | `"OggS"` + `{at:28}` + `"OpusHead"` | `entry.id:"opus"`; `"OggS"`+`{at:28}`+`[0x80]+"theora"` → `kind:"video"`, `"ogv"` |
| 8 | `doc.pdf`, `"%PDF-1.7"` | `kind:"text"`, `"pdf"` |
| 9 | `"PK\x03\x04"`+`{at:26}`+`[8,0,0,0]`+`"mimetype"`+`"application/epub+zip"` | `"epub"`; ZIP s názvem `word/document.xml` v hlavičce → `"docx"` |
| 10 | `[0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1]` jako `report.xls` | `"xls"`; jako `a.doc` → `"doc"` |
| 11 | `notes.TXT`, `"hello world\n"` | `"txt"`, `by:"extension"` |
| 12 | `README`, `"hello world\n"` | `"txt"`, `by:"content"` |
| 13 | `app.ts`, `"const a = 1;\n"` | `kind:"text"`, `"typescript"`; `clip.ts` s `0x47` na offsetu 0 a 188 → `kind:"video"`, `"ts"` |
| 14 | `x.zzz`, `[0,1,2,3,0,0,255,254,0,7]` | `kind:null`, `entry:null`, `by:null` |
| 15 | `song.mid`, `"MThd"` | `kind:"audio"`, `"mid"` |
| 16 | `a.gif`, `"GIF89a"` | bez `prefer` → `kind:"image"`, `label:"GIF"`; `prefer:"video"` → `kind:"video"`, `"gif"` |
| 17 | `titulky.srt`, bajty `"1\r\n00:00:01,000 --> 00:00:02,000\r\np"`+`[0xF8,0xED]`+`"li"`+`[0x9A]` | `kind:"text"`, `"srt"` (single-byte kódování není binárka) |

- [ ] **Step 2: Spusť, ověř FAIL** — `node --test tests/unit/convert-detect.test.mjs` → FAIL (modul neexistuje)

- [ ] **Step 3: Seed katalogu**

Do `catalog/{audio,video,text}.ts` (`export const AUDIO_FORMATS: readonly FormatEntry[]` / `VIDEO_FORMATS` / `TEXT_FORMATS`) zapiš jen záznamy, které testy potřebují: audio `mp3, mp2, aac, wav, flac, ogg, opus, m4a, aiff, au, mid, wma, ac3, amr`; video `mp4, mov, mkv, webm, ogv, avi, flv, ts, m2ts, mpg, wmv, 3gp, gif`; text `txt, pdf, epub, odt, docx, doc, xls, ppt, rtf, html, srt, vtt, json, typescript`. Úplná data přijdou v Task 3/4. Pevné názvy (na ně spoléhá e2e): `mp4.name = "MPEG-4"`, `wav.name = "WAV"`, `mov.name = "Apple QuickTime"`. `index.ts` spojí pole do `ALL_FORMATS`. `counts.ts` zatím drží seed počty.

- [ ] **Step 4: Implementuj `detectFile` v `src/lib/convert/detect.ts`**

Pořadí: (1) magic tabulka, (2) text heuristika, (3) přípona, (4) MIME. Magic tabulka (první shoda vyhrává):

| signatura | výsledek |
|---|---|
| `ftyp` @4 + brand @8 | `M4A `→m4a, `M4B `→m4b, `M4P `→m4p, `M4V `→m4v, `qt  `→mov, `3gp*`→3gp, `3g2*`→3g2, `heic`/`heix`/`mif1`/`msf1`→image HEIC, `avif`→image AVIF, `crx `→image CR3, jinak mp4 |
| `RIFF` @0 + @8 | `WAVE`→wav, `AVI `→avi, `WEBP`→image WEBP; `RF64` @0 → rf64 |
| `1A 45 DF A3` | `webm` v head → webm, jinak přípona `mka`→mka, jinak mkv |
| `OggS` | `OpusHead`→opus, `\x01vorbis`→ogg, `\x80theora`→ogv, `\x7FFLAC`→oga, `Speex   `→spx, jinak ogg |
| `fLaC`, `MThd`, `caff`, `wvpk`, `MAC `, `TTA1`, `#!AMR-WB`, `#!AMR`, `MPCK`/`MP+`, `OFR `, `tBaK`, `.snd` | flac, mid, caf, wv, ape, tta, awb, amr, mpc, ofr, tak, au |
| `FORM` @0 + @8 | `AIFF`/`AIFC`→aiff, `8SVX`→8svx, `ILBM`→image ILBM |
| `ID3` nebo `FF` + `(b1 & 0xE0) == 0xE0` | layer bity `00`→aac (ADTS), `01`→mp3, `10`→mp2 |
| `0B 77` / `7F FE 80 01` | ac3 / dts |
| `30 26 B2 75 8E 66 CF 11` | přípona `wma`→wma, jinak wmv |
| `FLV`, `.RMF`, `.ra\xFD`, `BIK`, `KB2`, `SMK2`/`SMK4` | flv, rm (přípona `ra`→ra), ra, bik, bk2, smk |
| `0x47` @0 i @188 | přípona `m2ts`/`mts`→m2ts, jinak ts |
| `00 00 01 BA` | přípona `vob`→vob, `sub`→vobsub, jinak mpg; `00 00 01 B3` → mpg |
| `Extended Module:`, `IMPM`, `SCRM` @44, `M.K.` @1080 | xm, it, s3m, mod |
| `%PDF-`, `{\rtf`, `BOOKMOBI` @60 | pdf, rtf, mobi |
| `D0 CF 11 E0 A1 B1 1A E1` | přípona `xls`→xls, `ppt`→ppt, `msg`→(text "msg"), jinak doc |
| `PK\x03\x04` | jméno 1. položky (offset 30, délka u16LE @26) `mimetype` → obsah za jménem+extra: `application/epub+zip`→epub, `…opendocument.text`→odt, `…spreadsheet`→ods, `…presentation`→odp; jinak hledej v head `word/`→docx, `xl/`→xlsx, `ppt/`→pptx; jinak archive `ZIP` |
| obrázky | `89 50 4E 47`→PNG, `FF D8 FF`→JPEG, `GIF8`→GIF (s `prefer:"video"` → video gif), `BM`→BMP, `II*\0`/`MM\0*`→TIFF, `00 00 01 00`→ICO, `<svg` v head→SVG |
| archivy | `7z\xBC\xAF\x27\x1C`→7Z, `Rar!`→RAR, `1F 8B`→GZIP, `ustar` @257→TAR, `BZh`→BZIP2, `FD 7zXZ`→XZ, `28 B5 2F FD`→ZSTD |

Text heuristika: BOM (`EF BB BF`, `FF FE`, `FE FF`) nebo (žádný bajt `0x00` a řídicí znaky 0x01–0x08, 0x0E–0x1F ≤ 2 % head) → text. Záznam vyber podle přípony v textovém katalogu (`by:"extension"`). Bez přípony čichej obsah (`by:"content"`): `<!doctype html`/`<html`→html, `WEBVTT`→vtt, `[Script Info]`→ass, `/^\d+\r?\n\d\d:\d\d:\d\d,\d{3} --> /`→srt, `<?xml`→xml, první nebílý znak `{`/`[` → json, jinak txt. `extMismatch` = přípona existuje, patří známému formátu a ten se liší od rozpoznaného. Záznamy, které seed nemá (např. `ape`), vracej jako `entry:null` + `kind` podle tabulky; Task 3/4 je doplní.

- [ ] **Step 5: Spusť** — `node --test tests/unit/convert-detect.test.mjs` → PASS (17/17)

- [ ] **Step 6: Napiš integritní test katalogu** (`tests/unit/convert-catalog.test.mjs`)

```js
import { ALL_FORMATS, catalogFor, findById, findByExtension, localized } from "../../src/lib/convert/catalog/index.ts";
import { FORMAT_COUNTS } from "../../src/lib/convert/catalog/counts.ts";
import { FFMPEG_CAPS } from "../../src/lib/convert/ffmpeg-caps.ts";
test("ids unique, fields valid", () => {
  const ids = new Set();
  for (const f of ALL_FORMATS) {
    assert.ok(!ids.has(f.id), `dup ${f.id}`); ids.add(f.id);
    assert.ok(f.extensions.length > 0 && f.extensions.every((e) => e === e.toLowerCase() && !e.startsWith(".")), f.id);
    assert.ok(f.desc.cs.trim() && f.desc.en.trim(), f.id);
    if (f.family === "code") assert.ok(f.codeLang, `${f.id} codeLang`);
    if (f.demuxer) assert.ok(FFMPEG_CAPS.demuxers.includes(f.demuxer), `${f.id} demuxer ${f.demuxer}`);
  }
});
test("counts match", () => {
  for (const k of ["audio", "video", "text"]) assert.equal(FORMAT_COUNTS[k], catalogFor(k).length, k);
});
test("lookup helpers", () => {
  assert.equal(findById("mov").kind, "video");
  assert.equal(findByExtension("MOV")[0].id, "mov");
  assert.equal(findByExtension("ts", "text")[0].id, "typescript");
  assert.equal(findByExtension("ts", "video")[0].id, "ts");
  assert.equal(localized({ cs: "a", en: "b" }, "de"), "b");
});
```

- [ ] **Step 7: Spusť oba testy** — `node --test tests/unit/convert-detect.test.mjs tests/unit/convert-catalog.test.mjs` → PASS

- [ ] **Step 8: Commit** — `git add src/lib/convert/types.ts src/lib/convert/catalog src/lib/convert/detect.ts tests/unit/convert-detect.test.mjs tests/unit/convert-catalog.test.mjs` → `feat(tools): format catalog seed and magic-byte detection`

---

### Task 3: Plný katalog audio a video

**Files:**
- Modify: `src/lib/convert/catalog/audio.ts`, `src/lib/convert/catalog/video.ts`, `src/lib/convert/catalog/counts.ts`
- Test: `tests/unit/convert-catalog.test.mjs` (doplnit)

**Interfaces:**
- Consumes: `FormatEntry` (Task 2), `FFMPEG_CAPS` (Task 1).
- Produces: id všech záznamů níže. Task 5 na ně odkazuje přes `formatId`.

- [ ] **Step 1: Doplň failing testy**

```js
const AUDIO_MUST = ["mp3","mp2","mp1","aac","m4a","m4b","m4p","m4r","wav","rf64","w64","bwf","aiff","aifc","au","caf","flac","oga","ogg","opus","spx","weba","mka","wma","ac3","eac3","dts","truehd","mlp","ape","wv","tta","tak","ofr","mpc","shn","amr","awb","3ga","gsm","voc","8svx","ra","vqf","dsf","dff","sln","qcp","vox","mid","kar","rmi","mod","xm","it","s3m","mtm","669","spc","nsf","vgm","psf","adx","hca","brstm","bfstm","xa","vag","xwm","wem","m3u","pls","cue","xspf","asx"];
const VIDEO_MUST = ["mp4","m4v","mov","mkv","webm","avi","wmv","asf","flv","f4v","swf","3gp","3g2","mpg","m2v","vob","ts","m2ts","mxf","ogv","ogm","rm","rmvb","dv","y4m","nut","ivf","h264","hevc","mjpeg","bik","bk2","smk","roq","fli","nsv","amv","wtv","dvr-ms","r3d","braw","gif","apng","webp","m3u8","mpd"];
test("audio/video catalogs are complete", () => {
  assert.ok(catalogFor("audio").length >= 150, "audio >= 150");
  assert.ok(catalogFor("video").length >= 120, "video >= 120");
  for (const id of AUDIO_MUST) assert.equal(findById(id)?.kind, "audio", id);
  for (const id of VIDEO_MUST) assert.equal(findById(id)?.kind, "video", id);
});
```

- [ ] **Step 2: Spusť, ověř FAIL** — `node --test tests/unit/convert-catalog.test.mjs` → FAIL „audio >= 150“

- [ ] **Step 3: Doplň data**

Zdroje: `scripts/fixtures/ffmpeg-wasm-formats.txt` (každý demuxer s audio/video obsahem si zaslouží záznam), Wikipedia „Audio file format“, „Video file format“, „List of file formats“ (sekce audio/video/multimedia), „Module file“, „Video game music file formats“. Pravidla: `demuxer` jen pokud je v `FFMPEG_CAPS.demuxers`. MIDI, tracker moduly, DRM (m4p, aax, wma-drm) a playlisty dostanou `note` s radou (cs+en). `desc` = jedna věta, co to je a kde se s tím člověk potká. Ponech id ze seedu.

- [ ] **Step 4: Aktualizuj `FORMAT_COUNTS`, spusť** — `node --test tests/unit/convert-catalog.test.mjs` → PASS

- [ ] **Step 5: Commit** — `feat(tools): full audio and video format catalog`

---

### Task 4: Plný katalog textových formátů

**Files:**
- Modify: `src/lib/convert/catalog/text.ts`, `src/lib/convert/catalog/counts.ts`
- Test: `tests/unit/convert-catalog.test.mjs` (doplnit)

**Interfaces:**
- Produces: id níže. Task 8 a Task 10 odkazují na `txt, md, html, docx, odt, epub, rtf, rst, tex, org, adoc, textile, mediawiki, dokuwiki, ipynb, dbk, typ, fb2, jats, man, pdf, json, jsonl, yaml, csv, tsv, ini, env, properties, srt, vtt, ass, ssa, sbv, lrc, sub`.

- [ ] **Step 1: Doplň failing testy**

```js
const TEXT_MUST = ["txt","log","nfo","md","html","xhtml","rtf","doc","docx","docm","dotx","odt","ott","fodt","wpd","wps","lwp","abw","sxw","pages","epub","mobi","azw3","fb2","djvu","pdf","tex","rst","adoc","org","textile","mediawiki","dokuwiki","creole","t2t","man","typ","ipynb","dbk","jats","opml","bib","ris","json","jsonl","yaml","toml","ini","env","properties","xml","plist","csv","tsv","xls","xlsx","ods","ppt","pptx","odp","key","srt","vtt","ass","ssa","sbv","lrc","sub","vobsub","ttml","smi","stl","msg","js","typescript","py","java","c","cpp","cs","go","rs","php","rb","swift","kt","sql","sh","ps1","bat","css","scss","lua","r","dart","scala","hs","pl","vb","asm","vue","svelte","jsx","tsx","dockerfile","makefile"];
const FAMILIES = ["plain","code","markup","document","ebook","data","subtitle","pdf","legacy","spreadsheet","presentation"];
test("text catalog is complete", () => {
  assert.ok(catalogFor("text").length >= 150, "text >= 150");
  for (const id of TEXT_MUST) assert.equal(findById(id)?.kind, "text", id);
  for (const fam of FAMILIES) assert.ok(catalogFor("text").some((f) => f.family === fam), fam);
});
```

- [ ] **Step 2: Spusť, ověř FAIL** → FAIL „text >= 150“
- [ ] **Step 3: Doplň data.** Code záznamy ~60 jazyků s `codeLang` (identifikátor pro Markdown fence, např. `python`). `dockerfile`/`makefile` mají `extensions: ["dockerfile"]` / `["makefile","mk"]` a detekce je matchuje i podle celého jména souboru bez přípony (doplň do `detectFile`: jméno `Dockerfile`/`Makefile` → tyto záznamy, test do Task 2 souboru: `detectFile({name:"Dockerfile",…})` → `"dockerfile"`). Legacy/spreadsheet/presentation/xml/toml/djvu/vobsub mají `note` s radou.
- [ ] **Step 4: `FORMAT_COUNTS`, spusť oba katalogové + detekční testy** → PASS
- [ ] **Step 5: Commit** — `feat(tools): full text format catalog`

---

### Task 5: Plánování ffmpeg převodů

**Files:**
- Create: `src/lib/convert/ffmpeg-plan.ts`
- Test: `tests/unit/convert-ffmpeg-plan.test.mjs`

**Interfaces:**
- Consumes: `FormatEntry`, `Quality`, `TargetOption` (Task 2), `FFMPEG_CAPS` (Task 1).
- Produces:

```ts
export interface AvTarget { id: string; formatId: string; kind: "audio" | "video"; ext: string; mime: string; muxer: string; vcodec?: string; acodec?: string; label: string; lossless?: boolean }
export const AV_TARGETS: readonly AvTarget[];
export function findTarget(id: string): AvTarget | null;
export interface ProbeStream { index: number; type: "video" | "audio" | "subtitle" | "data"; codec: string; width?: number; height?: number }
export interface ProbeInfo { durationSec: number | null; streams: ProbeStream[] }
export function parseProbe(log: string): ProbeInfo;
export function canRemux(probe: ProbeInfo | null, targetId: string): boolean;
export interface FfmpegRequest { inPath: string; outName: string; targetId: string; quality: Quality; remux: boolean; maxHeight: number | null }
export function buildFfmpegArgs(req: FfmpegRequest): string[];
export function avTargetsFor(kind: "audio" | "video", input: FormatEntry | null): TargetOption[];
export function parseProgressTime(line: string): number | null;
export const MAX_MOUNT_BYTES: number; export const MAX_MEMORY_BYTES: number; export const WARN_BYTES: number;
export function inputStrategy(o: { hasMount: boolean; size: number }): "mount" | "memory" | "reject";
export function outputFilename(original: string, ext: string): string;
```

**AV_TARGETS** (id · formatId · ext · mime · muxer · vcodec · acodec · label; `L` = lossless):

Audio: `mp3·mp3·mp3·audio/mpeg·mp3·–·libmp3lame·MP3` · `m4a·m4a·m4a·audio/mp4·ipod·–·aac·M4A (AAC)` · `m4a-alac·m4a·m4a·audio/mp4·ipod·–·alac·M4A (ALAC) L` · `m4r·m4r·m4r·audio/mp4·ipod·–·aac·M4R (iPhone)` · `m4b·m4b·m4b·audio/mp4·ipod·–·aac·M4B (audiokniha)` · `aac·aac·aac·audio/aac·adts·–·aac·AAC (ADTS)` · `wav·wav·wav·audio/wav·wav·–·pcm_s16le·WAV L` · `w64·w64·w64·audio/x-w64·w64·–·pcm_s16le·Wave64 L` · `aiff·aiff·aiff·audio/aiff·aiff·–·pcm_s16be·AIFF L` · `au·au·au·audio/basic·au·–·pcm_s16be·Sun AU L` · `caf·caf·caf·audio/x-caf·caf·–·pcm_s16le·CAF L` · `voc·voc·voc·audio/x-voc·voc·–·pcm_u8·VOC (8 bit)` · `flac·flac·flac·audio/flac·flac·–·flac·FLAC L` · `ogg·ogg·ogg·audio/ogg·ogg·–·libvorbis·OGG (Vorbis)` · `opus·opus·opus·audio/opus·opus·–·libopus·Opus` · `weba·weba·weba·audio/webm·webm·–·libopus·WebM audio` · `mka·mka·mka·audio/x-matroska·matroska·–·flac·Matroska audio L` · `wma·wma·wma·audio/x-ms-wma·asf·–·wmav2·WMA` · `ac3·ac3·ac3·audio/ac3·ac3·–·ac3·AC-3` · `eac3·eac3·eac3·audio/eac3·eac3·–·eac3·E-AC-3` · `mp2·mp2·mp2·audio/mpeg·mp2·–·mp2·MP2` · `wv·wv·wv·audio/x-wavpack·wv·–·wavpack·WavPack L` · `tta·tta·tta·audio/x-tta·tta·–·tta·TTA L`

Video: `mp4-h264·mp4·mp4·video/mp4·mp4·libx264·aac·MP4 (H.264)` · `mp4-h265·mp4·mp4·video/mp4·mp4·libx265·aac·MP4 (H.265/HEVC)` · `m4v·m4v·m4v·video/x-m4v·mp4·libx264·aac·M4V` · `mov·mov·mov·video/quicktime·mov·libx264·aac·MOV` · `mkv·mkv·mkv·video/x-matroska·matroska·libx264·aac·MKV` · `webm-vp9·webm·webm·video/webm·webm·libvpx-vp9·libopus·WebM (VP9)` · `webm-vp8·webm·webm·video/webm·webm·libvpx·libvorbis·WebM (VP8)` · `avi·avi·avi·video/x-msvideo·avi·mpeg4·libmp3lame·AVI` · `wmv·wmv·wmv·video/x-ms-wmv·asf·wmv2·wmav2·WMV` · `flv·flv·flv·video/x-flv·flv·flv·libmp3lame·FLV` · `3gp·3gp·3gp·video/3gpp·3gp·libx264·aac·3GP` · `mpg·mpg·mpg·video/mpeg·mpeg·mpeg1video·mp2·MPEG` · `ts·ts·ts·video/mp2t·mpegts·libx264·aac·MPEG-TS` · `m2ts·m2ts·m2ts·video/mp2t·mpegts·libx264·aac·M2TS` · `ogv·ogv·ogv·video/ogg·ogg·libtheora·libvorbis·OGV` · `gif·gif·gif·image/gif·gif·gif·–·GIF` · `webp-anim·webp·webp·image/webp·webp·libwebp_anim·–·Animovaný WebP` · `apng·apng·apng·image/apng·apng·apng·–·APNG`

**Kvalita** (index low/medium/high; `lossless` = high u ztrátových):
- `-b:a` (k): libmp3lame 128/192/320 · aac 96/160/256 · libopus 64/128/192 · libvorbis 112/192/320 · wmav2 96/160/256 · ac3 192/384/640 · eac3 128/256/448 · mp2 128/192/384
- libx264 `-preset veryfast -crf` 30/26/22 `-pix_fmt yuv420p` · libx265 `-preset ultrafast -crf` 32/28/24 `-tag:v hvc1` · libvpx-vp9 `-crf` 40/34/30 `-b:v 0 -deadline realtime -cpu-used 8` · libvpx `-crf 10 -b:v` 800k/1500k/3000k · mpeg4/wmv2/flv/mpeg1video `-q:v` 8/5/3 · libtheora `-q:v` 4/6/8
- gif: `-vf fps=F,scale='min(480,iw)':-2:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse -loop 0`, F = 10/12/15 · webp-anim `-vf fps=15,scale='min(640,iw)':-2 -quality 50/75/90 -loop 0` · apng `-vf fps=12,scale='min(480,iw)':-2 -plays 0`
- Zvláštnosti: `flv` + `-ar 44100`; `3gp` + `-profile:v baseline`; `m2ts` + `-mpegts_m2ts_mode 1`; `m4v` + `-f mp4`; mp4/mov/m4v/m4a/m4r/m4b + `-movflags +faststart`.

**Struktura args:** `["-hide_banner", "-i", inPath, "-map_metadata", "0", …mapy, …filtry, …kodeky, …extra, outName]`. Mapy: video cíl `-map 0:v:0? -map 0:a:0?`, audio cíl `-map 0:a:0? -vn`, animace `-map 0:v:0? -an`. `maxHeight` (jen video cíle kromě animací, které mají vlastní scale) → `-vf scale=-2:'min(H,ih)'`. `remux:true` → místo kodeků `-c copy`.

**Remux tabulka** (`canRemux` = první video i první audio stream jsou v seznamu; chybějící druh streamu je OK):
mp4-h264/mp4-h265/m4v/mov: v `h264,hevc,mpeg4,av1`, a `aac,mp3,alac,ac3,eac3` · mkv: v/a cokoliv · webm-vp9/webm-vp8: v `vp8,vp9,av1`, a `opus,vorbis` · ts/m2ts: v `h264,hevc,mpeg2video`, a `aac,mp3,ac3,mp2` · m4a/m4r/m4b: a `aac` · m4a-alac: a `alac` · mp3: a `mp3` · ogg: a `vorbis` · opus: a `opus` · weba: a `opus,vorbis` · flac: a `flac` · mka: a cokoliv · ostatní cíle nikdy. Video stream u audio cíle se ignoruje (je tam `-vn`).

**avTargetsFor:** `video` → všechny video cíle (`group:"video"`) + všechny audio cíle (`group:"audio"`). `audio` → audio cíle (`group:"audio"`). Doporučené (`group:"recommended"`, v tomto pořadí, na začátku): video `mp4-h264, webm-vp9, mov, mkv, gif, mp3`; audio `mp3, m4a, wav, flac, opus, ogg`. Cíl se stejným `formatId` jako vstup se nedoporučuje (zůstane ve své skupině `video`/`audio`). Doporučené cíle se ve své skupině neopakují.

- [ ] **Step 1: Napiš failing testy** (`tests/unit/convert-ffmpeg-plan.test.mjs`)

```js
const LOG = `Input #0, mov,mp4,m4a,3gp,3g2,mj2, from '/mnt1/input.mp4':
  Duration: 00:01:02.50, start: 0.000000, bitrate: 1205 kb/s
  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1920x1080, 1000 kb/s, 30 fps
  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 128 kb/s`;
const probe = parseProbe(LOG);
test("parseProbe", () => {
  assert.deepEqual(probe, { durationSec: 62.5, streams: [
    { index: 0, type: "video", codec: "h264", width: 1920, height: 1080 },
    { index: 1, type: "audio", codec: "aac" } ] });
  assert.equal(parseProbe("  Duration: N/A, bitrate: N/A").durationSec, null);
  assert.equal(parseProbe("Stream #0:0(eng): Audio: mp3, 44100 Hz").streams[0].codec, "mp3");
});
test("audio args", () => {
  assert.deepEqual(buildFfmpegArgs({ inPath: "/mnt1/input.wav", outName: "out.mp3", targetId: "mp3", quality: "medium", remux: false, maxHeight: null }),
    ["-hide_banner","-i","/mnt1/input.wav","-map_metadata","0","-map","0:a:0?","-vn","-c:a","libmp3lame","-b:a","192k","out.mp3"]);
});
test("video args", () => {
  assert.deepEqual(buildFfmpegArgs({ inPath: "/mnt1/input.mov", outName: "out.mp4", targetId: "mp4-h264", quality: "medium", remux: false, maxHeight: null }),
    ["-hide_banner","-i","/mnt1/input.mov","-map_metadata","0","-map","0:v:0?","-map","0:a:0?","-c:v","libx264","-preset","veryfast","-crf","26","-pix_fmt","yuv420p","-c:a","aac","-b:a","160k","-movflags","+faststart","out.mp4"]);
  const scaled = buildFfmpegArgs({ inPath: "i", outName: "o.mp4", targetId: "mp4-h264", quality: "low", remux: false, maxHeight: 720 });
  const i = scaled.indexOf("-vf"); assert.equal(scaled[i + 1], "scale=-2:'min(720,ih)'");
});
test("remux and gif", () => {
  assert.deepEqual(buildFfmpegArgs({ inPath: "i.mp4", outName: "o.mkv", targetId: "mkv", quality: "medium", remux: true, maxHeight: null }),
    ["-hide_banner","-i","i.mp4","-map_metadata","0","-map","0:v:0?","-map","0:a:0?","-c","copy","o.mkv"]);
  const gif = buildFfmpegArgs({ inPath: "i.mp4", outName: "o.gif", targetId: "gif", quality: "medium", remux: false, maxHeight: null });
  assert.ok(gif.includes("fps=12,scale='min(480,iw)':-2:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse"));
  assert.ok(gif.includes("-an") && !gif.includes("-c:a"));
  assert.deepEqual(gif.slice(gif.indexOf("-loop"), gif.indexOf("-loop") + 2), ["-loop", "0"]);
});
test("canRemux", () => {
  assert.equal(canRemux(probe, "mp4-h264"), true);
  assert.equal(canRemux(probe, "webm-vp9"), false);
  const vp9 = { durationSec: 1, streams: [{ index: 0, type: "video", codec: "vp9" }, { index: 1, type: "audio", codec: "opus" }] };
  assert.equal(canRemux(vp9, "webm-vp9"), true);
  assert.equal(canRemux(vp9, "mp4-h264"), false);
  assert.equal(canRemux({ durationSec: 1, streams: [{ index: 0, type: "audio", codec: "aac" }] }, "m4a"), true);
  assert.equal(canRemux(probe, "mp3"), false);
  assert.equal(canRemux(null, "mkv"), false);
});
test("progress, strategy, filename", () => {
  assert.equal(parseProgressTime("frame=  120 fps= 12 q=28.0 size=     512kB time=00:00:04.00 bitrate=1048.6kbits/s speed=0.4x"), 4);
  assert.equal(parseProgressTime("size=N/A time=00:01:02.50 bitrate=N/A"), 62.5);
  assert.equal(parseProgressTime("Press [q] to stop"), null);
  assert.equal(inputStrategy({ hasMount: true, size: 1.5e9 }), "mount");
  assert.equal(inputStrategy({ hasMount: true, size: 3e9 }), "reject");
  assert.equal(inputStrategy({ hasMount: false, size: 200e6 }), "memory");
  assert.equal(inputStrategy({ hasMount: false, size: 400e6 }), "reject");
  assert.equal(outputFilename("Dovolená 2024.MOV", "mp4"), "Dovolená 2024.mp4");
  assert.equal(outputFilename("noext", "mp3"), "noext.mp3");
  assert.equal(outputFilename(".hidden", "txt"), ".hidden.txt");
});
test("targets", () => {
  for (const t of AV_TARGETS) {
    assert.ok(FFMPEG_CAPS.muxers.includes(t.muxer), `${t.id} muxer`);
    if (t.vcodec) assert.ok(FFMPEG_CAPS.encoders.includes(t.vcodec), `${t.id} vcodec`);
    if (t.acodec) assert.ok(FFMPEG_CAPS.encoders.includes(t.acodec), `${t.id} acodec`);
    assert.equal(findById(t.formatId)?.id, t.formatId, `${t.id} formatId`);
  }
  assert.equal(AV_TARGETS.filter((t) => t.kind === "audio").length, 23);
  assert.equal(AV_TARGETS.filter((t) => t.kind === "video").length, 18);
  const v = avTargetsFor("video", findById("mov"));
  assert.deepEqual(v.filter((o) => o.group === "recommended").map((o) => o.id), ["mp4-h264","webm-vp9","mkv","gif","mp3"]);
  assert.ok(v.some((o) => o.id === "flac" && o.group === "audio"));
  assert.ok(!avTargetsFor("audio", findById("wav")).some((o) => o.id === "mp4-h264"));
});
```

(V `targets` testu je `mov` vynechaný z doporučených, protože vstup už je MOV. Pravidlo „stejný formát → nedoporučovat“.)

- [ ] **Step 2: Spusť, ověř FAIL** — `node --test tests/unit/convert-ffmpeg-plan.test.mjs`
- [ ] **Step 3: Implementuj `src/lib/convert/ffmpeg-plan.ts`** podle tabulek výš. `parseProbe`: `Duration: HH:MM:SS.ss`; stream regex toleruje `[0x1]` i `(lang)`; codec = první slovo za `Video:`/`Audio:`/`Subtitle:`/`Data:`; rozlišení = první `\d+x\d+`. `outputFilename`: odstraň poslední příponu (ne u jmen začínajících tečkou bez další tečky), přidej `.ext`.
- [ ] **Step 4: Spusť** → PASS
- [ ] **Step 5: Commit** — `feat(tools): ffmpeg conversion planning (targets, args, probe, remux)`

---

### Task 6: Engine ffmpeg (WORKERFS mount, průběh, zrušení)

**Files:**
- Create: `src/components/tools/media-shared.tsx`, `src/lib/convert/ffmpeg-engine.ts`
- Modify: `src/components/tools/tools/audio-convert.tsx` (helpery → re-export), `public/tools/assets/js/lib/ffmpeg-wrapper.js`

**Interfaces:**
- Consumes: `ProbeInfo`, `AvTarget`, `buildFfmpegArgs`, `parseProbe`, `parseProgressTime`, `inputStrategy`, `outputFilename`, `MAX_*` (Task 5), `Quality` (Task 2).
- Produces (`media-shared.tsx`): všechny dnešní pojmenované exporty z `audio-convert.tsx` řádky 1–307 (`ensureMedia`, `ensureWrapper`, `getFFmpegWrapper`, `getFFmpegMedia`, `setToolState`, `Dropzone`, `FileList`, `Progress`, `ResultArea`, `reportError`, `toastSuccess`, `fmtSize`) + `FFMPEG_WRAPPER_SRC = "/tools/assets/js/lib/ffmpeg-wrapper.js?v=20261024a"`. Typ `FFmpegWrapperG` rozšířený o volitelné `mount?(ff, file: File, safeName: string): Promise<string>`, `unmount?(ff, path: string): Promise<void>`, `onLog?(cb: (line: string) => void): () => void` a o `exec` na instanci.
- Produces (`ffmpeg-engine.ts`):

```ts
export interface AvProgress { phase: "loading" | "probing" | "converting"; pct: number | null; etaSec: number | null }
export class ConvertCancelled extends Error {}
export class FileTooLarge extends Error { limit: number }
export async function probeFile(file: File, signal?: AbortSignal): Promise<ProbeInfo>;
export async function convertAv(job: { file: File; target: AvTarget; quality: Quality; remux: boolean; maxHeight: number | null; probe: ProbeInfo | null; signal: AbortSignal; onProgress: (p: AvProgress) => void }): Promise<{ blob: Blob; filename: string; log: string[] }>;
```

- [ ] **Step 1: Přesuň helpery.** Obsah `audio-convert.tsx` řádků 1–307 přesuň do `media-shared.tsx` (`"use client"`). `ensureWrapper`/`ensureMedia` načítají `FFMPEG_WRAPPER_SRC`. V `audio-convert.tsx` nech komponentu a přidej `export { ensureMedia, ensureWrapper, getFFmpegWrapper, getFFmpegMedia, setToolState, Dropzone, FileList, Progress, ResultArea, reportError, toastSuccess, fmtSize } from "@/components/tools/media-shared";`. Ostatních 10 media nástrojů importuje dál z `audio-convert` beze změny.
- [ ] **Step 2: Ověř beze změny chování** — `npm run typecheck && npm run lint` → 0 chyb; `grep -rn "ffmpeg-wrapper.js\"" src` → jen `media-shared.tsx` s `?v=20261024a`.
- [ ] **Step 3: Rozšiř `ffmpeg-wrapper.js`.** V `ready()` registruj `instance.on('log', e => logHandlers.forEach(h => h(e.message)))`. Přidej `mount(ffmpeg, file, safeName)`: `createDir('/mntN')` → `mount('WORKERFS', { files: [new File([file], safeName)] }, '/mntN')` → resolve `'/mntN/' + safeName`. `unmount(ffmpeg, path)`: `unmount(dir)` → `deleteDir(dir)`, chyby polkne. `onLog(cb)` vrací odhlášení. Vše exportuj ve `window.FFmpegWrapper`. Původní API zůstane beze změny.
- [ ] **Step 4: Implementuj `ffmpeg-engine.ts`.** Bezpečné jméno v FS = `"input." + (přípona z formatu nebo "bin")`, uživatelské jméno nikdy jako argument. Strategie z `inputStrategy({ hasMount: typeof wrap.mount === "function", size })`: `reject` → `FileTooLarge`, `memory` → `wrap.write`. `probeFile` volá `ff.exec(["-hide_banner","-i",path])` (nenulový exit je u sondy normální) a `parseProbe` nad logem. `convertAv`: progress z `parseProgressTime` ÷ `probe.durationSec` (max 99 %, ETA = elapsed × (100 − pct) / pct; bez délky `pct:null`). Abort → `wrap.cancel()` + `ConvertCancelled`. Výstup `wrap.read` → `Blob(type = target.mime)`, název `outputFilename(file.name, target.ext)`. Ve `finally` unmount/remove a odhlášení logu.
- [ ] **Step 5: Ruční ověření v dev serveru.** `npm run dev`, otevři `/cs/tools/video-compress` (pořád používá wrapper) a zkomprimuj malé MP4 → funguje jako dřív (regrese wrapperu), v Network je `ffmpeg-wrapper.js?v=20261024a`. Engine samotný se ověří v Task 11 (ručně) a v Task 15 (e2e).
- [ ] **Step 6: Commit** — `git add src/components/tools/media-shared.tsx src/components/tools/tools/audio-convert.tsx src/lib/convert/ffmpeg-engine.ts public/tools/assets/js/lib/ffmpeg-wrapper.js` → `feat(tools): ffmpeg engine with WORKERFS mount, progress and cancel`

---

### Task 7: Kódování textu a „rozsypaný čaj“

**Files:**
- Create: `src/lib/convert/text/encoding.ts`
- Test: `tests/unit/convert-encoding.test.mjs`

**Interfaces:**
- Produces:

```ts
export type OutputEncoding = "utf-8" | "utf-8-bom" | "utf-16le" | "utf-16be" | "windows-1250" | "iso-8859-2" | "windows-1252" | "iso-8859-15" | "windows-1251" | "koi8-u" | "ibm866";
export const OUTPUT_ENCODINGS: readonly OutputEncoding[];
export const INPUT_ENCODINGS: readonly string[];   // WHATWG labely pro ruční volbu (min. všechny z OUTPUT bez -bom + "shift_jis","gb18030","big5","euc-kr","windows-1253","windows-1254","windows-1257","iso-8859-5","koi8-r","macintosh")
export function guessEncoding(bytes: Uint8Array): string;     // TextDecoder label
export function decodeBytes(bytes: Uint8Array, label: string): string;  // strip BOM
export function encodeText(text: string, enc: OutputEncoding): { bytes: Uint8Array; unmappable: number };
export function detectMojibake(text: string): boolean;
export function fixMojibake(text: string): string;
export function convertLineEndings(text: string, mode: "keep" | "lf" | "crlf"): string;
```

- [ ] **Step 1: Napiš failing testy**

```js
const S = "příliš žluťoučký kůň";
const CP1250 = [0x70,0xF8,0xED,0x6C,0x69,0x9A,0x20,0x9E,0x6C,0x75,0x9D,0x6F,0x75,0xE8,0x6B,0xFD,0x20,0x6B,0xF9,0xF2];
const ISO2 = CP1250.map((b) => ({ 0x9A: 0xB9, 0x9E: 0xBE, 0x9D: 0xBB }[b] ?? b));
test("encode single-byte", () => {
  assert.deepEqual([...encodeText(S, "windows-1250").bytes], CP1250);
  assert.deepEqual([...encodeText(S, "iso-8859-2").bytes], ISO2);
  assert.deepEqual(encodeText("a中b", "windows-1250"), { bytes: new Uint8Array([0x61, 0x3F, 0x62]), unmappable: 1 });
});
test("encode unicode", () => {
  assert.deepEqual([...encodeText("a", "utf-8-bom").bytes], [0xEF,0xBB,0xBF,0x61]);
  assert.deepEqual([...encodeText("a", "utf-16le").bytes], [0xFF,0xFE,0x61,0x00]);
  assert.deepEqual([...encodeText("a", "utf-16be").bytes], [0xFE,0xFF,0x00,0x61]);
});
test("guess + decode", () => {
  assert.equal(guessEncoding(new Uint8Array(CP1250)), "windows-1250");
  assert.equal(guessEncoding(new Uint8Array(ISO2)), "iso-8859-2");
  assert.equal(guessEncoding(new TextEncoder().encode(S)), "utf-8");
  assert.equal(guessEncoding(new Uint8Array([0xFF,0xFE,0x61,0])), "utf-16le");
  assert.equal(guessEncoding(new Uint8Array([0xFE,0xFF,0,0x61])), "utf-16be");
  assert.equal(decodeBytes(new Uint8Array(CP1250), "windows-1250"), S);
  assert.equal(decodeBytes(new Uint8Array([0xEF,0xBB,0xBF,0x61]), "utf-8"), "a");
});
test("mojibake", () => {
  assert.equal(fixMojibake("pĹ™Ă\u00ADliĹˇ"), "příliš");      // UTF-8 čtené jako CP1250
  assert.equal(fixMojibake("pÅ™Ã\u00ADliÅ¡"), "příliš");      // UTF-8 čtené jako CP1252
  assert.equal(fixMojibake("příliš"), "příliš");
  assert.equal(detectMojibake("pĹ™Ă\u00ADliĹˇ"), true);
  assert.equal(detectMojibake("příliš"), false);
});
test("line endings", () => {
  assert.equal(convertLineEndings("a\r\nb\nc\rd", "crlf"), "a\r\nb\r\nc\r\nd");
  assert.equal(convertLineEndings("a\r\nb\nc\rd", "lf"), "a\nb\nc\nd");
  assert.equal(convertLineEndings("a\r\nb", "keep"), "a\r\nb");
});
```

- [ ] **Step 2: FAIL** — `node --test tests/unit/convert-encoding.test.mjs`
- [ ] **Step 3: Implementuj.** Single-byte enkodér: reverzní tabulku postav líně z `new TextDecoder(label).decode(Uint8Array.of(b))` pro b = 0..255 (cache per label), nemapovatelné → `?` + počítadlo. `guessEncoding`: BOM → UTF-8 fatal decode OK → `utf-8`. Jinak bajty 0x80–0x9F přítomné → `windows-1250`, jinak některý z `0xA9,0xAB,0xAE,0xB9,0xBB,0xBE` → `iso-8859-2`, jinak `windows-1250`. `fixMojibake`: pro kandidáty `windows-1250`, `windows-1252` zkus `encodeText` (0 nemapovatelných) → `TextDecoder("utf-8",{fatal:true})`. Úspěch a výsledek obsahuje méně znaků z `ĹĂÅÃ™ˇ` → vrať výsledek, jinak vstup. `detectMojibake` = `fixMojibake(t) !== t`.
- [ ] **Step 4: PASS**
- [ ] **Step 5: Commit** — `feat(tools): text encoding detection, conversion and mojibake fix`

---

### Task 8: Titulky a datové formáty

**Files:**
- Create: `src/lib/convert/text/subtitles.ts`, `src/lib/convert/text/data.ts`
- Test: `tests/unit/convert-subtitles.test.mjs`, `tests/unit/convert-data.test.mjs`

**Interfaces:**
- Produces:

```ts
// subtitles.ts
export type SubtitleFormat = "srt" | "vtt" | "ass" | "ssa" | "sbv" | "lrc" | "sub" | "txt";
export const SUBTITLE_FORMATS: readonly SubtitleFormat[];
export interface Cue { start: number; end: number; text: string }   // ms; text s \n a jednoduchými <i>/<b>/<u>
export function parseSubtitles(text: string, fmt: Exclude<SubtitleFormat, "txt">, opts?: { fps?: number }): Cue[];
export function writeSubtitles(cues: Cue[], fmt: SubtitleFormat, opts?: { fps?: number }): string;
export function shiftCues(cues: Cue[], ms: number): Cue[];
// data.ts
export type DataFormat = "json" | "jsonl" | "yaml" | "csv" | "tsv" | "ini" | "env" | "properties";
export const DATA_FORMATS: readonly DataFormat[];
export interface YamlAdapter { load(text: string): unknown; dump(value: unknown): string }
export class TabularError extends Error {}
export function parseData(text: string, fmt: DataFormat, opts?: { yaml?: YamlAdapter }): unknown;
export function writeData(value: unknown, fmt: DataFormat, opts?: { yaml?: YamlAdapter }): string;
```

- [ ] **Step 1: Failing testy titulků**

```js
const SRT = "1\n00:00:01,000 --> 00:00:02,500\nAhoj\nsvěte\n\n2\n00:00:03,000 --> 00:00:04,000\n<i>Druhý</i>\n";
const cues = parseSubtitles(SRT, "srt");
test("srt parse/write", () => {
  assert.deepEqual(cues, [{ start: 1000, end: 2500, text: "Ahoj\nsvěte" }, { start: 3000, end: 4000, text: "<i>Druhý</i>" }]);
  assert.equal(writeSubtitles(cues, "srt"), SRT);
  assert.deepEqual(parseSubtitles(SRT.replaceAll("\n", "\r\n"), "srt"), cues);
});
test("vtt", () => {
  assert.equal(writeSubtitles(cues, "vtt"), "WEBVTT\n\n00:00:01.000 --> 00:00:02.500\nAhoj\nsvěte\n\n00:00:03.000 --> 00:00:04.000\n<i>Druhý</i>\n");
  assert.deepEqual(parseSubtitles("WEBVTT\n\nNOTE x\n\nid1\n00:01.000 --> 00:02.500 align:start\nAhoj\nsvěte\n", "vtt"), [{ start: 1000, end: 2500, text: "Ahoj\nsvěte" }]);
});
test("ass", () => {
  const ass = writeSubtitles(cues, "ass");
  assert.ok(ass.includes("[Events]"));
  assert.ok(ass.includes("Dialogue: 0,0:00:01.00,0:00:02.50,Default,,0,0,0,,Ahoj\\Nsvěte"));
  assert.ok(ass.includes("{\\i1}Druhý{\\i0}"));
  assert.deepEqual(parseSubtitles(ass, "ass"), cues);
});
test("sbv, lrc, sub, txt", () => {
  assert.equal(writeSubtitles(cues, "sbv"), "0:00:01.000,0:00:02.500\nAhoj\nsvěte\n\n0:00:03.000,0:00:04.000\n<i>Druhý</i>\n");
  assert.equal(writeSubtitles(cues, "lrc"), "[00:01.00]Ahoj světe\n[00:03.00]Druhý\n");
  assert.deepEqual(parseSubtitles("{25}{50}Ahoj|světe\n", "sub", { fps: 25 }), [{ start: 1000, end: 2000, text: "Ahoj\nsvěte" }]);
  assert.equal(writeSubtitles(cues, "txt"), "Ahoj\nsvěte\n\nDruhý\n");
});
test("shift", () => {
  assert.deepEqual(shiftCues([{ start: 500, end: 1000, text: "a" }], 1500), [{ start: 2000, end: 2500, text: "a" }]);
  assert.deepEqual(shiftCues([{ start: 500, end: 1000, text: "a" }], -800), [{ start: 0, end: 200, text: "a" }]);
});
```

- [ ] **Step 2: Failing testy dat**

```js
test("json → csv/tsv with flatten", () => {
  const v = parseData('[{"a":1,"b":"x"},{"a":2,"b":"y,z"}]', "json");
  assert.equal(writeData(v, "csv"), 'a,b\n1,x\n2,"y,z"\n');
  assert.equal(writeData(v, "tsv"), "a\tb\n1\tx\n2\ty,z\n");
  assert.equal(writeData([{ a: { b: 1 }, c: [1, 2] }], "csv"), 'a.b,c\n1,"[1,2]"\n');
  assert.throws(() => writeData({ a: 1 }, "csv"), TabularError);
});
test("csv autodetects semicolon", () => {
  assert.deepEqual(parseData("a;b\n1;2\n", "csv"), [{ a: "1", b: "2" }]);
  assert.deepEqual(parseData('a,b\n"x ""q""",2\n', "csv"), [{ a: 'x "q"', b: "2" }]);
});
test("jsonl, ini, env, yaml adapter", () => {
  assert.deepEqual(parseData('{"a":1}\n{"a":2}\n', "jsonl"), [{ a: 1 }, { a: 2 }]);
  assert.equal(writeData([{ a: 1 }, { a: 2 }], "jsonl"), '{"a":1}\n{"a":2}\n');
  assert.deepEqual(parseData("[db]\nhost=x\nport=5\n", "ini"), { db: { host: "x", port: "5" } });
  assert.equal(writeData({ A: "1", B: "two words" }, "env"), 'A=1\nB="two words"\n');
  const yaml = { load: (t) => ({ loaded: t }), dump: (v) => `dumped:${JSON.stringify(v)}` };
  assert.deepEqual(parseData("k: v", "yaml", { yaml }), { loaded: "k: v" });
  assert.equal(writeData({ a: 1 }, "yaml", { yaml }), 'dumped:{"a":1}');
  assert.throws(() => parseData("k: v", "yaml"), /yaml adapter/);
});
```

- [ ] **Step 3: FAIL** — `node --test tests/unit/convert-subtitles.test.mjs tests/unit/convert-data.test.mjs`
- [ ] **Step 4: Implementuj.** ASS převod tagů: `<i>`↔`{\i1}`/`{\i0}`, `<b>`↔`{\b1}`/`{\b0}`, `<u>`↔`{\u1}`/`{\u0}`, `\N`↔`\n`, ostatní `{\…}` zahoď. ASS hlavička se sekcemi `[Script Info]` / `[V4+ Styles]` (SSA: `[V4 Styles]`) se stylem `Default`. LRC a TXT tagy odstraní, SRT/VTT/SBV je ponechají beze změny. MicroDVD zápis: snímek = `Math.round(ms * fps / 1000)`. CSV: RFC 4180. Oddělovač = ten z `, ; \t`, který je v prvním řádku nejčastěji. Hodnota s oddělovačem/uvozovkou/newline → v uvozovkách. Hlavička = sjednocení klíčů v pořadí výskytu. `env` hodnota s mezerou nebo `#` → v uvozovkách. `properties` = `key=value` s `\`-escapováním dle Java.
- [ ] **Step 5: PASS**
- [ ] **Step 6: Commit** — `feat(tools): subtitle and data format converters`

---

### Task 9: pandoc.wasm — ověřovací gate, vendor, engine

**Files:**
- Create: `public/tools/assets/js/lib/pandoc/` (vendor + `VENDOR.md` + `pandoc-worker.js`), `scripts/convert-pandoc-caps.mjs`, `src/lib/convert/text/pandoc-caps.ts` (generovaný), `src/lib/convert/pandoc-engine.ts`

**Interfaces:**
- Produces: `PANDOC_CAPS: { readonly readers: readonly string[]; readonly writers: readonly string[] }` (při selhání gate prázdná pole), `runPandoc(o: { input: Uint8Array; inputName: string; outputName: string; args: string[]; signal?: AbortSignal; onLoading?: () => void }): Promise<Uint8Array>`.

- [ ] **Step 1: Stáhni a prohlédni (bez instalace).** V nové prázdné složce ve scratchpadu: `npm pack wasm-pandoc@1.0.1` → rozbal do další nové složky. Přečti `README.md`, `package.json`, seznam souborů, licence. Zjisti velikost hlavního `.wasm` (`du -b`), `gzip -9 -c … | wc -c` a `brotli -q 11 -c … | wc -c` (pokud je brotli k dispozici).
- [ ] **Step 2: Ověř hosting.** Najdi v dokumentaci Vercelu (`mcp__claude_ai_Vercel__search_vercel_documentation` nebo web) limit velikosti jednoho statického souboru a jestli Vercel `application/wasm` komprimuje. Pro srovnání: `ffmpeg-core.wasm` má 30,7 MB a v `public/` se nasazuje.
- [ ] **Step 3: Ověř běh.** Harness (stejný vzor jako `scripts/convert-ffmpeg-caps.mjs`: lokální http server + chromium). Spusť pandoc **v module Workeru** bez `unsafe-eval` a převeď `# Ahoj\n\n*svět*` z `markdown` → `docx` a výsledný docx → `gfm`. Výstup musí obsahovat `# Ahoj` a `*svět*` a převod musí doběhnout do 10 s po načtení.
- [ ] **Step 4: GATE.** Projde, pokud: komprimovaný přenos ≤ 20 MB **a** soubor jde hostovat **a** Step 3 prošel. **Neprojde → STOP:** vytvoř `pandoc-caps.ts` s prázdnými poli a `// pandoc.wasm gate neprošel: <důvod>` a `pandoc-engine.ts` jako stub se stejnou signaturou `runPandoc`, který vždy vyhodí `Error("pandoc unavailable")` (Task 12 ho importuje). Doplň důvod do spec §5, commitni `chore(tools): pandoc gate failed — documents recognized only`, přeskoč Steps 5–8 a pokračuj Task 10. Uživateli to nahlas v závěrečném reportu.
- [ ] **Step 5: Vendor.** Zkopíruj potřebné soubory do `public/tools/assets/js/lib/pandoc/`. `VENDOR.md`: verze, zdroj, licence GPL-2.0-or-later + odkaz na zdrojový kód pandocu (stejně jako u GPL buildu ffmpeg). `pandoc-worker.js` (module worker): zpráva `{ id, args, inputName, input }` → pandoc s `input` zapsaným jako `inputName` → odpověď `{ id, ok: true, output }` (bajty souboru `outputName` z `args`) nebo `{ id, ok: false, error, stderr }`.
- [ ] **Step 6: Caps.** `scripts/convert-pandoc-caps.mjs` spustí `--list-input-formats` a `--list-output-formats` a zapíše `src/lib/convert/text/pandoc-caps.ts` (hlavička GENEROVÁNO). Spusť ho a ověř, že `readers` obsahuje `docx, odt, epub, rtf, html, markdown, rst, latex, org` a `writers` obsahuje `docx, odt, epub, html, gfm, plain`.
- [ ] **Step 7: `src/lib/convert/pandoc-engine.ts`** (client). Worker se vytvoří líně: `new Worker("/tools/assets/js/lib/pandoc/pandoc-worker.js?v=20261024a", { type: "module" })`. `onLoading` se zavolá před prvním načtením. Abort → `worker.terminate()`, reset singletonu, reject `ConvertCancelled` (import z `ffmpeg-engine.ts`).
- [ ] **Step 8: Commit** — `feat(tools): vendor pandoc.wasm and worker engine`

---

### Task 10: Směrování textových převodů + schopnosti formátů

**Files:**
- Create: `src/lib/convert/text/route.ts`, `src/lib/convert/capability.ts`
- Test: `tests/unit/convert-text-route.test.mjs`

**Interfaces:**
- Consumes: katalog (T2–T4), `SUBTITLE_FORMATS` + `DATA_FORMATS` (T8), `AV_TARGETS` (T5), `FFMPEG_CAPS` (T1), `PANDOC_CAPS` (T9).
- Produces:

```ts
export interface TextEnv { pandocReaders: readonly string[]; pandocWriters: readonly string[] }
export type TextOp = "subtitle" | "data" | "reencode" | "text-html" | "text-md" | "md-html" | "html-txt";
export interface TextStep { engine: "native" | "pandoc" | "pdfjs" | "print"; op?: TextOp; from: string; to: string }
export const PANDOC_NAMES: Readonly<Record<string, { reader?: string; writer?: string }>>;
export function textTargetsFor(entry: FormatEntry, env: TextEnv): TargetOption[];
export function planText(inputId: string, targetId: string, env: TextEnv): TextStep[] | null;
export function pandocArgs(step: TextStep, inName: string, outName: string, title: string): string[];
// capability.ts
export function formatCapability(entry: FormatEntry, env: TextEnv): { read: boolean; write: boolean };
```

`PANDOC_NAMES` (formatId → reader/writer): md→`markdown`/`gfm`, html→`html`/`html`, docx, odt, epub, rtf, rst, tex→`latex`, org, adoc→`asciidoc`/`asciidoc`, textile, mediawiki, dokuwiki, ipynb, dbk→`docbook`/`docbook5`, typ→`typst`/`typst`, fb2, jats, man, txt→–/`plain`, opml, creole→`creole`/–, t2t→`t2t`/–, bib→`bibtex`/–, ris→`ris`/–, csv→`csv`/– (jen čtení tabulky do dokumentu). Reader/writer platí jen tehdy, když je v `env`.

Pravidla `planText` (vrací první platné):
1. `inputId === targetId` a vstup je textový (není pdf/docx/odt/epub) → `[{native, reencode}]`.
2. Obojí titulky (`SUBTITLE_FORMATS`, vč. cíle `txt`) → `[{native, subtitle}]`. Titulky → cokoliv jiného → `null`.
3. Obojí data (`DATA_FORMATS`) → `[{native, data}]`.
4. Vstup `plain`/`code`: → `txt` = reencode, → `md` = `text-md`, → `html` = `text-html`, → `pdf` = `text-html` + `{print, html→pdf}`, → jiný pandoc writer = `text-md` + `{pandoc, from:"markdown", to:writer}`.
5. Vstup `pdf`: `{pdfjs, pdf→txt}` + případně krok podle pravidla 4 (pro txt nic dalšího).
6. Vstup s pandoc readerem: cíl s writerem → `[{pandoc, reader→writer}]`; cíl `pdf` → `{pandoc, reader→html}` + `{print}`.
7. Fallback bez pandocu: `md→html` = `md-html`, `html→txt` = `html-txt`, `md→pdf` = `md-html` + `print`, `html→pdf` = `[{print}]`.
8. Jinak `null`.

`textTargetsFor` = všechna id z katalogu, pro která `planText` ≠ null, seřazená doporučené-první. Doporučené: dokumenty `docx, pdf, md, html, txt`; data `json, csv, yaml`; titulky `srt, vtt`; plain/code `txt, pdf, docx`.

`formatCapability`: audio/video `read` = `demuxer` ∈ `FFMPEG_CAPS.demuxers`, `write` = existuje `AV_TARGETS` s `formatId === id`. Text `read` = `textTargetsFor(entry, env).length > 0`, `write` = id je cílem alespoň jednoho čitelného formátu (spočítej jednou a cachuj per env).

- [ ] **Step 1: Failing testy**

```js
const ENV = { pandocReaders: ["markdown","html","docx","odt","epub","rtf","latex"], pandocWriters: ["gfm","html","docx","odt","epub","plain","latex"] };
const NONE = { pandocReaders: [], pandocWriters: [] };
test("planText", () => {
  assert.deepEqual(planText("srt", "vtt", ENV), [{ engine: "native", op: "subtitle", from: "srt", to: "vtt" }]);
  assert.equal(planText("srt", "docx", ENV), null);
  assert.deepEqual(planText("docx", "md", ENV), [{ engine: "pandoc", from: "docx", to: "gfm" }]);
  assert.deepEqual(planText("docx", "pdf", ENV), [{ engine: "pandoc", from: "docx", to: "html" }, { engine: "print", from: "html", to: "pdf" }]);
  assert.deepEqual(planText("pdf", "docx", ENV), [{ engine: "pdfjs", from: "pdf", to: "txt" }, { engine: "native", op: "text-md", from: "txt", to: "md" }, { engine: "pandoc", from: "markdown", to: "docx" }]);
  assert.deepEqual(planText("txt", "pdf", ENV), [{ engine: "native", op: "text-html", from: "txt", to: "html" }, { engine: "print", from: "html", to: "pdf" }]);
  assert.deepEqual(planText("json", "csv", ENV), [{ engine: "native", op: "data", from: "json", to: "csv" }]);
  assert.deepEqual(planText("txt", "txt", ENV), [{ engine: "native", op: "reencode", from: "txt", to: "txt" }]);
  assert.deepEqual(planText("py", "html", ENV), [{ engine: "native", op: "text-html", from: "py", to: "html" }]);
  assert.equal(planText("doc", "txt", ENV), null);
  assert.deepEqual(planText("md", "html", NONE), [{ engine: "native", op: "md-html", from: "md", to: "html" }]);
  assert.equal(planText("docx", "md", NONE), null);
});
test("targets and args", () => {
  assert.deepEqual(textTargetsFor(findById("doc"), ENV), []);
  assert.deepEqual(textTargetsFor(findById("docx"), ENV).filter((o) => o.group === "recommended").map((o) => o.id), ["pdf","md","html","txt"]);
  assert.deepEqual(pandocArgs({ engine: "pandoc", from: "docx", to: "gfm" }, "input.docx", "out.md", "Zpráva"),
    ["-f","docx","-t","gfm","--standalone","--wrap=preserve","--metadata=pagetitle:Zpráva","-o","out.md","input.docx"]);
});
test("formatCapability", () => {
  assert.deepEqual(formatCapability(findById("mp3"), ENV), { read: true, write: true });
  assert.deepEqual(formatCapability(findById("ra"), ENV), { read: true, write: false });
  assert.deepEqual(formatCapability(findById("mid"), ENV), { read: false, write: false });
  assert.deepEqual(formatCapability(findById("srt"), ENV), { read: true, write: true });
  assert.deepEqual(formatCapability(findById("doc"), ENV), { read: false, write: false });
  assert.deepEqual(formatCapability(findById("pdf"), ENV), { read: true, write: true });
});
```

(V testu doporučených pro docx chybí `docx`, protože jde o vstupní formát. Stejné pravidlo jako v Task 5.)

- [ ] **Step 2: FAIL** · **Step 3: Implementuj** · **Step 4: PASS** — `node --test tests/unit/convert-text-route.test.mjs`
- [ ] **Step 5: Commit** — `feat(tools): text conversion routing and format capabilities`

---

### Task 11: ConverterApp pro audio a video + handoff

**Files:**
- Create: `src/lib/tools-handoff.ts`, `src/components/tools/use-stashed-files.ts`, `src/components/tools/converter/{i18n.ts,converter-app.tsx,detected-card.tsx,target-picker.tsx,av-options.tsx}`
- Modify: `src/components/tools/tools/audio-convert.tsx` (default export), `src/components/tools/tools/video-convert.tsx` (celý obsah), `src/components/tools/tools/{video-compress,video-trim,video-to-gif,audio-trim-normalize}.tsx` (1 řádek hook), `src/components/tools/registry/data.ts:102-105,141,144` + `TOOL_I18N` en, `src/styles/tools.css`
- Test: `tests/unit/tools-handoff.test.mjs`, `tests/unit/converter-i18n.test.mjs`

**Interfaces:**
- Consumes: `detectFile` (T2), `avTargetsFor`, `canRemux`, `findTarget`, `WARN_BYTES` (T5), `probeFile`, `convertAv`, `ConvertCancelled`, `FileTooLarge` (T6), `formatCapability` (T10), `localized` (T2), `Dropzone`, `Progress` z `media-shared.tsx`.
- Produces:

```ts
// src/lib/tools-handoff.ts (bez React, node-testable)
export function stashFiles(slug: string, files: File[]): void;      // nahradí předchozí
export function takeStashedFiles(slug: string): File[];             // vrátí a smaže
// src/components/tools/use-stashed-files.ts
export function useStashedFiles(slug: string, onFiles: (files: File[]) => void): void;  // jednou po mountu
// converter/i18n.ts
export interface ConverterStrings { /* klíče níže, všechny string */ }
export const CONVERTER_I18N: Record<Locale, ConverterStrings>;
// converter/converter-app.tsx
export function ConverterApp(props: { locale: Locale; kind: MediaKind; slug: "audio-convert" | "video-convert" | "text-convert" }): JSX.Element;
// converter/av-options.tsx
export interface AvOptionsValue { quality: Quality; remux: boolean; maxHeight: number | null }
```

**ConverterStrings klíče** (cs text v závorce; přesně tyto klíče, placeholdery `{x}` musí sedět ve všech jazycích): `drop_title_audio` („Přetáhněte audio“), `drop_title_video` („Přetáhněte video“), `drop_title_text` („Přetáhněte dokument, titulky nebo data“), `drop_hint` („Libovolný soubor — formát poznáme sami“), `detected` („Rozpoznáno“), `by_magic` („podle obsahu“), `by_extension` („podle přípony“), `by_content` („podle textu“), `by_mime` („podle typu“), `ext_mismatch` („Přípona .{ext} neodpovídá obsahu ({name}).“), `wrong_kind` („Tohle je {label}. Na to je lepší {tool}.“), `unknown` („Formát se nepodařilo rozpoznat.“), `read_unsupported` („Formát {name} známe, ale v prohlížeči ho převést neumíme.“), `target_label` („Převést na“), `group_recommended` („Doporučené“), `group_video` („Video“), `group_audio` („Jen zvuk“), `group_other` („Další formáty“), `target_search` („Hledat formát…“), `quality_label` („Kvalita“), `quality_low` („Menší soubor“), `quality_medium` („Vyvážená“), `quality_high` („Vysoká“), `quality_lossless` („Bezeztrátová“), `remux_label` („Rychle bez překódování“), `remux_hint` („Kodeky jsou kompatibilní — převod bez ztráty kvality během pár sekund.“), `max_height_label` („Maximální výška“), `max_height_original` („Původní“), `encoding_in` („Kódování vstupu“), `encoding_out` („Kódování výstupu“), `encoding_auto` („Automaticky ({enc})“), `line_endings` („Konce řádků“), `line_keep` („Zachovat“), `fix_mojibake` („Opravit rozsypaný čaj“), `mojibake_found` („Text vypadá rozsypaně — zapněte opravu.“), `unmappable` („{count} znaků nejde v {enc} zapsat, nahrazeny ?“), `sub_shift` („Posun titulků (ms)“), `sub_fps` („Snímků za sekundu“), `run` („Převést“), `cancel` („Zrušit“), `cancelled` („Převod zrušen“), `loading_engine` („Načítám převodník (~{size}) — poprvé to chvíli trvá…“), `probing` („Zjišťuji obsah souboru…“), `progress` („{pct} % · zbývá ~{eta}“), `progress_unknown` („Převádím…“), `done` („Hotovo“), `size_change` („{from} → {to}“), `download` („Stáhnout {name}“), `again` („Převést jiný soubor“), `continue_with` („Pokračovat v…“), `large_warn` („Soubor má {size} — v prohlížeči to může trvat dlouho.“), `too_large` („Soubor je větší než {limit}, v prohlížeči ho nezpracujeme.“), `error` („Převod se nezdařil.“), `error_details` („Technické detaily“), `pdf_print_hint` („PDF se vytvoří přes tisk — v dialogu zvolte „Uložit jako PDF“.“), `print_open` („Otevřít tisk do PDF“), `tabular_required` („Pro CSV/TSV musí data být seznam objektů.“), `preview` („Náhled“), `privacy` („Soubor neopouští váš prohlížeč.“), `enc_title` („Všechny známé formáty ({count})“), `enc_search` („Hledat název, příponu nebo popis…“), `cap_read` („převod z“), `cap_write` („převod do“), `cap_none` („jen rozpoznání“), `enc_empty` („Nic nenalezeno.“).

- [ ] **Step 1: Failing testy**

```js
// tests/unit/tools-handoff.test.mjs
import { stashFiles, takeStashedFiles } from "../../src/lib/tools-handoff.ts";
test("stash/take", () => {
  const a = new File(["a"], "a.mp4"), b = new File(["b"], "b.mp4");
  stashFiles("video-convert", [a]); stashFiles("video-convert", [b]);
  assert.deepEqual(takeStashedFiles("audio-convert"), []);
  assert.deepEqual(takeStashedFiles("video-convert"), [b]);
  assert.deepEqual(takeStashedFiles("video-convert"), []);
});
// tests/unit/converter-i18n.test.mjs
import { CONVERTER_I18N } from "../../src/components/tools/converter/i18n.ts";
const ph = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
test("7 locales, same keys and placeholders", () => {
  const locales = ["cs","en","de","es","uk","fr","sk"];
  assert.deepEqual(Object.keys(CONVERTER_I18N).sort(), [...locales].sort());
  const keys = Object.keys(CONVERTER_I18N.cs).sort();
  assert.ok(keys.length >= 60);
  for (const l of locales) {
    assert.deepEqual(Object.keys(CONVERTER_I18N[l]).sort(), keys, l);
    for (const k of keys) {
      assert.ok(CONVERTER_I18N[l][k].trim(), `${l}.${k} empty`);
      assert.equal(ph(CONVERTER_I18N[l][k]), ph(CONVERTER_I18N.cs[k]), `${l}.${k} placeholders`);
    }
  }
});
```

- [ ] **Step 2: FAIL** · **Step 3: Implementuj `tools-handoff.ts` a `i18n.ts`** (všech 7 jazyků přeložit, `import type { Locale }`) · **Step 4: PASS** — `node --test tests/unit/tools-handoff.test.mjs tests/unit/converter-i18n.test.mjs`

- [ ] **Step 5: UI komponenty.** Stavový automat `ConverterApp`: `idle → detecting → ready | wrong-kind | unsupported → loading → probing → ready → converting → done | error | cancelled`. Na vstup: `head = new Uint8Array(await file.slice(0, 4096).arrayBuffer())` → `detectFile({ name, type, head }, kind)`.
  - `wrong-kind`: `DetectedCard` s odkazem. image → `/${locale}/tools/image-convert`, jiný media kind → jeho konvertor (soubor se předá přes `stashFiles`), archive/null → bez odkazu.
  - `unsupported`: `formatCapability(...).read === false` → `read_unsupported` + `entry.note`.
  - Jinak `probeFile` → `avTargetsFor` → výchozí cíl = první doporučený. `remux` je výchozí `true`, checkbox je vidět jen když `canRemux(probe, target)`.
  - Převod přes `convertAv` s `AbortController`. Tlačítko Zrušit volá `abort()`.
  - Výsledek: náhled (`<video>`/`<audio>` podle `canPlayType(mime)`, `<img>` pro gif/webp/apng), `size_change` + `ResultArea`-like tlačítko stažení s `filename`. „Pokračovat v…“: video → `video-compress`, `video-trim`, `video-to-gif`; audio → `audio-trim-normalize`. Klik = `stashFiles(slug, [new File([blob], filename, { type })])` + `router.push(`/${locale}/tools/${slug}`)`.
  - Chyba → `error` + `<details>` s posledními 30 řádky logu. `FileTooLarge` → `too_large`. Nad `WARN_BYTES` se ukáže `large_warn`.
  - Dropzone `accept={[]}` (bez filtru), `maxSize` nenastavovat (limit řeší engine).
  - `useStashedFiles(slug, onFiles)` v `ConverterApp` i ve 4 cílových nástrojích (předá do jejich existujícího `onFiles`).
  - `audio-convert.tsx`: `export default function AudioConvert({ locale }: ToolComponentProps) { return <ConverterApp locale={locale} kind="audio" slug="audio-convert" />; }`, re-exporty helperů zůstávají. `video-convert.tsx` analogicky (celý starý obsah pryč).
- [ ] **Step 6: Registry (`data.ts`).** Z `FFMPEG_TOOLS` odeber `audio-convert` a `video-convert` (→ status `working`). Řádek 141: `["video-convert", "Video konvertor", "Převeďte video mezi MP4, MOV, MKV, WebM, AVI, GIF a dalšími — rozpozná přes 100 formátů.", "media", "client", "Video", true]`. Řádek 144: `["audio-convert", "Audio konvertor", "Převeďte audio mezi MP3, M4A, WAV, FLAC, OPUS, OGG a dalšími — rozpozná přes 100 formátů.", "media", "client", "Music", true]`. `TOOL_I18N.en`: `"Video converter"` / `"Convert video between MP4, MOV, MKV, WebM, AVI, GIF and more — recognizes 100+ formats."` a `"Audio converter"` / `"Convert audio between MP3, M4A, WAV, FLAC, OPUS, OGG and more — recognizes 100+ formats."`.
- [ ] **Step 7: CSS** v sekci `/* ── Konvertory ── */` (`cv-app, cv-detected, cv-badge, cv-target-picker, cv-target-group, cv-target-opt, cv-options, cv-result, cv-preview, cv-continue`). Na šířce 360 px nesmí vzniknout horizontální scroll.
- [ ] **Step 8: Ověření.** `npm run typecheck && npm run lint && npm run test:unit` → 0 chyb. `npm run dev` + prohlížeč (`/cs/tools/video-convert`):
  (a) MP4 → karta „Rozpoznáno: MPEG-4 · podle obsahu“;
  (b) cíl MKV → zaškrtnuté „Rychle bez překódování“, převod do pár sekund, stáhne se `<jméno>.mkv`;
  (c) MP4 → GIF → náhled `<img>`;
  (d) WAV soubor přejmenovaný na `.mp3` v audio konvertoru → nesoulad přípony;
  (e) PNG do video konvertoru → odkaz na Převod formátu;
  (f) Zrušit během MP4 → H.265, pak MKV → projde;
  (g) „Pokračovat v… Komprese videa“ → komprese má soubor rovnou načtený;
  (h) `/en/tools/audio-convert` → anglické texty.
- [ ] **Step 9: Commit** — `git add` jmenovitě všechny soubory z bloku Files → `feat(tools): universal audio/video converter UI with handoff`

---

### Task 12: Text konvertor

**Files:**
- Create: `src/lib/convert/run-text.ts`, `src/components/tools/converter/text-options.tsx`, `src/components/tools/converter/print-pdf.ts`, `src/components/tools/tools/text-convert.tsx`
- Modify: `src/components/tools/converter/converter-app.tsx` (větev `kind === "text"`), `src/components/tools/registry/text.ts`, `src/components/tools/registry/data.ts` (RAW_TOOLS + TOOL_I18N en), `src/styles/tools.css`

**Interfaces:**
- Consumes: T7 (`guessEncoding`, `decodeBytes`, `encodeText`, `fixMojibake`, `detectMojibake`, `convertLineEndings`, `OutputEncoding`), T8, T9 (`runPandoc`, `PANDOC_CAPS`), T10 (`planText`, `textTargetsFor`, `pandocArgs`).
- Produces:

```ts
export interface TextOptionsValue { inputEncoding: "auto" | string; outputEncoding: OutputEncoding; lineEndings: "keep" | "lf" | "crlf"; fixMojibake: boolean; shiftMs: number; fps: number }
export const DEFAULT_TEXT_OPTIONS: TextOptionsValue; // auto, utf-8, keep, false, 0, 25
export type TextResult =
  | { kind: "file"; blob: Blob; filename: string; preview: string | null; warnings: string[] }
  | { kind: "print"; html: string; filename: string; warnings: string[] };
export async function runTextConversion(o: { file: File; entry: FormatEntry; targetId: string; options: TextOptionsValue; signal: AbortSignal; onPhase: (p: "loading" | "converting") => void }): Promise<TextResult>;
export function printHtmlAsPdf(cleanHtml: string, title: string): void;
```

- [ ] **Step 1: `run-text.ts`.** Kroky z `planText(entry.id, targetId, { pandocReaders: PANDOC_CAPS.readers, pandocWriters: PANDOC_CAPS.writers })` provádí postupně.
  - Textový vstup: dekóduj (`inputEncoding === "auto"` → `guessEncoding`), volitelně `fixMojibake`.
  - `text-html` = minimální HTML dokument s `<pre>` (escapováno) a `<title>`; `text-md` = obsah (code v ```` ```codeLang ```` fence); `md-html` = marked (vendor `marked.min.js`) + DOMPurify; `html-txt` = `DOMParser` → `textContent`.
  - `pdfjs` = stejný postup jako `src/components/tools/tools/pdf-extract-text.tsx`; `pandoc` = `runPandoc` s `pandocArgs`.
  - `print` → výsledek `kind:"print"` s HTML prošlým DOMPurify (`FORBID_TAGS: ["script","iframe","object","embed"]`, zákaz `on*` atributů je výchozí).
  - Textové výstupy: `convertLineEndings` → `encodeText(outputEncoding)`. `unmappable > 0` → warning `unmappable`. Binární výstupy (docx, odt, epub) nechávají bajty z pandocu.
  - `preview` = prvních 5000 znaků textového výstupu, pro html výstup `null`. HTML náhled kreslí UI zvlášť v `<iframe sandbox="" srcdoc>` ze sanitizovaného HTML.
  - `TabularError` → warning/err `tabular_required`. Filename přes `outputFilename(file.name, ext)` (T5).
- [ ] **Step 2: `print-pdf.ts`.** Skrytý `<iframe>` bez `sandbox` (tisk to potřebuje) se `srcdoc` = už sanitizované HTML + tiskové CSS (A4, okraje 18 mm, systémové písmo). Po `load` → `contentWindow.print()`, po `afterprint` (nebo po 60 s) iframe odstraň. Tlačítko „Otevřít tisk do PDF“ volá tuto funkci až na klik uživatele (gesto).
- [ ] **Step 3: `text-options.tsx` + větev v `ConverterApp`.** Volby kódování a konců řádků jen u textových výstupů. Posun a fps jen u titulků (fps jen pro `sub`). Banner `mojibake_found`, když `detectMojibake` na náhledu vstupu. U `print` hint `pdf_print_hint`. Když `PANDOC_CAPS.readers.length > 0`, při prvním pandoc kroku fáze `loading` se `loading_engine` a velikostí z T9.
- [ ] **Step 4: Registrace.** `text-convert.tsx`: `export default function TextConvert({ locale }: ToolComponentProps) { return <ConverterApp locale={locale} kind="text" slug="text-convert" />; }`. `registry/text.ts`: `"text-convert": TextConvert`. `data.ts` (sekce Text, první řádek): `["text-convert", "Text konvertor", "Převeďte dokumenty, titulky, data i kódování textu (DOCX, MD, HTML, PDF, SRT, CSV, JSON…).", "text", "client", "FileText", true]`. `TOOL_I18N.en`: `"Text converter"` / `"Convert documents, subtitles, data and text encodings (DOCX, MD, HTML, PDF, SRT, CSV, JSON…)."`.
- [ ] **Step 5: Ověření.** `npm run typecheck && npm run lint && npm run test:unit`. Dev server `/cs/tools/text-convert`:
  (a) SRT v CP1250 → VTT → stažený soubor v UTF-8 se správnou diakritikou;
  (b) „pĹ™Ă­liĹˇ“ v TXT + oprava → „příliš“;
  (c) CSV se `;` → JSON;
  (d) DOCX → MD (pokud prošel gate);
  (e) MD → PDF otevře tiskový dialog;
  (f) `.doc` → `read_unsupported` + rada;
  (g) JSON objekt → CSV → `tabular_required`.
- [ ] **Step 6: Commit** — `feat(tools): text converter (documents, subtitles, data, encodings)`

---

### Task 13: Encyklopedie formátů

**Files:**
- Create: `src/components/tools/converter/format-encyclopedia.tsx`
- Modify: `src/lib/convert/catalog/index.ts` (+ `searchFormats`), `converter-app.tsx` (render pod konvertorem), `src/styles/tools.css`
- Test: `tests/unit/convert-catalog.test.mjs` (doplnit)

**Interfaces:**
- Produces: `searchFormats(entries: readonly FormatEntry[], q: string, locale: string): FormatEntry[]` (bez diakritiky, case-insensitive; přípona s tečkou i bez; přesná shoda přípony první, pak název, pak popis), `FormatEncyclopedia({ kind, locale, strings }: { kind: MediaKind; locale: Locale; strings: ConverterStrings })`.

- [ ] **Step 1: Failing test**

```js
import { searchFormats } from "../../src/lib/convert/catalog/index.ts";
test("searchFormats", () => {
  const A = catalogFor("audio"), T = catalogFor("text");
  assert.equal(searchFormats(A, ".WMA", "cs")[0].id, "wma");
  assert.ok(searchFormats(A, "realaudio", "cs").some((f) => f.id === "ra"));
  assert.ok(searchFormats(T, "titulky", "cs").some((f) => f.id === "srt"));
  assert.ok(searchFormats(T, "subtitles", "en").some((f) => f.id === "srt"));
  assert.equal(searchFormats(A, "", "cs").length, A.length);
});
```

(`desc.cs` u `srt` musí obsahovat slovo „titulky“ a `desc.en` slovo „subtitles“. Případně uprav data v Task 4.)

- [ ] **Step 2: FAIL** · **Step 3: Implementuj.** Komponenta: sbalený `<details>` s nadpisem `enc_title` (počet), vyhledávání, chipy rodin, seznam řádků (název, přípony `.mp3 .mpga`, popis v locale, badge `cap_read`/`cap_write`/`cap_none` z `formatCapability`, `note`). Katalog se importuje dynamicky až při otevření `<details>`. Virtualizace není potřeba (≤ 200 řádků). · **Step 4: PASS + typecheck/lint**
- [ ] **Step 5: Ověření** v dev serveru: rozbalit na `/cs/tools/audio-convert`, hledat „mod“ → tracker formát s badge „jen rozpoznání“.
- [ ] **Step 6: Commit** — `feat(tools): searchable format encyclopedia in converters`

---

### Task 14: Hub — 3 tlačítka nahoře + přetažení souboru kamkoliv

**Files:**
- Create: `src/lib/convert/route-kind.ts`, `src/components/tools/converter-launchers.tsx`
- Modify: `src/components/tools/hub-app.tsx` (render + drop na `<main>`), `src/components/tools/registry/data.ts` (`HubI18n` + `HUB_CS` + `HUB_EN`), `src/styles/tools.css`
- Test: `tests/unit/convert-route-kind.test.mjs`

**Interfaces:**
- Consumes: `FORMAT_COUNTS` (T2, statický import — žádná data katalogu do hub bundlu), `detectFile` (T2, **jen dynamický `import()`** při dropu), `stashFiles` (T11).
- Produces: `converterSlugFor(kind: Detection["kind"]): "video-convert" | "audio-convert" | "text-convert" | null`, `ConverterLaunchers({ locale, strings }: { locale: Locale; strings: HubI18n })`.
- Nové klíče `HubI18n` (cs / en): `launchers_label` („Rychlé převody“ / „Quick converters“), `launcher_video` („Video konvertor“ / „Video converter“), `launcher_audio` („Audio konvertor“ / „Audio converter“), `launcher_text` („Text konvertor“ / „Text converter“), `launcher_formats` („{count} formátů“ / „{count} formats“), `launcher_drop` („Klikněte nebo sem přetáhněte soubor“ / „Click or drop a file here“), `drop_overlay` („Pusťte soubor — poznáme formát a otevřeme správný konvertor“ / „Drop the file — we’ll detect the format and open the right converter“), `drop_unsupported` („{label}: tenhle typ konvertory nepřevádějí. Zkuste vyhledat nástroj.“ / „{label}: converters don’t handle this type. Try searching for a tool.“). Příklady formátů jsou literály: video `MP4 · MOV · MKV · AVI · WebM`, audio `MP3 · M4A · WAV · FLAC · OPUS`, text `DOCX · MD · PDF · SRT · CSV`.

- [ ] **Step 1: Failing test** — `converterSlugFor("video") === "video-convert"`, `("audio") === "audio-convert"`, `("text") === "text-convert"`, `("image") === null`, `("archive") === null`, `(null) === null`.
- [ ] **Step 2: FAIL** · **Step 3: Implementuj `route-kind.ts`** · **Step 4: PASS**
- [ ] **Step 5: `ConverterLaunchers`.**
  - `<nav className="hub-launchers" aria-label={launchers_label}>` se 3 tlačítky `.hub-launcher` (barva `--launcher-color`: video `#ec4899`, audio `#8b5cf6`, text `#10b981`).
  - Každé tlačítko: ikona, název, `launcher_formats` s `FORMAT_COUNTS[kind]`, příklady, `launcher_drop`.
  - Klik = odkaz `/${locale}/tools/<slug>`.
  - Drop na tlačítko = `stashFiles(slug, files)` + `router.push`, bez detekce (konvertor pozná špatný druh sám). Klávesnice: Enter/Space.
  - Vedle odkazu je skrytý `<input type=file data-testid="launcher-input-<kind>">`. Jeho `change` dělá totéž co drop (pro e2e a pro výběr souboru bez přechodu na stránku).
  - Layout: ≥ 640 px tři sloupce, pod tím tři kompaktní řádky.
- [ ] **Step 6: `hub-app.tsx`.** `<ConverterLaunchers …/>` vlož jako **první dítě** `.hub-hero-inner` (nad `.hub-hero-top`). Na `<main>` přidej `onDragEnter/Over/Leave/Drop` s čítačem (jako `Dropzone`). Při tažení souborů `.hub-drop-overlay` s `drop_overlay`. Drop mimo launchery: `const { detectFile } = await import("@/lib/convert/detect")`, `detectFile` nad prvním souborem → `converterSlugFor(kind)` → `stashFiles` + `router.push`. `null` → `toastInfo(drop_unsupported)` (label = `detection.label ?? file.name`). Drop na launcher volá `stopPropagation`.
- [ ] **Step 7: Ověření.** `npm run typecheck && npm run lint && npm run test:unit`. Dev:
  (a) `/cs/tools/` → tři tlačítka jsou první obsah pod hlavičkou, na 360 px bez horizontálního scrollu;
  (b) MP4 přetažený kamkoliv na hub → otevře se video konvertor s rozpoznaným souborem;
  (c) PDF na hub → text konvertor;
  (d) ZIP → toast;
  (e) katalog není v bundlu hubu: na `/cs/tools/` bez dropu přes `evaluate_script` projdi `performance.getEntriesByType("resource")`, stáhni každý `.js` a ověř, že žádný neobsahuje řetězec `RealAudio`.
- [ ] **Step 8: Commit** — `feat(tools): converter launchers at the top of the hub + drop anywhere`

---

### Task 15: E2E testy a závěrečné ověření

**Files:**
- Create: `tests/e2e/converters.e2e.mjs`
- Modify: `package.json` (script `"test:e2e:convert": "node --test tests/e2e/converters.e2e.mjs"`)

**Interfaces:**
- Consumes: celé UI z T11–T14, `encodeText` (T7) pro fixture v CP1250.

- [ ] **Step 1: Napiš e2e** (vzor `tests/e2e/aifb.e2e.mjs`: playwright-core, `CHROMIUM_PATH`, `BASE_URL`).
  - `test.before`: `mkdtemp` v `os.tmpdir()` a systémový `ffmpeg` (chybí-li → `test.skip` celé sady s hláškou) vyrobí:
    - `tone.wav`: `-f lavfi -i sine=frequency=440:duration=2`
    - `clip.mp4`: `-f lavfi -i testsrc=duration=2:size=320x240:rate=15 -f lavfi -i sine=duration=2 -c:v libx264 -c:a aac -shortest`
  - Zapíše `titulky.srt` jako CP1250 bajty textu `1\r\n00:00:01,000 --> 00:00:02,000\r\npříliš žluťoučký kůň\r\n` a `xss.md` s `# T\n\n<img src=x onerror="window.top.__xss=1">\n`.
  - `addInitScript(() => { window.print = () => { window.top.__printed = true; }; })`.

  Testy (každý vlastní `test`):
  1. **hub launchers first**: `/cs/tools/` → `.hub-launcher` má 3 prvky s texty Video/Audio/Text konvertor. První `.hub-launcher` je v DOM před `h1`.
  2. **wav → mp3**: `setInputFiles` na `[data-testid=launcher-input-audio]` → URL `/cs/tools/audio-convert`, karta obsahuje „WAV“. Vyber cíl MP3, „Převést“, `waitForEvent("download")` → `suggestedFilename() === "tone.mp3"`, velikost > 1000 B.
  3. **mp4 → mkv remux**: video konvertor, cíl MKV, je vidět `remux_hint`, stažení `clip.mkv` do 20 s.
  4. **cancel then convert**: cíl MP4 (H.265), „Převést“, po 1 s „Zrušit“ → text „Převod zrušen“. Cíl MKV → stažení projde.
  5. **cp1250 srt → vtt**: text konvertor, cíl VTT. Obsah staženého souboru začíná `WEBVTT` a obsahuje `příliš žluťoučký kůň`.
  6. **xss md preview/print**: `xss.md` → cíl HTML → náhled se vykreslí. Pak cíl PDF → klik „Otevřít tisk do PDF“ → `window.__printed === true`. Po 1 s `window.__xss === undefined`.
  7. **drop anywhere**: `page.evaluateHandle` s `DataTransfer` + `File` (bajty `clip.mp4` přes `page.evaluate` s base64) → `dispatchEvent("drop")` na `main` → URL `/cs/tools/video-convert` a karta „MPEG-4“.
- [ ] **Step 2: Spusť proti dev serveru** — `npm run dev` (jiný terminál), `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e:convert` → 7/7 PASS (žádný test nezávisí na pandocu: MD → HTML jde i nativně).
- [ ] **Step 3: Závěrečná sada** — `npm run typecheck && npm run lint && npm run test:unit && npx next build` → vše zelené. `git status` → `src/styles/vevit-tailwind.css` je pořád jen necommitnutá změna uživatele a nic dalšího necommitnutého.
- [ ] **Step 4: Ruční kontrola v prohlížeči** (Chrome DevTools MCP): hub v cs/en na 360 px a 1280 px, `lighthouse_audit` hubu bez regrese přístupnosti (≥ hodnota na `main`), konzole bez chyb na všech 3 konvertorech.
- [ ] **Step 5: Commit** — `test(tools): converters e2e suite`
- [ ] **Step 6: Report uživateli.** Co je hotové, výsledek gate pandocu, odchylky od plánu (chybějící kodeky z T1), co zbývá do další fáze (spec §4). Bez deploye.
