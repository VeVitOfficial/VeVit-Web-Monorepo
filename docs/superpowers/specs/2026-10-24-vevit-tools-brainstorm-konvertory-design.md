# VeVit Tools — brainstorming + návrh univerzálních konvertorů

Datum: 2026-10-24 · Stav: návrh k odsouhlasení · Prováděcí plán Fáze 1: `docs/superpowers/plans/2026-10-24-vevit-tools-konvertory.md`

Uživatel otázky přeskočil („přeskoč otázky a začni sám“). Kde není napsáno jinak, jde o **moje rozhodnutí**. Shrnutá jsou v sekci 6.

---

## 1. Výchozí stav (zjištěno v kódu)

| Oblast | Zjištění | Důkaz |
|---|---|---|
| Architektura | Tools jsou React (Next 16 App Router). Hub `src/components/tools/hub-app.tsx`, stránka nástroje `src/app/tools/[tool]/page.tsx`, 107 komponent v `src/components/tools/tools/<slug>.tsx`, registr `src/components/tools/registry/*`. Těžké knihovny leží jako vendor v `public/tools/assets/js/lib/` (žádné npm závislosti). | `registry/index.ts` (komentář s konvencí) |
| Média | ffmpeg.wasm 0.12 (core 0.12.10, **single-thread**, 30,7 MB wasm). Build obsahuje x264, x265, libvpx (VP8/VP9), LAME, Vorbis, Opus, Theora, WebP, libass, zimg a všechny nativní dekodéry/enkodéry (AAC, FLAC, ALAC, AC3, WMA2, MPEG-4, ProRes, DNxHD, FFV1…). | `strings ffmpeg-core.wasm` → `--enable-…` |
| Média – limity | Vstup se kopíruje celý do paměti (`writeFile`), limit 100 MB. UI nemá tlačítko Zrušit. Průběh skáče 2 → 30 → 100 %. Výstup se jmenuje `prevedeno.<ext>`. | `ffmpeg-media.js`, `video-convert.tsx` |
| Média – formáty | `video-convert`: jen MP4/WebM. `audio-convert`: jen MP3/WAV/OGG/FLAC. Dropzone přijímá jen pár přípon. | `video-convert.tsx:12`, `audio-convert.tsx:312` |
| ffmpeg API | Vendorovaný `@ffmpeg/ffmpeg` umí `mount('WORKERFS')`, `createDir`, `deleteDir` a log/progress eventy. Soubor tak jde připojit bez kopírování. | `ffmpeg/classes.js:223,284,302` |
| Lokalizace | **Regrese:** PHP éra měla ~940 klíčů × 7 jazyků pro šablony nástrojů. React port má češtinu napevno ve všech 107 komponentách (14 má jen ruční `locale === "en"`). `TOOL_UI_I18N` i `HUB_I18N` mapují de/es/uk/fr/sk na češtinu. Původní slovníky jsou v historii: `git show dea3ca9^:tools/lang/<lang>.php`. | grep přes `src/components/tools/tools` |
| Hub | Nadpis „Nástroje pro“ je napevno česky, stejně jako návrhy hledání a aria-labely. Kategorie se zobrazují dvakrát (dlaždice i select). K tomu 5 selectů s filtry. | `hub-app.tsx:81-88,168,212,268` |
| SEO | `public/sitemap.xml` má jen 7 URL hubu. Stránky jednotlivých nástrojů v sitemapě nejsou. | `grep -c tools/ public/sitemap.xml` |
| Statusy | Všech 9 ffmpeg nástrojů má napevno „Omezeně dostupné“. Je to dědictví CSP na WEDOS. Na Vercelu je `wasm-unsafe-eval` globálně povolené. | `data.ts:102,240`, `next.config.ts` |
| Drobnosti | Překlep „Přeďte“ v popisu video/audio konverze. `ai-image-gen` je trvale „Připravujeme“. | `data.ts:141,144` |
| Hlavičky | `Permissions-Policy: camera=(), microphone=()` globálně blokuje nástroje s kamerou nebo mikrofonem (budoucí nahrávání). COEP `credentialless` dovoluje SharedArrayBuffer, takže by šlo nasadit multi-thread ffmpeg. | `next.config.ts:7,13` |

---

## 2. Brainstorming

Priorita: **P1** = hned, **P2** = další vlna, **P3** = až bude čas. Náročnost: **S** ≤ 1 den, **M** 2–4 dny, **L** týden a víc.

