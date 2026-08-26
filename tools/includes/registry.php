<?php
// Registr nástrojů — jeden zdroj pravdy pro PHP renderování (hub, karty, breadcrumb).
// Interaktivní logika nástrojů žije v assets/js/tools/<slug>.js.
//
// i18n: nástrojové name/desc a kategorie se překládají přes vv_t() ze slovníku
// tools/lang/<lang>.php (klíče tool.<slug>.name / .desc, category.<cat>.label/.desc,
// status.<status>, location.<loc>.label/.title). Viz tools/includes/i18n-bootstrap.php
// a tools/scripts/generate-lang.php. vv_t() zajistí fallback na cs.

const CATEGORY_COLORS = [
    'pdf'      => '#f59e0b', // oranžová
    'image'    => '#8b5cf6', // fialová
    'media'    => '#ec4899', // růžová
    'text'     => '#6b7280', // šedá
    'ai'       => '#0ea5e9', // modrá
    'dev'      => '#06b6d4', // tyrkysová
    'security' => '#10b981', // zelená
    'calc'     => '#ef4444', // červená
];

const CATEGORY_LABELS = [
    'pdf'      => 'PDF',
    'image'    => 'Obrázky',
    'media'    => 'Média',
    'text'     => 'Text',
    'ai'       => 'AI',
    'dev'      => 'Dev',
    'security' => 'Bezpečnost',
    'calc'     => 'Kalkulačky',
];

// Zobrazené pořadí kategorií napříč webem.
const CATEGORY_ORDER = ['pdf', 'image', 'media', 'text', 'ai', 'dev', 'security', 'calc'];

// category => popis sekce
const CATEGORY_DESCRIPTIONS = [
    'pdf'      => 'Slučování, dělení, komprese a převody PDF dokumentů.',
    'image'    => 'Komprese, úpravy a vylepšení obrázků.',
    'media'    => 'Práce s videem a zvukem — konverze, komprese, střih.',
    'text'     => 'Překlad, shrnutí, Markdown a vizualizace myšlenek.',
    'ai'       => 'Asistent, generování obsahu i obrázků pomocí AI.',
    'dev'      => 'Regex, JSON, UUID, JWT a další pomůcky pro vývoj.',
    'security' => 'Hashe, hesla, šifrování a kontrola certifikátů.',
    'calc'     => 'Procenta, půjčky, převody jednotek a barev.',
];