### 2.1 Opravy a technický dluh

| # | Nápad | Prio | Náročnost |
|---|---|---|---|
| D1 | **Obnovit lokalizaci nástrojů**: převést `tools/lang/*.php` z git historie na TS slovníky per nástroj (stejné klíče `<slug>.*` + `tool_common.*`) a zapojit je dávkově do 107 komponent. Doplnit de/es/uk/fr/sk do `TOOL_UI_I18N` a `HUB_I18N`. | P1 | L (mechanické, dávky agentů) |
| D2 | Hub: lokalizovat h1, návrhy hledání a aria-labely. Hledat i v lokalizovaných názvech a popisech (dnes jen cs pole + slug). | P1 | S |
| D3 | `src/app/sitemap.ts`: hub + všechny nástroje × 7 jazyků s hreflang. Smazat statický `public/sitemap.xml`. | P1 | S |
| D4 | Překlepy, statusy ffmpeg nástrojů („Dostupné“ po ověření), skrýt `ai-image-gen` z mřížky, dokud není hotový. | P1 | S |
| D5 | Sjednotit shell nástroje (vstup → nastavení → spustit → výsledek). Dnes si každá komponenta skládá layout sama. Vznikne `ToolShell` a sdílené `Dropzone/Progress/ResultArea` se přesunou z `audio-convert.tsx` do vlastního modulu. | P2 | L |

### 2.2 Funkční vylepšení

| # | Nápad | Prio | Náročnost |
|---|---|---|---|
| F1 | **Řetězení nástrojů** „Pokračovat v…“: výsledek jednoho nástroje se předá jako vstup dalšímu bez stahování (handoff v paměti). Fáze 1 zavede mechanismus pro konvertory, později se rozšíří na všechny souborové nástroje. | P1 | M |
| F2 | **Pustit soubor kamkoliv na hub** → rozpoznání formátu → otevře se správný nástroj. Fáze 1: audio/video/text, později obrázky/PDF. | P1 | S |
| F3 | Hromadné zpracování (fronta + ZIP) pro obrázky, PDF i média. | P2 | M |
| F4 | Presety videa: „WhatsApp 16 MB“, „Discord 10 MB“, „E-mail 25 MB“, „Instagram Reels 9:16“, „YouTube 1080p“. | P2 | S |
| F5 | Multi-thread ffmpeg (`@ffmpeg/core-mt`), když `crossOriginIsolated`. Odhad 2–4× rychlejší, jinak fallback na single-thread. | P2 | M |
| F6 | WebCodecs engine (Mediabunny, vendor jako ESM). Hardwarová akcelerace, řádově rychlejší pro MP4/WebM/MOV/MKV. ffmpeg zůstane jako fallback pro exotické formáty. | P2 | L |
| F7 | Vkládání ze schránky (Ctrl+V) u obrázků a textu. Pamatování posledního nastavení nástroje. | P2 | S |
| F8 | Měření (Vercel Analytics custom events): otevření nástroje, úspěch/chyba, hledání bez výsledku. Podle dat se prioritizují další nástroje. | P2 | S |
| F9 | Zpětná vazba přímo u nástroje (👍/👎 + text, route `tools/api/feedback.php` už existuje). | P2 | S |
| F10 | PWA: offline cache wasm, instalace, Web Share Target (sdílet soubor z mobilu rovnou do VeVit), File Handling API. | P3 | M |

### 2.3 UI/UX

| # | Nápad | Prio | Náročnost |
|---|---|---|---|
| U1 | **Tři konvertory hned nahoře na hubu** (Video / Audio / Text). Velká tlačítka, která jsou zároveň cíl pro přetažení. Ukazují počet rozpoznávaných formátů. | P1 | S (Fáze 1) |
| U2 | Filtry: místo 5 selectů jeden řádek chipů a rozbalovací „Další filtry“. Odstranit duplicitní select kategorií. | P2 | S |
| U3 | Stránka nástroje: „Související nástroje“, „Jak to funguje“ + FAQ (SEO), na mobilu sticky akční lišta. | P2 | M |
| U4 | Náhled výsledku před stažením: přehrávač audia/videa, u obrázků před/po s posuvníkem. Zobrazit úsporu „12,4 MB → 3,1 MB (−75 %)“. | P2 | M |
| U5 | Cmd+K paleta i na stránkách nástrojů (rychlý skok na jiný nástroj). | P3 | S |
| U6 | Lidské chybové hlášky. Technický log ffmpeg skrýt do „Technické detaily“. | P1 | S (Fáze 1 pro konvertory) |

### 2.4 Nové nástroje

Výběr podle poptávky v CZ a toho, co jde udělat čistě v prohlížeči.

| # | Nástroj | Jak | Prio | Náročnost |
|---|---|---|---|---|
| N1 | **Oprava kódování / „rozsypaný čaj“** (CP1250 ↔ UTF-8) | součást Text konvertoru | P1 | Fáze 1 |
| N2 | **Převod a posun titulků** (SRT/VTT/ASS/SBV/LRC/SUB) | součást Text konvertoru | P1 | Fáze 1 |
| N3 | QR platba (SPAYD) | logika už je v `invoice-gen` | P1 | S |
| N4 | HEIC → JPG/PNG (fotky z iPhonu) | libheif wasm | P1 | M |
| N5 | OCR obrázku/PDF (čeština) | tesseract.js + `ces` | P1 | M |
| N6 | Podpis PDF (nakreslit/vložit) | pdf-lib | P1 | M |
| N7 | Hromadná změna velikosti obrázků | canvas | P1 | S |
| N8 | Video úpravy: otočit, zrcadlit, oříznout, změnit rychlost, odstranit zvuk | ffmpeg presety | P2 | M |
| N9 | Vypálení titulků do videa | libass je v buildu | P2 | M |
| N10 | Audio: spojit, rychlost/tónina, vyzváněcí tón M4R | ffmpeg | P2 | S |
| N11 | Přepis řeči na text | Whisper přes WebGPU (transformers.js) | P2 | L |
| N12 | Obrázek → SVG (vektorizace) | potrace wasm | P2 | M |
| N13 | Rozmazání obličejů/SPZ | ONNX (runtime už je vendor) | P2 | M |
| N14 | CZ kalkulačky: OSVČ paušální daň, pracovní dny + svátky, kurzy ČNB (server route + cache), ARES lookup IČO | TS + server route | P2 | S–M |
| N15 | Dev: SQL formatter, JSON → TypeScript, subnet kalkulačka, chmod, User-Agent parser, XML formatter | TS | P2 | S každý |
| N16 | Tabulky XLSX/ODS ↔ CSV | SheetJS | P3 | M |
| N17 | Nahrávání obrazovky/kamery/mikrofonu | MediaRecorder; vyžaduje úpravu `Permissions-Policy` pro tu stránku | P3 | M |
| N18 | Slideshow z fotek → video | ffmpeg | P3 | M |

### 2.5 SEO a růst

| # | Nápad | Prio | Náročnost |
|---|---|---|---|
| S1 | **Programatické stránky převodů** generované z katalogu formátů (`/cs/tools/prevod/mov-na-mp4`), jen top ~40 párů s vlastním textem, aby nevznikl thin content. Každá stránka otevře konvertor s předvoleným cílem. | P2 | M |
| S2 | Strukturovaná data (SoftwareApplication, HowTo, FAQ) u nástrojů. | P2 | S |

---

## 3. Návrh: univerzální konvertory (Fáze 1)

### 3.1 Záměr

Uživatel chce převést soubor a nemá řešit, jestli je to „MOV z iPhonu“, „WMA ze starého disku“ nebo „titulky v CP1250“. Konvertor **pozná jakýkoliv soubor své kategorie**, i formát, který skoro nikdo nepoužívá. Řekne, co to je, a nabídne smysluplné cíle. Pokud formát v prohlížeči převést nejde, poctivě to řekne a poradí.

### 3.2 Cíle

- Na hubu jsou úplně nahoře (první obsah pod hlavičkou) **3 velká tlačítka: Video konvertor, Audio konvertor, Text konvertor**. Klik otevře konvertor, přetažení souboru na tlačítko otevře konvertor rovnou s tím souborem.
- Každý konvertor má **katalog všech známých formátů své kategorie**: přípony, MIME, název, popis cs+en, rodina formátů, schopnost (čtení / zápis / jen rozpoznání).
- Orientační počet záznamů v katalogu: audio ≥ 150, video ≥ 120, text ≥ 150. Patří sem i obskurní a historické formáty (RealAudio, VOC, 8SVX, tracker moduly, MIDI, Bink, Smacker, RoQ, MXF, WordPerfect, Lotus WordPro, AbiWord, FictionBook, MicroDVD…).
- **Rozpoznání podle obsahu** (magic bytes) má přednost před příponou. Nesoulad se zobrazí („Přípona .mp3, ale uvnitř je WAV“).
- Do konvertoru jde pustit jakýkoliv soubor. Když patří jinam (obrázek do video konvertoru), řekne to a nasměruje na správný nástroj.
- Encyklopedie formátů pod konvertorem: prohledávatelný seznam všech formátů kategorie s ikonami schopností. Je to viditelný důkaz, že konvertor „zná všechno“.
- Vše běží lokálně v prohlížeči, soubor neopouští zařízení.