// Pole nástrojů. loc = processingLocation (client|server|ai).
const TOOLS = [
    ['slug' => 'pdf-merge',  'name' => 'Sloučení PDF',        'desc' => 'Sloučí více PDF souborů do jednoho.',                'cat' => 'pdf',      'loc' => 'client', 'icon' => 'Files',     'new' => false],
    ['slug' => 'pdf-split',  'name' => 'Rozdělení PDF',       'desc' => 'Rozdělí PDF na jednotlivé stránky.',                'cat' => 'pdf',      'loc' => 'client', 'icon' => 'Scissors',  'new' => false],
    ['slug' => 'pdf-compress','name'=> 'Komprese PDF',        'desc' => 'Zmenší velikost PDF souboru.',                      'cat' => 'pdf',      'loc' => 'client', 'icon' => 'Shrink',    'new' => false],
    ['slug' => 'pdf-to-word', 'name' => 'PDF → Word',         'desc' => 'Vytáhne text z PDF a sestaví .docx.',               'cat' => 'pdf',      'loc' => 'client', 'icon' => 'FileText',  'new' => false],
    ['slug' => 'html-to-pdf', 'name' => 'HTML → PDF',         'desc' => 'Převede HTML kód na PDF (html2canvas+jsPDF).',     'cat' => 'pdf',      'loc' => 'client', 'icon' => 'FileCode',  'new' => false],
    ['slug' => 'invoice-gen', 'name' => 'Faktura generátor',   'desc' => 'Generujte profesionální faktury s QR kódem.',        'cat' => 'pdf',      'loc' => 'client', 'icon' => 'Receipt',   'new' => true],
    ['slug' => 'pdf-to-images','name'=> 'PDF → obrázky',        'desc' => 'Převede stránky PDF na obrázky (PNG/JPEG ZIP).',    'cat' => 'pdf',      'loc' => 'client', 'icon' => 'ImagePlus', 'new' => true],
    ['slug' => 'images-to-pdf','name'=> 'Obrázky → PDF',        'desc' => 'Spojí více obrázků do jednoho PDF.',                'cat' => 'pdf',      'loc' => 'client', 'icon' => 'Files',     'new' => true],
    ['slug' => 'pdf-rotate',   'name' => 'Otočení PDF',         'desc' => 'Otočí nebo překlopí stránky PDF.',                  'cat' => 'pdf',      'loc' => 'client', 'icon' => 'RotateCw',  'new' => true],
    ['slug' => 'pdf-organize', 'name' => 'Organizace PDF',      'desc' => 'Odstraňte nebo přerovnejte stránky PDF.',           'cat' => 'pdf',      'loc' => 'client', 'icon' => 'Maximize',  'new' => true],
    ['slug' => 'pdf-watermark','name'=> 'Vodoznak PDF',        'desc' => 'Přidá textový vodoznak do PDF.',                    'cat' => 'pdf',      'loc' => 'client', 'icon' => 'Stamp',     'new' => true],
    ['slug' => 'pdf-page-numbers','name'=>'Číslování stránek',  'desc' => 'Přidá čísla stránek do PDF.',                       'cat' => 'pdf',      'loc' => 'client', 'icon' => 'Hash',      'new' => true],
    ['slug' => 'pdf-extract-text','name'=>'Extrakce textu PDF','desc' => 'Vytáhne text z PDF (pdf.js).',                       'cat' => 'pdf',      'loc' => 'client', 'icon' => 'AlignLeft', 'new' => true],
    ['slug' => 'pdf-password', 'name' => 'Ochrana PDF heslem', 'desc' => 'Nastaví nebo odstraní heslo PDF (qpdf).',            'cat' => 'pdf',      'loc' => 'server', 'icon' => 'FileKey',   'new' => false, 'note' => 'Tento nástroj vyžaduje VPS / shell_exec (nástroj qpdf). Na sdíleném hostingu jej provozovat nelze.'],

    ['slug' => 'img-compress',  'name' => 'Komprese obrázku',  'desc' => 'Zmenšete obrázek přes canvas (kvalita, JPEG/WebP).','cat' => 'image',    'loc' => 'client', 'icon' => 'Image',     'new' => false],
    ['slug' => 'bg-remover',    'name' => 'Odstranit pozadí',  'desc' => 'AI odstranění pozadí z fotografií (ONNX MODNet).',  'cat' => 'image',    'loc' => 'ai',      'icon' => 'Eraser',    'new' => true],
    ['slug' => 'img-upscaler',  'name' => 'Zvětšení kvality',  'desc' => 'Zvětší rozlišení obrázku (2×/3×/4×) přes canvas.',   'cat' => 'image',    'loc' => 'client', 'icon' => 'Maximize',  'new' => true],
    ['slug' => 'gif-maker',     'name' => 'Tvůrce GIFu',       'desc' => 'Vytvořte animovaný GIF ze sekvence obrázků.',         'cat' => 'image',    'loc' => 'client', 'icon' => 'Film',      'new' => true],
    ['slug' => 'screenshot-tool','name'=> 'Screenshot URL',    'desc' => 'Pořiďte screenshot libovolné webové stránky.',      'cat' => 'image',    'loc' => 'server', 'icon' => 'Camera',    'new' => true, 'note' => 'Tento nástroj vyžaduje VPS / shell_exec (headless Chromium). Na sdíleném hostingu jej provozovat nelze.'],
    // ── Dávka 5 — obrázky přes canvas ─────────────────────────────
    ['slug' => 'image-convert',     'name' => 'Převod formátu',   'desc' => 'Převeďte PNG/JPG/WebP/BMP přes canvas.',           'cat' => 'image', 'loc' => 'client', 'icon' => 'Repeat',           'new' => true],
    ['slug' => 'image-crop',        'name' => 'Oříznutí obrázku', 'desc' => 'Interaktivně ořízněte obrázek v canvasu.',         'cat' => 'image', 'loc' => 'client', 'icon' => 'Crop',             'new' => true],
    ['slug' => 'image-rotate-flip', 'name' => 'Otočení/Překlopení','desc'=> 'Otočte nebo překlopte obrázek (90/180/270/flip).',  'cat' => 'image', 'loc' => 'client', 'icon' => 'RotateCw',         'new' => true],
    ['slug' => 'image-filters',     'name' => 'Filtry obrázku',   'desc' => 'Grayscale, sepia, jas, kontrast, saturace.',        'cat' => 'image', 'loc' => 'client', 'icon' => 'SlidersHorizontal','new' => true],
    // ── Dávka 6 — další obrázky + komprese/zvětšení ───────────────
    ['slug' => 'image-watermark',   'name' => 'Vodoznak',          'desc' => 'Přidejte textový nebo obrázkový vodoznak.',         'cat' => 'image', 'loc' => 'client', 'icon' => 'Stamp',            'new' => true],
    ['slug' => 'image-exif',        'name' => 'EXIF metadata',     'desc' => 'Prohlížejte a odstraňujte EXIF (vč. GPS).',         'cat' => 'image', 'loc' => 'client', 'icon' => 'ScanLine',        'new' => true],
    ['slug' => 'image-collage',     'name' => 'Koláž obrázků',     'desc' => 'Spojte více obrázků do koláže (různá rozvržení).',   'cat' => 'image', 'loc' => 'client', 'icon' => 'Images',           'new' => true],
    ['slug' => 'favicon-generator', 'name' => 'Favicon generátor',  'desc' => 'Vygeneruje favicony (PNG více velikostí + ICO).',   'cat' => 'image', 'loc' => 'client', 'icon' => 'Globe',            'new' => true],
    ['slug' => 'meme-generator',    'name' => 'Meme generátor',     'desc' => 'Vytvořte meme s horním/dolním textem (Impact).',    'cat' => 'image', 'loc' => 'client', 'icon' => 'Laugh',            'new' => true],

    ['slug' => 'video-convert', 'name' => 'Konverze videa',    'desc' => 'Převeďte video mezi formáty MP4, WebM (ffmpeg.wasm).','cat' => 'media',    'loc' => 'client', 'icon' => 'Video',     'new' => false],
    ['slug' => 'video-compress', 'name' => 'Komprese videa',   'desc' => 'Zmenší velikost videa (ffmpeg.wasm, nastavitelná kvalita).','cat' => 'media','loc' => 'client', 'icon' => 'Shrink',    'new' => false],
    ['slug' => 'video-trim',     'name' => 'Ořez videa',       'desc' => 'Vyberte část videa a odstraňte zbytek (ffmpeg.wasm).','cat' => 'media',   'loc' => 'client', 'icon' => 'Scissors',  'new' => false],
    ['slug' => 'audio-convert',  'name' => 'Konverze audia',   'desc' => 'Převeďte audio mezi MP3/WAV/OGG/FLAC (ffmpeg.wasm).','cat' => 'media',    'loc' => 'client', 'icon' => 'Music',     'new' => false],
    ['slug' => 'video-thumbnail','name' => 'Náhled videa',    'desc' => 'Vygeneruje náhled/snímek z videa (bez ffmpeg).',    'cat' => 'media',    'loc' => 'client', 'icon' => 'Camera',   'new' => true],
    ['slug' => 'audio-waveform', 'name' => 'Křivka audia',    'desc' => 'Vykreslí křivku hlasitosti audia (Web Audio API).',  'cat' => 'media',    'loc' => 'client', 'icon' => 'Volume2',  'new' => true],
    ['slug' => 'video-extract-audio','name'=>'Extrakce audia', 'desc' => 'Vytáhne zvukovou stopu z videa (ffmpeg.wasm).',     'cat' => 'media',    'loc' => 'client', 'icon' => 'Music',     'new' => true],
    ['slug' => 'video-to-gif',   'name' => 'Video → GIF',     'desc' => 'Vytvoří animovaný GIF z videa (ffmpeg.wasm).',      'cat' => 'media',    'loc' => 'client', 'icon' => 'Film',      'new' => true],
    ['slug' => 'video-merge',    'name' => 'Spojení videí',   'desc' => 'Spojí více videí (stejný kodek/rozlišení, ffmpeg.wasm).','cat' => 'media','loc' => 'client', 'icon' => 'Plus',      'new' => true],
    ['slug' => 'video-target-size','name'=>'Cílová velikost', 'desc' => 'Dopočítá bitrate pro cílovou velikost videa.',       'cat' => 'media',    'loc' => 'client', 'icon' => 'Scale',     'new' => true],
    ['slug' => 'audio-trim-normalize','name'=>'Ořez+normalizace audia','desc'=>'Ořízne a normalizuje hlasitost audia.','cat'=> 'media','loc' => 'client', 'icon' => 'SlidersHorizontal','new'=> true],

    ['slug' => 'translate',      'name' => 'Překlad textu',    'desc' => 'Přeložte text mezi jazyky pomocí AI.',              'cat' => 'text',     'loc' => 'ai',     'icon' => 'Languages', 'new' => true],
    ['slug' => 'summarize-text', 'name' => 'Shrnutí textu',    'desc' => 'Vytvořte stručné shrnutí dlouhého textu.',          'cat' => 'text',     'loc' => 'ai',     'icon' => 'AlignLeft',  'new' => true],
    ['slug' => 'markdown-editor','name' => 'Markdown editor', 'desc' => 'Editujte a náhledněte Markdown v reálném čase.',    'cat' => 'text',     'loc' => 'client', 'icon' => 'FileCode',   'new' => false],
    ['slug' => 'mind-map',       'name' => 'Myšlenková mapa', 'desc' => 'Vizualizujte strukturu myšlenek jako radiální strom.','cat' => 'text',   'loc' => 'client', 'icon' => 'GitBranch',  'new' => true],
    // ── Dávka 4 — další textové nástroje ──────────────────────────
    ['slug' => 'text-counter',       'name' => 'Počítadlo textu',   'desc' => 'Spočítejte znaky, slova, věty a odhad doby čtení.', 'cat' => 'text', 'loc' => 'client', 'icon' => 'Type',          'new' => true],
    ['slug' => 'text-case-converter', 'name' => 'Velikost písmen',   'desc' => 'Převod UPPER/lower/Title/camelCase/snake_case.',      'cat' => 'text', 'loc' => 'client', 'icon' => 'CaseSensitive',  'new' => true],
    ['slug' => 'lorem-ipsum',        'name' => 'Lorem ipsum',        'desc' => 'Generujte zástupný text (věty/odstavce/slova).',     'cat' => 'text', 'loc' => 'client', 'icon' => 'Pilcrow',        'new' => true],
    ['slug' => 'remove-diacritics',  'name' => 'Odstranění diakritiky','desc' => 'Převeďte text bez diakritiky (ASCII fold).',        'cat' => 'text', 'loc' => 'client', 'icon' => 'SpellCheck',     'new' => true],
    ['slug' => 'text-to-speech',     'name' => 'Text na řeč (TTS)',  'desc' => 'Přečtěte text nahlas přes Web Speech API.',          'cat' => 'text', 'loc' => 'client', 'icon' => 'Volume2',       'new' => true],
    ['slug' => 'text-lines-tool',    'name' => 'Práce s řádky',       'desc' => 'Duplicity, řazení, prázdné řádky, unique.',         'cat' => 'text', 'loc' => 'client', 'icon' => 'Rows3',         'new' => true],

    ['slug' => 'ai-chat',     'name' => 'AI asistent',        'desc' => 'Chatujte s AI asistentem pro různé úkoly.',         'cat' => 'ai',  'loc' => 'ai',     'icon' => 'MessageSquare', 'new' => false],
    ['slug' => 'ai-vision',   'name' => 'AI analýza obrázku',  'desc' => 'Popište a analyzujte obsah obrázku pomocí AI.',     'cat' => 'ai',  'loc' => 'ai',     'icon' => 'Eye',           'new' => false],
    ['slug' => 'ai-seo',     'name' => 'SEO meta generátor',   'desc' => 'Generujte SEO titulky a popisky automaticky.',      'cat' => 'ai',  'loc' => 'ai',     'icon' => 'Search',       'new' => true],
    ['slug' => 'ai-image-gen','name'=> 'AI generátor obrázku','desc' => 'Vytvořte unikátní obrázky z textového popisu.',       'cat' => 'ai',  'loc' => 'ai',     'icon' => 'ImagePlus',    'new' => true, 'note' => 'Generování obrázků vyžaduje další infrastrukturu (Stable Diffusion / ComfyUI), kterou Ollama neposkytuje. Nástroj je v přípravě.'],
    ['slug' => 'ai-sql-gen',  'name' => 'AI generátor SQL',    'desc' => 'Převeďte přirozený jazyk na SQL dotazy.',           'cat' => 'ai',  'loc' => 'ai',     'icon' => 'Database',     'new' => true],
    ['slug' => 'grammar-check', 'name' => 'AI kontrola pravopisu','desc'=> 'Opravte pravopis a gramatiku českého textu.',       'cat' => 'text', 'loc' => 'ai',    'icon' => 'SpellCheck',   'new' => true],
    ['slug' => 'ai-email-writer','name'=> 'AI psaní e-mailu',  'desc' => 'Vytvořte e-mail podle zadání a zvoleného tónu.',    'cat' => 'text', 'loc' => 'ai',    'icon' => 'Mail',        'new' => true],
    ['slug' => 'ai-text-qa',   'name' => 'AI otázky nad textem','desc'=> 'Ptejte se na cokoliv k dodanému textu (kontext).',   'cat' => 'ai',  'loc' => 'ai',     'icon' => 'HelpCircle',   'new' => true],
    ['slug' => 'ai-commit-message','name'=> 'AI commit zpráva','desc' => 'Vygeneruje commit zprávu z diffu (conventional commits).','cat'=>'dev','loc'=>'ai', 'icon' => 'GitCommit',   'new' => true],
    ['slug' => 'ai-regex-generator','name'=> 'AI regex generátor','desc'=> 'Popište pattern, dostanete regulární výraz.',       'cat' => 'dev', 'loc' => 'ai',    'icon' => 'Regex',       'new' => true],
    ['slug' => 'ai-code-explainer','name'=> 'AI vysvětlení kódu','desc'=> 'Vysvětlí, co dělá kód, srozumitelně a v češtině.',    'cat' => 'dev', 'loc' => 'ai',    'icon' => 'FileCode',    'new' => true],

    ['slug' => 'regex-tester',   'name' => 'Regex tester',    'desc' => 'Testujte regulární výrazy v reálném čase.',          'cat' => 'dev',  'loc' => 'client', 'icon' => 'Regex',      'new' => false],
    ['slug' => 'json-formatter', 'name' => 'JSON formátovač', 'desc' => 'Formátujte a validujte JSON strukturu.',              'cat' => 'dev',  'loc' => 'client', 'icon' => 'Braces',     'new' => false],
    ['slug' => 'gradient-gen',   'name' => 'CSS Gradient Editor','desc'=> 'Vytvářejte a upravujte CSS gradienty interaktivně.', 'cat' => 'dev','loc' => 'client', 'icon' => 'Palette',    'new' => true],
    ['slug' => 'uuid-gen',       'name' => 'UUID generátor',  'desc' => 'Generujte náhodné UUID v4 a v7.',                    'cat' => 'dev',  'loc' => 'client', 'icon' => 'Fingerprint','new' => true],
    ['slug' => 'jwt-decoder',    'name' => 'JWT dekodér',     'desc' => 'Dekódujte a ověřte JWT tokeny.',                     'cat' => 'dev',  'loc' => 'client', 'icon' => 'KeyRound',   'new' => true],

    // ── Dávka 2 — další Dev nástroje ─────────────────────────────
    ['slug' => 'base64-tool',          'name' => 'Base64 kodér/dekodér', 'desc' => 'Kódujte a dekódujte Base64 (text i soubory).',  'cat' => 'dev', 'loc' => 'client', 'icon' => 'Code',            'new' => true],
    ['slug' => 'url-encoder',          'name' => 'URL kodér/dekodér',    'desc' => 'Kódujte a dekódujte URL (percent encoding).',   'cat' => 'dev', 'loc' => 'client', 'icon' => 'Link2',           'new' => true],
    ['slug' => 'jwt-generator',        'name' => 'JWT generátor',        'desc' => 'Vytvořte a podepište JWT token (HMAC).',         'cat' => 'dev', 'loc' => 'client', 'icon' => 'FileKey',         'new' => true],
    ['slug' => 'yaml-json-converter',  'name' => 'YAML ↔ JSON',         'desc' => 'Převádějte mezi YAML a JSON obousměrně.',      'cat' => 'dev', 'loc' => 'client', 'icon' => 'FileCode',        'new' => true],
    ['slug' => 'csv-json-converter',   'name' => 'CSV ↔ JSON',          'desc' => 'Převádějte mezi CSV a JSON obousměrně.',        'cat' => 'dev', 'loc' => 'client', 'icon' => 'FileSpreadsheet',  'new' => true],
    ['slug' => 'cron-builder',         'name' => 'Cron výraz builder',  'desc' => 'Sestavte a vysvětlete cron výraz obousměrně.', 'cat' => 'dev', 'loc' => 'client', 'icon' => 'CalendarClock',  'new' => true],
    ['slug' => 'timestamp-converter',  'name' => 'Unix timestamp',      'desc' => 'Převod mezi Unix timestampem a datem (i pásma).', 'cat' => 'dev', 'loc' => 'client', 'icon' => 'Timer',        'new' => true],

    // ── Dávka 3 — další Dev nástroje ─────────────────────────────
    ['slug' => 'code-diff',            'name' => 'Code diff',            'desc' => 'Porovnejte dva texty/kód a zobrazte změny.',       'cat' => 'dev', 'loc' => 'client', 'icon' => 'GitCompare',     'new' => true],
    ['slug' => 'css-js-html-formatter', 'name' => 'CSS/JS/HTML formátovač','desc' => 'Naformátujte nebo zminifikujte CSS, JS a HTML.', 'cat' => 'dev', 'loc' => 'client', 'icon' => 'SquareCode',     'new' => true],
    ['slug' => 'contrast-checker',     'name' => 'Kontrast (WCAG)',      'desc' => 'Ověřte kontrast barev dle WCAG AA/AAA.',          'cat' => 'dev', 'loc' => 'client', 'icon' => 'Contrast',       'new' => true],
    ['slug' => 'qr-generator',         'name' => 'QR generátor',         'desc' => 'Vytvořte QR kód (text, URL, Wi-Fi, vCard).',      'cat' => 'dev', 'loc' => 'client', 'icon' => 'QrCode',        'new' => true],
    ['slug' => 'og-meta-generator',    'name' => 'OG meta generátor',    'desc' => 'Vygenerujte Open Graph meta tagy s náhledem.',   'cat' => 'dev', 'loc' => 'client', 'icon' => 'Share2',        'new' => true],
    ['slug' => 'gitignore-generator',  'name' => '.gitignore generátor', 'desc' => 'Sestavte .gitignore podle jazyka/nástroje.',     'cat' => 'dev', 'loc' => 'client', 'icon' => 'FileX',         'new' => true],
    ['slug' => 'fake-data-generator',  'name' => 'Fake data generátor',  'desc' => 'Generujte testovací data a exportujte CSV/JSON.', 'cat' => 'dev', 'loc' => 'client', 'icon' => 'Database',      'new' => true],
    ['slug' => 'color-palette-generator','name' => 'Paleta barev',        'desc' => 'Vytvořte paletu (komplementární, analogická…).',  'cat' => 'dev', 'loc' => 'client', 'icon' => 'SwatchBook',    'new' => true],

    ['slug' => 'hash-gen',        'name' => 'Hash generátor',  'desc' => 'Generujte MD5, SHA-256, SHA-512 hashe.',            'cat' => 'security', 'loc' => 'client', 'icon' => 'Hash',      'new' => false],
    ['slug' => 'password-gen',    'name' => 'Generátor hesel', 'desc' => 'Vytvářejte bezpečná hesla na míru.',                 'cat' => 'security', 'loc' => 'client', 'icon' => 'Lock',      'new' => false],
    ['slug' => 'encrypt-decrypt', 'name' => 'Šifrování textu','desc' => 'Zašifrujte a dešifrujte text pomocí AES-256-GCM.',   'cat' => 'security', 'loc' => 'client', 'icon' => 'Shield',    'new' => false],
    ['slug' => 'steganography',   'name' => 'Steganografie',  'desc' => 'Skryjte text v obrázku pomocí LSB encoding.',        'cat' => 'security', 'loc' => 'client', 'icon' => 'EyeOff',    'new' => true],
    ['slug' => 'certificate-info', 'name'=> 'SSL certifikát info','desc'=>'Zkontrolujte platnost a detaily SSL certifikátu.','cat' => 'security', 'loc' => 'server', 'icon' => 'GlobeLock', 'new' => true],
    ['slug' => 'password-strength', 'name'=> 'Síla hesla',       'desc' => 'Odhadněte entropii a dobu prolomení hesla.',          'cat' => 'security', 'loc' => 'client', 'icon' => 'ShieldCheck','new' => true],
    ['slug' => 'totp-generator',   'name' => 'TOTP generátor',   'desc' => 'Vygenerujte 2FA TOTP kódy (RFC 6238) z tajemství.',   'cat' => 'security', 'loc' => 'client', 'icon' => 'Timer',      'new' => true],
    ['slug' => 'password-breach-check','name'=>'Kontrola úniku hesla','desc'=>'Ověří, jestli heslo uniklo (HIBP k-anonymity).',   'cat' => 'security', 'loc' => 'client', 'icon' => 'Fingerprint','new' => true],
    ['slug' => 'file-encryption',   'name' => 'Šifrování souborů','desc' => 'Zašifruje/dešifruje soubor AES-256-GCM (Web Crypto).','cat' => 'security', 'loc' => 'client', 'icon' => 'FileKey',    'new' => true],
    ['slug' => 'token-generator',  'name' => 'Token generátor', 'desc' => 'Generuje náhodné tokeny (délka, znaková sada).',       'cat' => 'security', 'loc' => 'client', 'icon' => 'Zap',        'new' => true],

    ['slug' => 'percentage-calc',     'name' => 'Kalkulačka procent', 'desc' => 'Rychle spočítejte procenta, zvýšení a snížení.', 'cat' => 'calc', 'loc' => 'client', 'icon' => 'Percent',    'new' => false],
    ['slug' => 'loan-calc',           'name' => 'Kalkulačka půjčky',  'desc' => 'Vypočítejte splátky a amortizační tabulku.',       'cat' => 'calc', 'loc' => 'client', 'icon' => 'Calculator','new' => false],
    ['slug' => 'unit-converter',      'name' => 'Převodník jednotek','desc' => 'Převádějte délku, hmotnost, teplotu, objem a další.','cat' => 'calc','loc' => 'client', 'icon' => 'Ruler',     'new' => false],
    ['slug' => 'color-converter',     'name' => 'Převodník barev',   'desc' => 'Převádějte mezi HEX, RGB, HSL a CMYK.',            'cat' => 'calc', 'loc' => 'client', 'icon' => 'Palette',    'new' => false],
    ['slug' => 'number-base-converter','name'=> 'Soustava čísel',   'desc' => 'Převádějte mezi decimální, binární, oktálovou a hexadecimální soustavou.', 'cat' => 'calc', 'loc' => 'client', 'icon' => 'Binary', 'new' => true],

    // ── Dávka 1 — další kalkulačky ────────────────────────────────
    ['slug' => 'bmi-calc',                'name' => 'BMI kalkulačka',       'desc' => 'Vypočítejte index tělesné hmotnosti a kategorii.', 'cat' => 'calc', 'loc' => 'client', 'icon' => 'Scale',          'new' => true],
    ['slug' => 'discount-calc',           'name' => 'Kalkulačka slev',      'desc' => 'Spočítejte cenu po slevě, i vícenásobné slevy.',    'cat' => 'calc', 'loc' => 'client', 'icon' => 'Tag',            'new' => true],
    ['slug' => 'vat-calc',                'name' => 'DPH kalkulačka',       'desc' => 'Převeďte částku mezi bez DPH a s DPH (CZ sazby).',  'cat' => 'calc', 'loc' => 'client', 'icon' => 'Landmark',       'new' => true],
    ['slug' => 'net-salary-calc',          'name' => 'Kalkulačka čisté mzdy','desc' => 'Odhad čisté mzdy ze hrubé (CZ sazby).',           'cat' => 'calc', 'loc' => 'client', 'icon' => 'Wallet',         'new' => true],
    ['slug' => 'date-diff-calc',           'name' => 'Rozdíl datumů',        'desc' => 'Vypočítejte rozdíl mezi dvěma daty v dnech.',       'cat' => 'calc', 'loc' => 'client', 'icon' => 'CalendarDays',   'new' => true],
    ['slug' => 'compound-interest-calc',   'name' => 'Složené úročení',     'desc' => 'Spočítejte výnos složeného úročení.',               'cat' => 'calc', 'loc' => 'client', 'icon' => 'TrendingUp',     'new' => true],
    ['slug' => 'grade-average-calc',       'name' => 'Průměr známek',       'desc' => 'Vypočítejte vážený průměr známek.',                 'cat' => 'calc', 'loc' => 'client', 'icon' => 'GraduationCap',  'new' => true],
    ['slug' => 'fuel-consumption-calc',    'name' => 'Spotřeba paliva',    'desc' => 'Převod mezi l/100 km a mpg.',                       'cat' => 'calc', 'loc' => 'client', 'icon' => 'Fuel',          'new' => true],
    ['slug' => 'bmr-calc',                 'name' => 'BMR a kalorie',        'desc' => 'Bazální metabolismus a denní příjem kalorií.',       'cat' => 'calc', 'loc' => 'client', 'icon' => 'Flame',         'new' => true],
    ['slug' => 'time-calc',                'name' => 'Časová kalkulačka',   'desc' => 'Sčítání a odčítání časových údajů.',               'cat' => 'calc', 'loc' => 'client', 'icon' => 'Clock',         'new' => true],
    ['slug' => 'iban-converter',           'name' => 'Převodník IBAN',      'desc' => 'Převede české číslo účtu na IBAN a zpět.',         'cat' => 'calc', 'loc' => 'client', 'icon' => 'Banknote',      'new' => true],
    ['slug' => 'birth-number-validator',    'name' => 'Validátor rodného čísla','desc' => 'Ověří formát a kontrolní součet rodného čísla.',  'cat' => 'calc', 'loc' => 'client', 'icon' => 'BadgeCheck',    'new' => true],
];

// Canonical metadata policy.  TOOLS stays deliberately compact for human
// maintenance; all consumers use all_tools(), which fills the documented
// schema in one place before rendering or exporting it.
const TOOL_STATUSES = ['working', 'limited', 'experimental', 'coming_soon', 'unavailable_on_wedos', 'broken'];
const TOOL_AVAILABILITY = ['available', 'requires_external_service', 'requires_browser_support', 'not_implemented', 'unavailable_on_wedos'];
const TOOL_TEST_TARGETS = ['structural', 'browser_smoke', 'happy_path'];

function tool_policy_overrides(string $slug): array {
    $ffmpegTools = ['audio-convert', 'audio-trim-normalize', 'video-convert', 'video-compress', 'video-trim', 'video-extract-audio', 'video-to-gif', 'video-merge', 'video-target-size'];
    if (in_array($slug, $ffmpegTools, true)) {
        return [
            'status' => 'limited', 'availability' => 'requires_browser_support',
            'requirements' => ['browser_features' => ['WebAssembly'], 'local_assets' => ['/tools/assets/js/lib/ffmpeg/index.js', '/tools/assets/js/lib/ffmpeg/ffmpeg-core.js', '/tools/assets/js/lib/ffmpeg/ffmpeg-core.wasm'], 'php_extensions' => [], 'external_services' => [], 'hosting_constraints' => ["scoped 'wasm-unsafe-eval' v CSP jen pro těchto 9 stránek (tools/.htaccess)"], 'verified' => true],
            'privacy_note' => 'Zpracování probíhá lokálně v prohlížeči; soubor se nikam neodesílá.',
        ];
    }
    $overrides = [
        'pdf-password' => [
            'status' => 'unavailable_on_wedos', 'availability' => 'unavailable_on_wedos',
            'requirements' => ['browser_features' => [], 'local_assets' => [], 'php_extensions' => [], 'external_services' => [], 'hosting_constraints' => ['qpdf and shell_exec; unavailable on shared WEDOS'], 'verified' => true],
            'privacy_note' => 'Nástroj je na sdíleném WEDOS deaktivovaný; soubor se nikam neodesílá.',
        ],
        'screenshot-tool' => [
            'status' => 'unavailable_on_wedos', 'availability' => 'unavailable_on_wedos',
            'requirements' => ['browser_features' => [], 'local_assets' => [], 'php_extensions' => [], 'external_services' => [], 'hosting_constraints' => ['headless Chromium and controlled network isolation; unavailable on shared WEDOS'], 'verified' => true],
            'privacy_note' => 'Nástroj je na sdíleném WEDOS deaktivovaný; URL se nekontroluje.',
        ],
        'ai-image-gen' => [
            'status' => 'coming_soon', 'availability' => 'not_implemented',
            'requirements' => ['browser_features' => [], 'local_assets' => [], 'php_extensions' => [], 'external_services' => ['image-generation provider (not configured)'], 'hosting_constraints' => ['requires external provider or separate infrastructure'], 'verified' => true],
            'privacy_note' => 'Nástroj zatím nevykonává žádné zpracování ani neodesílá zadání.',
        ],
        'certificate-info' => [
            'requirements' => ['browser_features' => [], 'local_assets' => [], 'php_extensions' => ['openssl'], 'external_services' => ['public DNS and TLS endpoint'], 'hosting_constraints' => ['outbound TCP/443 required'], 'verified' => true],
            'privacy_note' => 'Na server se posílá pouze doménové jméno pro jednorázové TLS ověření.',
        ],
    ];
    return $overrides[$slug] ?? [];
}