### 3.3 Výstupní formáty

**Audio (23 cílů):** MP3, M4A (AAC), M4A (ALAC), M4R (vyzváněcí tón), M4B (audiokniha), AAC (ADTS), WAV, W64, AIFF, AU, CAF, VOC, FLAC, OGG (Vorbis), OPUS, WEBA, MKA, WMA, AC3, E-AC3, MP2, WavPack, TTA.

**Video (18 cílů + všechny audio cíle jako „Jen zvuk“):** MP4 (H.264), MP4 (H.265), M4V, MOV, MKV, WebM (VP9), WebM (VP8), AVI, WMV, FLV, 3GP, MPG, TS, M2TS, OGV, GIF, animovaný WebP, APNG.

**Text (podle rodiny vstupu):**

| Vstup | Cíle | Engine |
|---|---|---|
| prostý text, kód (~60 jazyků) | TXT (kódování/konce řádků), MD, HTML, PDF, DOCX | nativní TS (+ pandoc pro DOCX) |
| markup a dokumenty (MD, HTML, DOCX, ODT, RTF, EPUB, RST, LaTeX, Org, Textile, MediaWiki, DokuWiki, FB2, ipynb, DocBook, JATS, Typst…) | stejná množina, kterou umí writery pandocu, + PDF | pandoc.wasm |
| PDF | TXT, MD, HTML, DOCX | pdf.js (+ pandoc) |
| data | JSON, JSONL, YAML, CSV, TSV, INI, ENV | nativní TS (YAML přes vendor js-yaml) |
| titulky | SRT, VTT, ASS, SSA, SBV, LRC, SUB (MicroDVD) + posun časování + TXT | nativní TS |
| legacy binární (DOC, WPD, WPS, Pages, MOBI, AZW…), tabulky, prezentace, XML, TOML | jen rozpoznání + rada („otevřete v LibreOffice a uložte jako DOCX“) | — |

Každý textový výstup má volby: kódování výstupu (UTF-8, UTF-8 s BOM, UTF-16 LE/BE, Windows-1250, ISO-8859-2, Windows-1252, ISO-8859-15, Windows-1251, KOI8-U, IBM866), konce řádků (zachovat / LF / CRLF) a „opravit rozsypaný čaj“. Vstupní kódování se odhadne (BOM → UTF-8 → CP1250 vs ISO-8859-2) a jde ručně přepsat.

PDF výstup vzniká přes tisk prohlížeče („Uložit jako PDF“). Text v PDF tak zůstane vektorový a diakritika funguje bez vkládání fontů.

### 3.4 Chování konvertoru (audio/video)

1. **Vstup:** přetažení / výběr / předání z hubu (handoff). `accept` je bez omezení, o typu rozhoduje rozpoznání.
2. **Rozpoznání** (prvních 4 KiB + přípona + MIME). Karta „Rozpoznáno: Apple QuickTime (.mov) · podle obsahu“ s popisem formátu.
3. **Sonda:** `ffmpeg -i` → délka, kodeky, rozlišení. Když jsou kodeky kompatibilní s cílem, nabídne se **„Rychle bez překódování“** (stream copy, bez ztráty, sekundy místo minut).
4. **Cíl:** výběr s hledáním, skupiny Doporučené / Všechny / Jen zvuk.
5. **Volby:** kvalita (nízká / střední / vysoká / bezeztrátová, kde to dává smysl), max. výška videa (originál / 1080 / 720 / 480).
6. **Převod:** reálný průběh v % (čas z logu ÷ délka) + odhad zbývajícího času. Tlačítko **Zrušit** ukončí worker.
7. **Výsledek:** přehrávač, velikost „před → po“, stažení pod názvem `<původní název>.<ext>` a „Pokračovat v…“ (komprese, ořez, GIF…).
8. **Velké soubory:** vstup se připojí přes WORKERFS bez kopírování do paměti. Limit 2 GB, varování nad 500 MB. Bez WORKERFS (starý wrapper v cache) fallback na kopírování s limitem 300 MB.