function canonical_tool(array $tool): array {
    $slugWords = preg_split('/-+/', $tool['slug']) ?: [];
    $base = [
        'slug' => $tool['slug'],
        'name' => $tool['name'],
        'description' => $tool['desc'],
        'category' => $tool['cat'],
        'processing_location' => $tool['loc'] === 'server' ? 'vevit_server' : ($tool['loc'] === 'ai' ? 'external_ai' : 'client'),
        'icon' => $tool['icon'],
        'new' => (bool)$tool['new'],
        'keywords' => array_values(array_unique(array_filter(array_merge($slugWords, [$tool['slug']])))),
        'aliases' => [],
        'status' => $tool['loc'] === 'ai' ? 'limited' : 'working',
        'availability' => $tool['loc'] === 'ai' ? 'requires_external_service' : 'available',
        // Requirements are only marked verified when they were established from
        // the implementation, endpoint or existing project documentation.
        'requirements' => ['browser_features' => [], 'local_assets' => [], 'php_extensions' => [], 'external_services' => [], 'hosting_constraints' => [], 'verified' => false],
        'privacy_note' => $tool['loc'] === 'client' ? 'Zpracování probíhá lokálně v prohlížeči.' : 'Před použitím ověřte podmínky zpracování uvedené u nástroje.',
        'declared_test_target' => 'structural',
        // Compatibility for current PHP templates; do not export these aliases.
        'desc' => $tool['desc'], 'cat' => $tool['cat'], 'loc' => $tool['loc'],
    ];
    $canonical = array_replace_recursive($base, tool_policy_overrides($tool['slug']), $tool);
    return $canonical;
}