### 3.5 Non-goals (Fáze 1)

Hromadné zpracování více souborů, presety sociálních sítí, multi-thread ffmpeg / WebCodecs, převod MIDI a tracker modulů (potřebují syntezátor; jen rozpoznání), DRM formáty (M4P, AAX; jen rozpoznání), programatické SEO stránky, plná lokalizace ostatních 104 nástrojů (Fáze 2).

### 3.6 Anti-cíle (selhání, i kdyby to technicky fungovalo)

- Konvertor tvrdí, že formát umí, a pak spadne. Schopnosti se proto **odvozují z reálného buildu ffmpeg.wasm** (vygenerovaný seznam muxerů/demuxerů/enkodérů), nepíšou se ručně.
- Záložka zamrzne nebo spadne na velkém souboru. Platí tvrdé limity a jasná hláška.
- Soubor se kamkoliv odesílá.
- Hub se zpomalí kvůli katalogu. Katalog se načítá až v konvertoru nebo při přetažení, hub zná jen počty.
- Titulky nebo text z CP1250 vyjdou s rozbitou diakritikou.

### 3.7 Omezení

Next 16 (před zásahem do routingu číst `node_modules/next/dist/docs/`), žádné nové npm závislosti (vendor do `public/tools/assets/js/lib/`), `public/tools/assets/**` se cachuje `immutable` na 1 rok (každá změna souboru = nový `?v=`), čisté moduly musí jít spustit přes `node --test` (relativní importy s `.ts`, `import type`, žádné enumy), CSP `wasm-unsafe-eval` je povolené globálně (report-only).

---

## 4. Roadmapa (každá fáze = vlastní plán)

| Fáze | Obsah | Odhad |
|---|---|---|
| **1** | Konvertory + katalog formátů + 3 tlačítka + handoff + drop na hub (tento návrh) | 2–3 týdny |
| 2 | Dluh: D1–D4 (lokalizace nástrojů z git historie, hledání, sitemap, statusy) | 1–2 týdny |
| 3 | UX: D5, U2–U5, F1 pro všechny nástroje, F4, F7–F9 | 2 týdny |
| 4 | Nové nástroje P1: N3–N7 | 2 týdny |
| 5 | Výkon médií: F5, F6, F3, PWA F10 | 2–3 týdny |
| 6 | SEO S1–S2 + nástroje P2/P3 | průběžně |

---

## 5. Otevřená rizika

- **pandoc.wasm** (balíček `wasm-pandoc` 1.0.1, pandoc 3.9) má ~56 MB nekomprimovaně. Plán obsahuje ověřovací gate (velikost po kompresi, limity hostingu, běh ve workeru). Když neprojde, dokumentové formáty zůstanou „jen rozpoznání“. Ostatní části Text konvertoru (titulky, data, kódování, prostý text, PDF → text) na pandocu nezávisí.
- WORKERFS ve ffmpeg.wasm 0.12 se ověří na reálném souboru 300 MB+. Když selže, zůstane limit 300 MB.
- Rychlost single-thread wasm u H.265/VP9 (minuty na minutu videa). Proto výchozí preset `veryfast`/`realtime` a nabídka stream copy.

## 6. Moje rozhodnutí (ke kontrole)

1. Slugy `video-convert` a `audio-convert` zůstávají (zachová SEO, oblíbené i nedávné), přejmenují se na „Video konvertor“ a „Audio konvertor“. Nový slug je `text-convert`.
2. Engine: ffmpeg.wasm (A/V), nativní TS + pandoc.wasm (text), pdf.js (PDF vstup), tisk prohlížeče (PDF výstup).
3. Popisy formátů v katalogu jsou cs + en. Ostatní jazyky padají na en. UI konvertorů má všech 7 jazyků.
4. Limity: 2 GB (WORKERFS) / 300 MB (kopie v paměti), varování nad 500 MB.
5. Status tří konvertorů je „Dostupné“ (ne „Omezeně“).
6. Barvy tlačítek: video `#ec4899`, audio `#8b5cf6`, text `#10b981`.
7. Hromadné zpracování není ve Fázi 1.
8. CSV čtení automaticky pozná oddělovač `;` (český Excel). Vnořené objekty se při zápisu do CSV zploští na `a.b`.