function all_tools(): array {
    static $tools = null;
    if ($tools === null) $tools = array_map('canonical_tool', TOOLS);
    return $tools;
}

function public_tool_metadata(array $tool): array {
    $public = $tool;
    unset($public['desc'], $public['cat'], $public['loc'], $public['note']);
    return $public;
}

// Pomocné funkce ────────────────────────────────────────────────

function get_tool(string $slug): ?array {
    foreach (all_tools() as $t) if ($t['slug'] === $slug) return $t;
    return null;
}

function tools_by_category(): array {
    $map = [];
    foreach (CATEGORY_ORDER as $c) $map[$c] = [];
    foreach (all_tools() as $t) $map[$t['cat']][] = $t;
    return $map;
}

function new_tools(int $limit = 8): array {
    $out = [];
    foreach (all_tools() as $t) if ($t['new']) { $out[] = $t; if (count($out) >= $limit) break; }
    return $out;
}

function client_count(): int {
    $c = 0;
    foreach (all_tools() as $t) if ($t['loc'] === 'client') $c++;
    return $c;
}

// Text + ikona + tooltip pro badge místa zpracování.
function location_meta(string $loc): array {
    switch ($loc) {
        case 'client': return ['label' => 'Lokálně',  'icon' => 'ShieldCheck', 'tone' => 'local',   'title' => 'Soubor se zpracovává ve vašem prohlížeči a neopustí tento počítač.'];
        case 'server': return ['label' => 'Na serveru','icon' => 'Server',     'tone' => 'server',  'title' => 'Soubor se zpracuje na serveru a po dokonání se smaže.'];
        default:       return ['label' => 'Přes AI',   'icon' => 'Sparkles',   'tone' => 'ai',      'title' => 'Zpracování probíhá přes AI model.'];
    }
}

function e(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

// ── i18n helpery ──────────────────────────────────────────────────
// Všechny překladycházejí ze slovníku tools/lang/<lang>.php přes vv_t().
// $lang defaultuje na aktuální jazyk bootstrapu (vv_tools_lang()).

function vv_tools_lang(): string {
    return $GLOBALS['vv_tools_lang'] ?? 'cs';
}

function tool_name(array $tool, ?string $lang = null): string {
    return vv_t("tool.{$tool['slug']}.name", $lang ?? vv_tools_lang());
}

function tool_desc(array $tool, ?string $lang = null): string {
    return vv_t("tool.{$tool['slug']}.desc", $lang ?? vv_tools_lang());
}

function category_label(string $cat, ?string $lang = null): string {
    return vv_t("category.{$cat}.label", $lang ?? vv_tools_lang());
}

function category_desc(string $cat, ?string $lang = null): string {
    return vv_t("category.{$cat}.desc", $lang ?? vv_tools_lang());
}

function status_label(string $status, ?string $lang = null): string {
    return vv_t("status.{$status}", $lang ?? vv_tools_lang());
}

/** Vrací [label, icon, tone, title] s lokalizovaným label/title. */
function location_meta_i18n(string $loc, ?string $lang = null): array {
    $lang = $lang ?? vv_tools_lang();
    switch ($loc) {
        case 'client':
            return ['label' => vv_t('location.client.label', $lang), 'icon' => 'ShieldCheck', 'tone' => 'local', 'title' => vv_t('location.client.title', $lang)];
        case 'server':
            return ['label' => vv_t('location.server.label', $lang), 'icon' => 'Server', 'tone' => 'server', 'title' => vv_t('location.server.title', $lang)];
        default:
            return ['label' => vv_t('location.ai.label', $lang), 'icon' => 'Sparkles', 'tone' => 'ai', 'title' => vv_t('location.ai.title', $lang)];
    }
}

/** Vrací kanonický nástroj s lokalizovaným name/desc pro daný jazyk. */
function localize_tool(array $tool, ?string $lang = null): array {
    $lang = $lang ?? vv_tools_lang();
    $tool['name'] = tool_name($tool, $lang);
    $tool['desc'] = tool_desc($tool, $lang);
    if (isset($tool['description'])) $tool['description'] = $tool['desc'];
    return $tool;
}

/** Vrací všechny nástroje s lokalizovaným name/desc. */
function all_tools_localized(?string $lang = null): array {
    return array_map(fn($t) => localize_tool($t, $lang), all_tools());
}
