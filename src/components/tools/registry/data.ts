import type { ComponentType } from "react";

// Typovaný statický dataset nástrojů + i18n slovníky pro tools sekci.
//
// Zdroj pravdy: tools/includes/registry.php (TOOLS pole, CATEGORY_COLORS,
// CATEGORY_LABELS, CATEGORY_ORDER, CATEGORY_DESCRIPTIONS, tool_policy_overrides,
// canonical_tool). Tento soubor je 1:1 TypeScript port pro React verzi —
// žádný PHP runtime na Vercelu není k dispozici.
//
// i18n: cs názvy/descriptions jsou uložené přímo v TOOLS (jako v registry.php).
// Překlady pro jiné jazyky žijí v TOOL_I18N override slovníku a fallbackují
// na cs (stejné chování jako legacy vv_t() z tools/lang/<lang>.php).
// Hub UI řetězce a tool-ui runtime řetězce jsou v HUB_I18N / TOOL_UI_I18N.

// ── Typy ────────────────────────────────────────────────────────────────

export type Category = "pdf" | "image" | "media" | "text" | "ai" | "dev" | "security" | "calc";
export type ProcessingLocation = "client" | "vevit_server" | "external_ai" | "external";
export type ToolStatus = "working" | "limited" | "experimental" | "coming_soon" | "broken" | "maintenance";
export type Locale = "cs" | "en" | "de" | "es" | "uk" | "fr" | "sk";

/** Props, které dostává každá komponenta nástroje od shellu. */
export interface ToolComponentProps {
  locale: Locale;
}
export type ToolComponent = ComponentType<ToolComponentProps>;

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: Category;
  processing_location: ProcessingLocation;
  /** Druhé místo zpracování, když nástroj umí obojí (např. HTML → PDF:
      serverový Chromium i lokální vykreslení). Zobrazuje se jako druhý štítek. */
  also_location?: ProcessingLocation;
  icon: string;
  new: boolean;
  status: ToolStatus;
  keywords: string[];
  aliases: string[];
  note?: string;
  privacy_note: string;
}

// ── Kategorie (z registry.php) ──────────────────────────────────────────

export const CATEGORY_COLORS: Record<Category, string> = {
  pdf: "var(--vv-warning)",
  image: "var(--vv-violet)",
  media: "var(--vv-violet)",
  text: "#6b7280",
  ai: "var(--vv-info)",
  dev: "var(--vv-info)",
  security: "var(--vv-green)",
  calc: "var(--vv-danger)",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  pdf: "PDF",
  image: "Obrázky",
  media: "Média",
  text: "Text",
  ai: "AI",
  dev: "Dev",
  security: "Bezpečnost",
  calc: "Kalkulačky",
};

export const CATEGORY_ORDER: readonly Category[] = ["pdf", "image", "media", "text", "ai", "dev", "security", "calc"];

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  pdf: "Slučování, dělení, komprese a převody PDF dokumentů.",
  image: "Komprese, úpravy a vylepšení obrázků.",
  media: "Práce s videem a zvukem, konverze, komprese, střih.",
  text: "Překlad, shrnutí, Markdown a vizualizace myšlenek.",
  ai: "Asistent, generování obsahu i obrázků pomocí AI.",
  dev: "Regex, JSON, UUID, JWT a další pomůcky pro vývoj.",
  security: "Hashe, hesla, šifrování a kontrola certifikátů.",
  calc: "Procenta, půjčky, převody jednotek a barev.",
};

// ── Stavová metadata místa zpracování (z location_meta_i18n) ────────────

export interface LocationMeta {
  label: string;
  icon: string;
  tone: "local" | "server" | "ai";
  title: string;
}

export const LOCATION_META: Record<ProcessingLocation, LocationMeta> = {
  client: { label: "Lokálně", icon: "ShieldCheck", tone: "local", title: "Soubor se zpracovává ve vašem prohlížeči a neopustí tento počítač." },
  vevit_server: { label: "Na serveru", icon: "Server", tone: "server", title: "Soubor se zpracuje na serveru a po dokončení se smaže." },
  external_ai: { label: "Přes AI", icon: "Sparkles", tone: "ai", title: "Zpracování probíhá přes AI model." },
  external: { label: "Třetí strana", icon: "Globe", tone: "server", title: "Nástroj komunikuje přímo s vybranou externí službou (např. kontrola úniku hesla jen s 5znakovým prefixem hashe)." },
};

// ── Raw TOOLS pole (z registry.php TOOLS) ───────────────────────────────
// Tuple: [slug, name, desc, cat, loc, icon, new, note?]
// loc: 'client' | 'server' | 'ai' (z registry.php, před kanonizací).

type RawLoc = "client" | "server" | "ai" | "external";
type RawTool = [string, string, string, Category, RawLoc, string, boolean, string?];

const FFMPEG_TOOLS = new Set([
  "audio-convert", "audio-trim-normalize", "video-convert", "video-compress",
  "video-trim", "video-extract-audio", "video-to-gif", "video-merge", "video-target-size",
  "video-resize", "video-mute", "video-to-webp",
]);

const RAW_TOOLS: RawTool[] = [
  // ── PDF ────────────────────────────────────────────────────────────────
  ["pdf-merge", "Sloučení PDF", "Sloučí více PDF souborů do jednoho.", "pdf", "client", "Files", false],
  ["pdf-split", "Rozdělení PDF", "Rozdělí PDF na jednotlivé stránky.", "pdf", "client", "Scissors", false],
  ["pdf-compress", "Komprese PDF", "Zmenší velikost PDF souboru.", "pdf", "client", "Shrink", false],
  ["pdf-to-word", "PDF → Word", "Převede PDF na upravitelný dokument Word: odstavce, tabulky, obrázky, záhlaví i OCR skenů. Přímo v prohlížeči.", "pdf", "client", "FileText", true],
  ["html-to-pdf", "HTML → PDF", "Převede HTML na PDF věrně jako prohlížeč: CSS (grid, flexbox, gradienty, stíny), fonty, SVG i JavaScript. Vykreslení v Chromiu na serveru, nebo lokálně v prohlížeči.", "pdf", "server", "FileCode", false],
  ["invoice-gen", "Faktura generátor", "Generujte profesionální faktury s QR kódem.", "pdf", "client", "Receipt", true],
  ["pdf-to-images", "PDF → obrázky", "Převede stránky PDF na obrázky (PNG, JPG, WebP, BMP, TIFF, GIF) s náhledem; každý obrázek se stáhne rovnou, bez ZIPu.", "pdf", "client", "ImagePlus", true],
  ["images-to-pdf", "Obrázky → PDF", "Spojí více obrázků do jednoho PDF.", "pdf", "client", "Files", true],
  ["pdf-rotate", "Otočení PDF", "Otočí nebo překlopí stránky PDF.", "pdf", "client", "RotateCw", true],
  ["pdf-organize", "Organizace PDF", "Odstraňte nebo přerovnejte stránky PDF.", "pdf", "client", "Maximize", true],
  ["pdf-watermark", "Vodoznak PDF", "Přidá textový vodoznak do PDF.", "pdf", "client", "Stamp", true],
  ["pdf-page-numbers", "Číslování stránek", "Přidá čísla stránek do PDF.", "pdf", "client", "Hash", true],
  ["pdf-extract-text", "Extrakce textu PDF", "Vytáhne text z PDF (pdf.js).", "pdf", "client", "AlignLeft", true],
  ["pdf-password", "Ochrana PDF heslem", "Nastaví nebo odstraní heslo PDF (qpdf.js, běží ve web workeru).", "pdf", "client", "FileKey", false],

  ["pdf-remove-pages", "Odstranění stránek", "Odstraňte vybrané stránky z PDF (rozsahy).", "pdf", "client", "FileMinus", true],
  ["pdf-extract-pages", "Extrakce stránek", "Vytáhněte vybrané stránky do nového PDF.", "pdf", "client", "FileOutput", true],
  ["pdf-crop", "Oříznutí PDF", "Ořízněte okraje stránek PDF (crop box).", "pdf", "client", "Crop", true],
  ["pdf-redact", "Zakrytí citlivých dat", "Zakryjte černě citlivé pasáže v PDF.", "pdf", "client", "Square", true],
  ["pdf-sign", "Podpis PDF", "Nakreslete podpis a vložte ho do PDF.", "pdf", "client", "PenTool", true],
  ["pdf-forms", "Vyplnění formulářů", "Vyplňte PDF formuláře (AcroForm pole).", "pdf", "client", "ClipboardList", true],
  ["pdf-repair", "Oprava PDF", "Best-effort oprava poškozeného PDF.", "pdf", "client", "Wrench", true],
  ["scan-to-pdf", "Sken → PDF", "Vytvořte PDF z obrázků/snímů (kamera, soubory).", "pdf", "client", "ScanLine", true],
  ["pdf-compare", "Porovnání PDF", "Porovnejte text dvou PDF a zvýrazněte rozdíly.", "pdf", "client", "FileDiff", true],
  ["pdf-to-markdown", "PDF → Markdown", "Převeďte PDF na Markdown včetně tabulek.", "pdf", "client", "Hash", true],
  ["word-to-pdf", "Word → PDF", "Převede dokument Word (.docx) na PDF se zachovaným vzhledem, fonty a tabulkami, volitelně PDF/A. Přímo v prohlížeči.", "pdf", "client", "FileType", true],
  ["excel-to-pdf", "Excel → PDF", "Převeďte tabulku .xlsx/.csv na PDF.", "pdf", "client", "Table", true],
  ["pdf-to-excel", "PDF → Excel", "Vytáhněte tabulky z PDF do .xlsx.", "pdf", "client", "Sheet", true],
  ["pptx-to-pdf", "PowerPoint → PDF", "Převeďte .pptx prezentaci na PDF.", "pdf", "client", "Presentation", true],
  ["pdf-to-pptx", "PDF → PowerPoint", "Převeďte stránky PDF na slidy .pptx.", "pdf", "client", "MonitorPlay", true],
  ["translate-pdf", "Překlad PDF", "Přeložte textovou vrstvu PDF do jiného jazyka.", "pdf", "ai", "Languages", true],
  ["ocr-pdf", "OCR PDF", "Rozpoznejte text ze skenů (tesseract, 45 jazyků, lokálně).", "pdf", "client", "ScanText", true],
  ["pdf-edit", "Editace PDF", "Přidávejte text, podpis a razítka do PDF.", "pdf", "client", "FilePen", true, "Experimentální editor — základní úpravy (text, podpis, razítko)."],
  ["pdf-to-pdfa", "PDF → PDF/A", "Převeďte PDF do archivačního formátu PDF/A.", "pdf", "client", "Archive", true, "Konverze do PDF/A vyžaduje specializovanou validaci (veraPDF), kterou prohlížeč neposkytuje. V přípravě."],
  ["epub-to-mobi", "EPUB → MOBI", "Převeďte e-knihu EPUB do formátu MOBI.", "pdf", "client", "BookOpen", true, "Konverze e-knih vyžaduje Calibre knihovnu, která není dostupná v prohlížeči. V přípravě."],
  ["epub-to-azw3", "EPUB → AZW3", "Převeďte e-knihu EPUB do formátu AZW3 (Kindle).", "pdf", "client", "BookOpen", true, "Konverze e-knih vyžaduje Calibre knihovnu, která není dostupná v prohlížeči. V přípravě."],

  // ── Obrázky ────────────────────────────────────────────────────────────
  ["img-compress", "Komprese obrázku", "Zmenšete obrázek přes canvas (kvalita, JPEG/WebP).", "image", "client", "Image", false],
  ["bg-remover", "Odstranit pozadí", "AI odstranění pozadí z fotografií (ONNX MODNet).", "image", "ai", "Eraser", true],
  ["img-upscaler", "Zvětšení kvality", "Zvětší rozlišení obrázku (2×/3×/4×) přes canvas.", "image", "client", "Maximize", true],
  ["gif-maker", "Tvůrce GIFu", "Vytvořte animovaný GIF ze sekvence obrázků.", "image", "client", "Film", true],
  ["screenshot-tool", "Screenshot URL", "Pořiďte screenshot libovolné webové stránky.", "image", "server", "Camera", true],
  ["image-convert", "Převod formátu", "Převeďte PNG/JPG/WebP/BMP přes canvas.", "image", "client", "Repeat", true],
  ["image-crop", "Oříznutí obrázku", "Interaktivně ořízněte obrázek v canvasu.", "image", "client", "Crop", true],
  ["image-rotate-flip", "Otočení/Překlopení", "Otočte nebo překlopte obrázek (90/180/270/flip).", "image", "client", "RotateCw", true],
  ["image-filters", "Filtry obrázku", "Grayscale, sepia, jas, kontrast, saturace.", "image", "client", "SlidersHorizontal", true],
  ["image-watermark", "Vodoznak", "Přidejte textový nebo obrázkový vodoznak.", "image", "client", "Stamp", true],
  ["image-exif", "EXIF metadata", "Prohlížejte a odstraňujte EXIF (vč. GPS).", "image", "client", "ScanLine", true],
  ["image-collage", "Koláž obrázků", "Spojte více obrázků do koláže (různá rozvržení).", "image", "client", "Images", true],
  ["favicon-generator", "Favicon generátor", "Vygeneruje favicony (PNG více velikostí + ICO).", "image", "client", "Globe", true],
  ["meme-generator", "Meme generátor", "Vytvořte meme s horním/dolním textem (Impact).", "image", "client", "Laugh", true],

  ["image-resize", "Změna velikosti", "Změňte rozměry obrázku (px, %, poměr stran).", "image", "client", "Scaling", true],
  ["image-add-text", "Text na obrázek", "Přidejte text na obrázek (font, barva, pozice).", "image", "client", "Type", true],
  ["image-border", "Rámeček obrázku", "Přidejte rámeček (barva, tloušťka).", "image", "client", "Frame", true],
  ["image-pixelate", "Pixelizace", "Rozpixelujte celý obrázek nebo jeho část.", "image", "client", "Grid3x3", true],
  ["image-round", "Kulatý profilový obrázek", "Vytvořte kulatý profilový obrázek z fotky.", "image", "client", "Circle", true],
  ["image-splitter", "Rozříznutí obrázku", "Rozřízněte obrázek na mřížku (2×2, 3×3…) → ZIP.", "image", "client", "Grid2x2", true],
  ["chart-maker", "Tvůrce grafů", "Vytvořte graf (sloupcový/čárový/kruhový) z dat → PNG.", "image", "client", "BarChart3", true],
  ["image-bw", "Černobílý převod", "Prahovaná černobílá konverze (threshold).", "image", "client", "Contrast", true],
  ["blur-background", "Rozostření pozadí", "Rozostřete pozadí a ponechte ostří objekt.", "image", "client", "Droplet", true],
  ["heic-to-jpg", "HEIC → JPG", "Převeďte iPhone fotky HEIC na JPG/PNG.", "image", "client", "Smartphone", true],

  // ── Média ──────────────────────────────────────────────────────────────
  ["video-convert", "Konverze videa", "Přeďte video mezi formáty MP4, WebM (ffmpeg.wasm).", "media", "client", "Video", false],
  ["video-compress", "Komprese videa", "Zmenší velikost videa (ffmpeg.wasm, nastavitelná kvalita).", "media", "client", "Shrink", false],
  ["video-trim", "Ořez videa", "Ořízněte, rozpůlte nebo graficky ořízněte okraje videa (ffmpeg.wasm).", "media", "client", "Scissors", false],
  ["audio-convert", "Konverze audia", "Přeďte audio mezi MP3/WAV/OGG/FLAC (ffmpeg.wasm).", "media", "client", "Music", false],
  ["video-thumbnail", "Náhled videa", "Vygeneruje snímek z videa — z souboru i z odkazu (YouTube).", "media", "client", "Camera", true],
  ["audio-waveform", "Křivka audia", "Vykreslí křivku hlasitosti audia (Web Audio API).", "media", "client", "Volume2", true],
  ["video-extract-audio", "Extrakce audia", "Vytáhne zvukovou stopu z videa (ffmpeg.wasm).", "media", "client", "Music", true],
  ["video-to-gif", "Video → GIF", "Vytvoří animovaný GIF z videa (ffmpeg.wasm).", "media", "client", "Film", true],
  ["video-merge", "Spojení videí", "Spojí více videí (stejný kodek/rozlišení, ffmpeg.wasm).", "media", "client", "Plus", true],
  ["video-target-size", "Cílová velikost", "Dopočítá bitrate pro cílovou velikost videa.", "media", "client", "Scale", true],
  ["audio-trim-normalize", "Ořez+normalizace audia", "Ořízne a normalizuje hlasitost audia.", "media", "client", "SlidersHorizontal", true],

  ["video-resize", "Změna rozlišení videa", "Změňte rozlišení videa (720p, 1080p, vlastní).", "media", "client", "Scaling", true],
  ["video-mute", "Ztlumení videa", "Odstraňte zvukovou stopu z videa.", "media", "client", "VolumeX", true],
  ["video-to-webp", "Video → WebP", "Vytvořte animovaný WebP z videa.", "media", "client", "Image", true],
  ["audio-to-text", "Přepis audia (Whisper)", "Přepište řeč z audia na text.", "media", "ai", "Mic", true, "Přepis řeči vyžaduje specializovaný model (plánovaná integrace Amazon Transcribe přes AWS). V přípravě."],

  // ── Text ───────────────────────────────────────────────────────────────
  ["translate", "Překlad textu", "Přeložte text mezi jazyky pomocí AI.", "text", "ai", "Languages", true],
  ["summarize-text", "Shrnutí textu", "Vytvořte stručné shrnutí dlouhého textu.", "text", "ai", "AlignLeft", true],
  ["markdown-editor", "Markdown editor", "Editujte a náhledněte Markdown v reálném čase.", "text", "client", "FileCode", false],
  ["mind-map", "Myšlenková mapa", "Vizualizujte strukturu myšlenek jako radiální strom.", "text", "client", "GitBranch", true],
  ["text-counter", "Počítadlo textu", "Spočítejte znaky, slova, věty a odhad doby čtení.", "text", "client", "Type", true],
  ["text-case-converter", "Velikost písmen", "Převod UPPER/lower/Title/camelCase/snake_case.", "text", "client", "CaseSensitive", true],
  ["lorem-ipsum", "Lorem ipsum", "Generujte zástupný text (věty/odstavce/slova).", "text", "client", "Pilcrow", true],
  ["remove-diacritics", "Odstranění diakritiky", "Převeďte text bez diakritiky (ASCII fold).", "text", "client", "SpellCheck", true],
  ["text-to-speech", "Text na řeč (TTS)", "Přečtěte text nahlas přes Web Speech API.", "text", "client", "Volume2", true],
  ["text-lines-tool", "Práce s řádky", "Duplicity, řazení, prázdné řádky, unique.", "text", "client", "Rows3", true],

  ["paragraph-writer", "AI psaní odstavce", "Napíše odstavec na dané téma.", "text", "ai", "Pilcrow", true],
  ["sentence-rewriter", "AI přepis vět", "Přefrázujte věty jinými slovy.", "text", "ai", "Repeat", true],
  ["essay-writer", "AI esej", "Napíše esej/článek na zadané téma.", "text", "ai", "GraduationCap", true],
  ["article-writer", "AI článek", "Vytvořte článek z titulku či osnovy.", "text", "ai", "Newspaper", true],
  ["paragraph-completer", "AI dokončení textu", "Doplňte nedokončený odstavec.", "text", "ai", "TextCursorInput", true],
  ["content-improver", "AI vylepšení textu", "Zlepšete styly a čitelnost textu.", "text", "ai", "Sparkles", true],
  ["story-generator", "AI pohádka/příběh", "Vygenerujte příběh podle zadání.", "text", "ai", "BookOpen", true],
  ["ai-humanizer", "AI humanizér", "Přejděte AI text přirozeněji lidsky.", "text", "ai", "UserRound", true],
  ["tone-of-voice", "AI tón textu", "Přepište text jiným tónem (formální…).", "text", "ai", "MessageCircle", true],
  ["faq-generator", "AI FAQ generátor", "Vygenerujte časté otázky a odpovědi.", "text", "ai", "CircleHelp", true],
  ["business-name-generator", "AI názvy firmy", "Navrhněte názvy pro vaši firmu/projekt.", "text", "ai", "Building2", true],
  ["blog-outline-generator", "AI osnova blogu", "Vytvořte strukturu blogpostu.", "text", "ai", "ListTree", true],
  ["blog-post-ideas", "AI nápady na články", "Získejte témata pro vaše články.", "text", "ai", "Lightbulb", true],
  ["instagram-caption", "AI Instagram popisky", "Vytvořte poutavé popisky a hashtagy.", "text", "ai", "Camera", true],
  ["linkedin-post", "AI LinkedIn příspěvek", "Napište profesionální LinkedIn post.", "text", "ai", "BriefcaseBusiness", true],
  ["fb-headline-generator", "AI Facebook titulky", "Vygenerujte titulky pro Facebook.", "text", "ai", "Megaphone", true],
  ["youtube-script", "AI YouTube scénář", "Napište scénář pro YouTube video.", "text", "ai", "SquarePlay", true],

  // ── AI ─────────────────────────────────────────────────────────────────
  ["ai-chat", "AI asistent", "Chatujte s AI asistentem pro různé úkoly.", "ai", "ai", "MessageSquare", false],
  ["ai-vision", "AI analýza obrázku", "Popište a analyzujte obsah obrázku pomocí AI.", "ai", "ai", "Eye", false],
  ["ai-seo", "SEO meta generátor", "Generujte SEO titulky a popisky automaticky.", "ai", "ai", "Search", true],
  ["ai-image-gen", "AI generátor obrázku", "Vytvořte unikátní obrázky z textového popisu.", "ai", "ai", "ImagePlus", true, "Generování obrázků vyžaduje další infrastrukturu (Stable Diffusion / ComfyUI), kterou Ollama neposkytuje. Nástroj je v přípravě."],
  ["ai-sql-gen", "AI generátor SQL", "Převeďte přirozený jazyk na SQL dotazy.", "ai", "ai", "Database", true],
  ["ai-restore-photo", "AI obnova fotek", "Obnovte poškozené/staré fotografie.", "ai", "ai", "ImageUp", true, "Obnova fotografií vyžaduje specializované modely (GFPGAN/Real-ESRGAN), které nejsou zatím hostované. V přípravě."],
  ["ai-colorize", "AI kolorování", "Obarvěte černobílé fotografie.", "ai", "ai", "Palette", true, "Kolorování vyžaduje specializované modely (DeOldify). V přípravě."],
  ["ai-remove-object", "AI odstranění objektů", "Odstraňte nechtěné objekty/osoby z fotky.", "ai", "ai", "Eraser", true, "Odstranění objektů vyžaduje inpainting model (LaMa). V přípravě."],
  ["grammar-check", "AI kontrola pravopisu", "Opravte pravopis a gramatiku českého textu.", "text", "ai", "SpellCheck", true],
  ["ai-email-writer", "AI psaní e-mailu", "Vytvořte e-mail podle zadání a zvoleného tónu.", "text", "ai", "Mail", true],
  ["ai-text-qa", "AI otázky nad textem", "Ptejte se na cokoliv k dodanému textu (kontext).", "ai", "ai", "HelpCircle", true],
  ["ai-commit-message", "AI commit zpráva", "Vygeneruje commit zprávu z diffu (conventional commits).", "dev", "ai", "GitCommit", true],
  ["ai-regex-generator", "AI regex generátor", "Popište pattern, dostanete regulární výraz.", "dev", "ai", "Regex", true],
  ["ai-code-explainer", "AI vysvětlení kódu", "Vysvětlí, co dělá kód, srozumitelně a v češtině.", "dev", "ai", "FileCode", true],

  // ── Dev ────────────────────────────────────────────────────────────────
  ["regex-tester", "Regex tester", "Testujte regulární výrazy v reálném čase.", "dev", "client", "Regex", false],
  ["json-formatter", "JSON formátovač", "Formátujte a validujte JSON strukturu.", "dev", "client", "Braces", false],
  ["gradient-gen", "CSS Gradient Editor", "Vytvářejte a upravujte CSS gradienty interaktivně.", "dev", "client", "Palette", true],
  ["uuid-gen", "UUID generátor", "Generujte náhodné UUID v4 a v7.", "dev", "client", "Fingerprint", true],
  ["jwt-decoder", "JWT dekodér", "Dekódujte a ověřte JWT tokeny.", "dev", "client", "KeyRound", true],
  ["base64-tool", "Base64 kodér/dekodér", "Kódujte a dekódujte Base64 (text i soubory).", "dev", "client", "Code", true],
  ["url-encoder", "URL kodér/dekodér", "Kódujte a dekódujte URL (percent encoding).", "dev", "client", "Link2", true],
  ["jwt-generator", "JWT generátor", "Vytvořte a podepište JWT token (HMAC).", "dev", "client", "FileKey", true],
  ["yaml-json-converter", "YAML ↔ JSON", "Převádějte mezi YAML a JSON obousměrně.", "dev", "client", "FileCode", true],
  ["csv-json-converter", "CSV ↔ JSON", "Převádějte mezi CSV a JSON obousměrně.", "dev", "client", "FileSpreadsheet", true],
  ["cron-builder", "Cron výraz builder", "Sestavte a vysvětlete cron výraz obousměrně.", "dev", "client", "CalendarClock", true],
  ["timestamp-converter", "Unix timestamp", "Převod mezi Unix timestampem a datem (i pásma).", "dev", "client", "Timer", true],
  ["code-diff", "Code diff", "Porovnejte dva texty/kód a zobrazte změny.", "dev", "client", "GitCompare", true],
  ["css-js-html-formatter", "CSS/JS/HTML formátovač", "Naformátujte nebo zminifikujte CSS, JS a HTML.", "dev", "client", "SquareCode", true],
  ["contrast-checker", "Kontrast (WCAG)", "Ověřte kontrast barev dle WCAG AA/AAA.", "dev", "client", "Contrast", true],
  ["qr-generator", "QR generátor", "Vytvořte QR kód (text, URL, Wi-Fi, vCard).", "dev", "client", "QrCode", true],
  ["og-meta-generator", "OG meta generátor", "Vygenerujte Open Graph meta tagy s náhledem.", "dev", "client", "Share2", true],
  ["gitignore-generator", ".gitignore generátor", "Sestavte .gitignore podle jazyka/nástroje.", "dev", "client", "FileX", true],
  ["fake-data-generator", "Fake data generátor", "Generujte testovací data a exportujte CSV/JSON.", "dev", "client", "Database", true],
  ["color-palette-generator", "Paleta barev", "Vytvořte paletu (komplementární, analogická…).", "dev", "client", "SwatchBook", true],

  ["create-zip", "Vytvořit ZIP", "Zabalte více souborů do ZIP archivu.", "dev", "client", "FolderArchive", true],
  ["split-csv", "Rozdělení CSV", "Rozdělte velké CSV na více souborů.", "dev", "client", "SplitSquareHorizontal", true],
  ["split-excel", "Rozdělení Excelu", "Rozdělte .xlsx na více souborů (řádky/listy).", "dev", "client", "Sheet", true],
  ["csv-to-excel", "CSV → Excel", "Převeďte CSV na formátovaný .xlsx.", "dev", "client", "Table", true],
  ["excel-to-csv", "Excel → CSV", "Převeďte .xlsx na CSV (vybraný list).", "dev", "client", "FileSpreadsheet", true],
  ["excel-to-xml", "Excel → XML", "Exportujte tabulku do XML.", "dev", "client", "Code2", true],
  ["xml-to-excel", "XML → Excel", "Převeďte XML data do .xlsx.", "dev", "client", "FileCode", true],
  ["xml-to-json", "XML → JSON", "Převeďte XML na JSON (prohlížečový parser).", "dev", "client", "Braces", true],
  ["json-to-xml", "JSON → XML", "Převeďte JSON na XML.", "dev", "client", "FileCode2", true],

  // ── Bezpečnost ─────────────────────────────────────────────────────────
  ["hash-gen", "Hash generátor", "Generujte MD5, SHA-256, SHA-512 hashe.", "security", "client", "Hash", false],
  ["password-gen", "Generátor hesel", "Vytvářejte bezpečná hesla na míru.", "security", "client", "Lock", false],
  ["encrypt-decrypt", "Šifrování textu", "Zašifrujte a dešifrujte text pomocí AES-256-GCM.", "security", "client", "Shield", false],
  ["steganography", "Steganografie", "Skryjte text v obrázku pomocí LSB encoding.", "security", "client", "EyeOff", true],
  ["certificate-info", "SSL certifikát info", "Zkontrolujte platnost a detaily SSL certifikátu.", "security", "server", "GlobeLock", true],
  ["password-strength", "Síla hesla", "Odhadněte entropii a dobu prolomení hesla.", "security", "client", "ShieldCheck", true],
  ["totp-generator", "TOTP generátor", "Vygenerujte 2FA TOTP kódy (RFC 6238) z tajemství.", "security", "client", "Timer", true],
  ["password-breach-check", "Kontrola úniku hesla", "Ověří, jestli heslo uniklo (HIBP k-anonymity).", "security", "external", "Fingerprint", true],
  ["file-encryption", "Šifrování souborů", "Zašifruje/dešifruje soubor AES-256-GCM (Web Crypto).", "security", "client", "FileKey", true],
  ["token-generator", "Token generátor", "Generuje náhodné tokeny (délka, znaková sada).", "security", "client", "Zap", true],

  // ── Kalkulačky ─────────────────────────────────────────────────────────
  ["percentage-calc", "Kalkulačka procent", "Rychle spočítejte procenta, zvýšení a snížení.", "calc", "client", "Percent", false],
  ["loan-calc", "Kalkulačka půjčky", "Vypočítejte splátky a amortizační tabulku.", "calc", "client", "Calculator", false],
  ["unit-converter", "Převodník jednotek", "Převádějte délku, hmotnost, teplotu, objem a další.", "calc", "client", "Ruler", false],
  ["color-converter", "Převodník barev", "Převádějte mezi HEX, RGB, HSL a CMYK.", "calc", "client", "Palette", false],
  ["number-base-converter", "Soustava čísel", "Převádějte mezi decimální, binární, oktálovou a hexadecimální soustavou.", "calc", "client", "Binary", true],
  ["bmi-calc", "BMI kalkulačka", "Vypočítejte index tělesné hmotnosti a kategorii.", "calc", "client", "Scale", true],
  ["discount-calc", "Kalkulačka slev", "Spočítejte cenu po slevě, i vícenásobné slevy.", "calc", "client", "Tag", true],
  ["vat-calc", "DPH kalkulačka", "Převeďte částku mezi bez DPH a s DPH (CZ sazby).", "calc", "client", "Landmark", true],
  ["net-salary-calc", "Kalkulačka čisté mzdy", "Odhad čisté mzdy ze hrubé (CZ sazby).", "calc", "client", "Wallet", true],
  ["date-diff-calc", "Rozdíl datumů", "Vypočítejte rozdíl mezi dvěma daty v dnech.", "calc", "client", "CalendarDays", true],
  ["compound-interest-calc", "Složené úročení", "Spočítejte výnos složeného úročení.", "calc", "client", "TrendingUp", true],
  ["grade-average-calc", "Průměr známek", "Vypočítejte vážený průměr známek.", "calc", "client", "GraduationCap", true],
  ["fuel-consumption-calc", "Spotřeba paliva", "Převod mezi l/100 km a mpg.", "calc", "client", "Fuel", true],
  ["bmr-calc", "BMR a kalorie", "Bazální metabolismus a denní příjem kalorií.", "calc", "client", "Flame", true],
  ["time-calc", "Časová kalkulačka", "Sčítání a odčítání časových údajů.", "calc", "client", "Clock", true],
  ["iban-converter", "Převodník IBAN", "Převede české číslo účtu na IBAN a zpět.", "calc", "client", "Banknote", true],
  ["birth-number-validator", "Validátor rodného čísla", "Ověří formát a kontrolní součet rodného čísla.", "calc", "client", "BadgeCheck", true],
  ["email-breach-check", "Kontrola úniku e-mailu", "Ověřte, jestli vaše e-mailová adresa figuruje ve známých únicích dat.", "security", "external", "Mail", true],
];

// ── Kanonizace (port canonical_tool + tool_policy_overrides) ────────────

function canonicalize(raw: RawTool): Tool {
  const [slug, name, description, category, loc, icon, isNew, note] = raw;
  const processing_location: ProcessingLocation =
    loc === "server" ? "vevit_server" : loc === "ai" ? "external_ai" : loc === "external" ? "external" : "client";

  let status: ToolStatus = loc === "ai" ? "limited" : "working";
  if (FFMPEG_TOOLS.has(slug)) status = "limited";
  const COMING_SOON = new Set([
    "ai-image-gen", "audio-to-text", "ai-restore-photo", "ai-colorize", "ai-remove-object",
    "pdf-to-pdfa", "epub-to-mobi", "epub-to-azw3",
  ]);
  if (COMING_SOON.has(slug)) status = "coming_soon";
  if (slug === "pdf-edit") status = "experimental";
  // AI nástroje jsou dočasně v údržbě (nejdou otevřít); ty, které ještě nejsou hotové, zůstávají „Připravujeme“.
  if (loc === "ai" && status !== "coming_soon") status = "maintenance";

  const slugWords = slug.split(/-+/);
  const keywords = Array.from(new Set([...slugWords, slug].filter(Boolean)));

  const privacy_note =
    loc === "client"
      ? "Zpracování probíhá lokálně v prohlížeči."
      : "Před použitím ověřte podmínky zpracování uvedené u nástroje.";

  return {
    slug, name, description, category, processing_location, icon,
    new: isNew, status, keywords, aliases: [], note, privacy_note,
  };
}

export const TOOLS: readonly Tool[] = RAW_TOOLS.map(canonicalize).map((tool) =>
  // HTML → PDF umí obojí: vykreslení v Chromiu na serveru i lokálně v prohlížeči
  // (u nástroje se přepíná) — proto dva štítky místa zpracování.
  tool.slug === "html-to-pdf" ? { ...tool, also_location: "client" } : tool,
);

// ── Překlady názvů/descriptions (override nad cs v TOOLS) ───────────────
// Klíč = slug, hodnota = { name?, desc? } pro daný jazyk. Chybějící fallback na cs.
// Zdroj: tools/lang/<lang>.php (tool.<slug>.name / .desc).
export const TOOL_I18N: Partial<Record<Locale, Record<string, { name?: string; desc?: string }>>> = {
  en: {
    "pdf-merge": { name: "Merge PDF", desc: "Merge multiple PDF files into one." },
    "pdf-split": { name: "Split PDF", desc: "Split a PDF into individual pages." },
    "pdf-compress": { name: "Compress PDF", desc: "Reduce the size of a PDF file." },
    "pdf-to-word": { name: "PDF → Word", desc: "Convert a PDF to an editable Word document: paragraphs, tables, images, headers and OCR for scans. In your browser." },
    "word-to-pdf": { name: "Word → PDF", desc: "Convert a Word document (.docx) to PDF, keeping layout, fonts and tables; PDF/A optional. In your browser." },
    "html-to-pdf": { name: "HTML → PDF", desc: "Converts HTML to PDF as faithfully as a browser: CSS (grid, flexbox, gradients, shadows), fonts, SVG and JavaScript. Rendered in Chromium on the server, or locally in your browser." },
    "invoice-gen": { name: "Invoice generator", desc: "Generate professional invoices with a QR code." },
    "pdf-to-images": { name: "PDF → images", desc: "Convert PDF pages to images (PNG, JPG, WebP, BMP, TIFF, GIF) with preview; each image downloads directly, no ZIP." },
    "images-to-pdf": { name: "Images → PDF", desc: "Combine multiple images into one PDF." },
    "pdf-rotate": { name: "Rotate PDF", desc: "Rotate or flip PDF pages." },
    "pdf-organize": { name: "Organize PDF", desc: "Remove or reorder PDF pages." },
    "pdf-watermark": { name: "PDF watermark", desc: "Add a text watermark to a PDF." },
    "pdf-page-numbers": { name: "Page numbers", desc: "Add page numbers to a PDF." },
    "pdf-extract-text": { name: "PDF text extraction", desc: "Extract text from PDF (pdf.js)." },
    "pdf-password": { name: "PDF password protection", desc: "Set or remove a PDF password (qpdf)." },
    "img-compress": { name: "Image compression", desc: "Shrink an image via canvas (quality, JPEG/WebP)." },
    "bg-remover": { name: "Remove background", desc: "AI background removal from photos (ONNX MODNet)." },
    "img-upscaler": { name: "Quality upscaler", desc: "Upscale image resolution (2×/3×/4×) via canvas." },
    "gif-maker": { name: "GIF maker", desc: "Create an animated GIF from a sequence of images." },
    "screenshot-tool": { name: "URL screenshot", desc: "Take a screenshot of any web page." },
    "image-convert": { name: "Format converter", desc: "Convert PNG/JPG/WebP/BMP via canvas." },
    "image-crop": { name: "Image crop", desc: "Interactively crop an image in canvas." },
    "image-rotate-flip": { name: "Rotate/Flip", desc: "Rotate or flip an image (90/180/270/flip)." },
    "image-filters": { name: "Image filters", desc: "Grayscale, sepia, brightness, contrast, saturation." },
    "image-watermark": { name: "Watermark", desc: "Add a text or image watermark." },
    "image-exif": { name: "EXIF metadata", desc: "View and remove EXIF (incl. GPS)." },
    "image-collage": { name: "Image collage", desc: "Combine multiple images into a collage." },
    "favicon-generator": { name: "Favicon generator", desc: "Generate favicons (PNG multiple sizes + ICO)." },
    "meme-generator": { name: "Meme generator", desc: "Create a meme with top/bottom text (Impact)." },
    "video-convert": { name: "Video converter", desc: "Convert video between MP4, WebM (ffmpeg.wasm)." },
    "video-compress": { name: "Video compression", desc: "Reduce video size (ffmpeg.wasm, adjustable quality)." },
    "video-trim": { name: "Video trim & crop", desc: "Trim, split in half or graphically crop the edges of a video (ffmpeg.wasm)." },
    "audio-convert": { name: "Audio converter", desc: "Convert audio between MP3/WAV/OGG/FLAC (ffmpeg.wasm)." },
    "video-thumbnail": { name: "Video thumbnail", desc: "Grab a frame from a video file or a link (YouTube)." },
    "audio-waveform": { name: "Audio waveform", desc: "Render audio volume waveform (Web Audio API)." },
    "video-extract-audio": { name: "Extract audio", desc: "Extract the audio track from video (ffmpeg.wasm)." },
    "video-to-gif": { name: "Video → GIF", desc: "Create an animated GIF from video (ffmpeg.wasm)." },
    "video-merge": { name: "Merge videos", desc: "Merge multiple videos (same codec/resolution, ffmpeg.wasm)." },
    "video-target-size": { name: "Target size", desc: "Compute bitrate for a target video size." },
    "audio-trim-normalize": { name: "Trim + normalize audio", desc: "Trim and normalize audio volume." },
    "translate": { name: "Text translation", desc: "Translate text between languages using AI." },
    "summarize-text": { name: "Summarize text", desc: "Create a concise summary of a long text." },
    "markdown-editor": { name: "Markdown editor", desc: "Edit and preview Markdown in real time." },
    "mind-map": { name: "Mind map", desc: "Visualize the structure of ideas as a radial tree." },
    "text-counter": { name: "Text counter", desc: "Count characters, words, sentences and reading time." },
    "text-case-converter": { name: "Letter case", desc: "Convert UPPER/lower/Title/camelCase/snake_case." },
    "lorem-ipsum": { name: "Lorem ipsum", desc: "Generate placeholder text (sentences/paragraphs/words)." },
    "remove-diacritics": { name: "Remove diacritics", desc: "Convert text without diacritics (ASCII fold)." },
    "text-to-speech": { name: "Text to speech (TTS)", desc: "Read text aloud via Web Speech API." },
    "text-lines-tool": { name: "Line tools", desc: "Duplicates, sorting, blank lines, unique." },
    "ai-chat": { name: "AI assistant", desc: "Chat with an AI assistant for various tasks." },
    "ai-vision": { name: "AI image analysis", desc: "Describe and analyze image content with AI." },
    "ai-seo": { name: "SEO meta generator", desc: "Generate SEO titles and descriptions automatically." },
    "ai-image-gen": { name: "AI image generator", desc: "Create unique images from a text description." },
    "ai-sql-gen": { name: "AI SQL generator", desc: "Convert natural language into SQL queries." },
    "grammar-check": { name: "AI spelling check", desc: "Fix spelling and grammar of Czech text." },
    "ai-email-writer": { name: "AI email writer", desc: "Create an email from a brief and chosen tone." },
    "ai-text-qa": { name: "AI Q&A over text", desc: "Ask anything about a provided text (context)." },
    "ai-commit-message": { name: "AI commit message", desc: "Generate a commit message from a diff (conventional commits)." },
    "ai-regex-generator": { name: "AI regex generator", desc: "Describe a pattern, get a regular expression." },
    "ai-code-explainer": { name: "AI code explainer", desc: "Explains what code does, clearly and in Czech." },
    "regex-tester": { name: "Regex tester", desc: "Test regular expressions in real time." },
    "json-formatter": { name: "JSON formatter", desc: "Format and validate JSON structure." },
    "gradient-gen": { name: "CSS Gradient Editor", desc: "Create and edit CSS gradients interactively." },
    "uuid-gen": { name: "UUID generator", desc: "Generate random UUID v4 and v7." },
    "jwt-decoder": { name: "JWT decoder", desc: "Decode and verify JWT tokens." },
    "base64-tool": { name: "Base64 encoder/decoder", desc: "Encode and decode Base64 (text and files)." },
    "url-encoder": { name: "URL encoder/decoder", desc: "Encode and decode URLs (percent encoding)." },
    "jwt-generator": { name: "JWT generator", desc: "Create and sign a JWT token (HMAC)." },
    "yaml-json-converter": { name: "YAML ↔ JSON", desc: "Convert between YAML and JSON bidirectionally." },
    "csv-json-converter": { name: "CSV ↔ JSON", desc: "Convert between CSV and JSON bidirectionally." },
    "cron-builder": { name: "Cron expression builder", desc: "Build and explain a cron expression bidirectionally." },
    "timestamp-converter": { name: "Unix timestamp", desc: "Convert between Unix timestamp and date (with zones)." },
    "code-diff": { name: "Code diff", desc: "Compare two texts/code and show changes." },
    "css-js-html-formatter": { name: "CSS/JS/HTML formatter", desc: "Format or minify CSS, JS and HTML." },
    "contrast-checker": { name: "Contrast (WCAG)", desc: "Verify color contrast per WCAG AA/AAA." },
    "qr-generator": { name: "QR generator", desc: "Create a QR code (text, URL, Wi-Fi, vCard)." },
    "og-meta-generator": { name: "OG meta generator", desc: "Generate Open Graph meta tags with a preview." },
    "gitignore-generator": { name: ".gitignore generator", desc: "Build a .gitignore by language/tool." },
    "fake-data-generator": { name: "Fake data generator", desc: "Generate test data and export CSV/JSON." },
    "color-palette-generator": { name: "Color palette", desc: "Create a palette (complementary, analogous…)." },
    "hash-gen": { name: "Hash generator", desc: "Generate MD5, SHA-256, SHA-512 hashes." },
    "password-gen": { name: "Password generator", desc: "Create strong custom passwords." },
    "encrypt-decrypt": { name: "Text encryption", desc: "Encrypt and decrypt text with AES-256-GCM." },
    "steganography": { name: "Steganography", desc: "Hide text in an image using LSB encoding." },
    "certificate-info": { name: "SSL certificate info", desc: "Check validity and details of an SSL certificate." },
    "password-strength": { name: "Password strength", desc: "Estimate entropy and crack time of a password." },
    "totp-generator": { name: "TOTP generator", desc: "Generate 2FA TOTP codes (RFC 6238) from a secret." },
    "password-breach-check": { name: "Password breach check", desc: "Verify whether a password leaked (HIBP k-anonymity)." },
    "email-breach-check": { name: "Email breach check", desc: "Check whether your email address appears in known data breaches." },
    "file-encryption": { name: "File encryption", desc: "Encrypt/decrypt a file with AES-256-GCM (Web Crypto)." },
    "token-generator": { name: "Token generator", desc: "Generate random tokens (length, character set)." },
    "percentage-calc": { name: "Percentage calculator", desc: "Quickly compute percentages, increase and decrease." },
    "loan-calc": { name: "Loan calculator", desc: "Calculate installments and an amortization schedule." },
    "unit-converter": { name: "Unit converter", desc: "Convert length, weight, temperature, volume and more." },
    "color-converter": { name: "Color converter", desc: "Convert between HEX, RGB, HSL and CMYK." },
    "number-base-converter": { name: "Number base", desc: "Convert between decimal, binary, octal and hexadecimal." },
    "bmi-calc": { name: "BMI calculator", desc: "Calculate body mass index and category." },
    "discount-calc": { name: "Discount calculator", desc: "Compute the price after a discount, even multiple discounts." },
    "vat-calc": { name: "VAT calculator", desc: "Convert an amount between ex-VAT and inc-VAT (CZ rates)." },
    "net-salary-calc": { name: "Net salary calculator", desc: "Estimate net salary from gross (CZ rates)." },
    "date-diff-calc": { name: "Date difference", desc: "Calculate the difference between two dates in days." },
    "compound-interest-calc": { name: "Compound interest", desc: "Compute the yield of compound interest." },
    "grade-average-calc": { name: "Grade average", desc: "Calculate a weighted grade average." },
    "fuel-consumption-calc": { name: "Fuel consumption", desc: "Convert between l/100 km and mpg." },
    "bmr-calc": { name: "BMR and calories", desc: "Basal metabolic rate and daily calorie intake." },
    "time-calc": { name: "Time calculator", desc: "Add and subtract time values." },
    "iban-converter": { name: "IBAN converter", desc: "Convert a Czech account number to IBAN and back." },
    "birth-number-validator": { name: "Birth number validator", desc: "Verify format and checksum of a Czech birth number." },
  },
  // Převodníky Word ⇄ PDF jsou plně lokalizované (src/lib/converter/i18n.ts); ostatní nástroje
  // v těchto jazycích zatím padají zpět na češtinu.
  de: {
    "pdf-to-word": { name: "PDF → Word", desc: "PDF in ein bearbeitbares Word-Dokument umwandeln: Absätze, Tabellen, Bilder, Kopfzeilen und OCR für Scans. Direkt im Browser." },
    "word-to-pdf": { name: "Word → PDF", desc: "Word-Dokument (.docx) in PDF umwandeln, mit Layout, Schriften und Tabellen; optional PDF/A. Direkt im Browser." },
  },
  es: {
    "pdf-to-word": { name: "PDF → Word", desc: "Convierta un PDF en un documento de Word editable: párrafos, tablas, imágenes, encabezados y OCR de escaneos. En su navegador." },
    "word-to-pdf": { name: "Word → PDF", desc: "Convierta un documento de Word (.docx) a PDF conservando diseño, fuentes y tablas; PDF/A opcional. En su navegador." },
  },
  uk: {
    "pdf-to-word": { name: "PDF → Word", desc: "Перетворіть PDF на редагований документ Word: абзаци, таблиці, зображення, колонтитули й OCR сканів. Прямо в браузері." },
    "word-to-pdf": { name: "Word → PDF", desc: "Перетворіть документ Word (.docx) на PDF зі збереженням вигляду, шрифтів і таблиць; за бажанням PDF/A. Прямо в браузері." },
  },
  fr: {
    "pdf-to-word": { name: "PDF → Word", desc: "Convertissez un PDF en document Word modifiable : paragraphes, tableaux, images, en-têtes et OCR des numérisations. Dans votre navigateur." },
    "word-to-pdf": { name: "Word → PDF", desc: "Convertissez un document Word (.docx) en PDF en conservant mise en page, polices et tableaux ; PDF/A en option. Dans votre navigateur." },
  },
  sk: {
    "pdf-to-word": { name: "PDF → Word", desc: "Prevedie PDF na upraviteľný dokument Word: odseky, tabuľky, obrázky, hlavičky aj OCR skenov. Priamo v prehliadači." },
    "word-to-pdf": { name: "Word → PDF", desc: "Prevedie dokument Word (.docx) na PDF so zachovaným vzhľadom, písmami a tabuľkami, voliteľne PDF/A. Priamo v prehliadači." },
  },
};

// ── i18n: hub UI řetězce (z vv-hub-i18n bloku) ──────────────────────────

export interface HubI18n {
  statuses: Partial<Record<ToolStatus, string>>;
  loc: Record<ProcessingLocation, string>;
  card_open: string;
  /* hero + vyhledávání */
  hero_badge_tag: string;
  hero_badge_text: string;
  hero_badge_query: string;
  hero_title: string;
  hero_rot_sr: string;
  hero_rot_words: readonly string[];
  rot_dots_label: string;
  rot_dot_aria: string;
  hero_lead: string;
  search_label: string;
  search_placeholder: string;
  search_clear: string;
  search_cta: string;
  suggestions_label: string;
  quick_empty: string;
  quick_more: string;
  quick_browse: string;
  stat_tools_label: string;
  hero_stats_categories: string;
  hero_stats_languages: string;
  /* sekce hubu */
  tiles_title: string;
  tiles_sub: string;
  popular_title: string;
  popular_sub: string;
  hero_pill_count: string;
  recent_title: string;
  recent_desc: string;
  catalog_title: string;
  catalog_sub: string;
  pill_all: string;
  adv_filters: string;
  filters_category: string;
  filters_processing: string;
  filters_status: string;
  filters_sort: string;
  filters_reset: string;
  processing_all: string;
  status_all: string;
  sort_relevance: string;
  sort_name: string;
  results_title: string;
  cancel_filter: string;
  show_all: string;
  show_less: string;
  empty_title: string;
  empty_desc: string;
  why_title: string;
  why1_h: string;
  why1_t: string;
  why2_h: string;
  why2_t: string;
  why3_h: string;
  why3_t: string;
  privacy_band_title: string;
  favorite_add: string;
  favorite_remove: string;
  cta_eyebrow: string;
  cta_title: string;
  cta_text: string;
  cta_btn: string;
  /* premium sekce ([CENA]/[X] % = záměrné placeholdery) */
  prem_title: string;
  prem_sub: string;
  prem_period_label: string;
  prem_month: string;
  prem_year: string;
  free_name: string;
  free_sub: string;
  free_perks: readonly string[];
  free_cta: string;
  pro_tag: string;
  pro_name: string;
  pro_sub: string;
  pro_price_placeholder: string;
  pro_price_placeholder_yearly: string;
  pro_unit_m: string;
  pro_unit_y: string;
  pro_save_placeholder: string;
  pro_perks: readonly string[];
  pro_cta: string;
  vevit_tag: string;
  vevit_name: string;
  vevit_sub: string;
  vevit_tiers_label: string;
  vevit_2m_free: string;
  vevit_everytool_perk: string;
  vevit_cta: string;
  vevit_platinum: string;
  unit_month: string;
  unit_year: string;
  prem_foot: string;
  /* konvertory */
  conv_video_title: string;
  conv_video_desc: string;
  conv_audio_title: string;
  conv_audio_desc: string;
  conv_docs_title: string;
  conv_docs_desc: string;
  conv_docs_pdfword: string;
  conv_docs_pdftxt: string;
  conv_docs_imgpdf: string;
  /* hlavička, patička, metadata */
  header_categories: string;
  header_login: string;
  header_login_title: string;
  footer_blurb: string;
  footer_categories: string;
  footer_everytool: string;
  footer_about: string;
  footer_premium: string;
  footer_studio: string;
  footer_websites: string;
  footer_contact: string;
  footer_copyright: string;
  footer_languages: string;
  doc_title: string;
  doc_description: string;
}

const HUB_CS: HubI18n = {
  statuses: { limited: "Omezeně dostupný", experimental: "Experimentální", coming_soon: "Připravujeme", broken: "Dočasně nefunkční", maintenance: "V údržbě" },
  loc: { client: "Lokálně", external_ai: "Přes AI", vevit_server: "Na serveru", external: "Třetí strana" },
  card_open: "Otevřít nástroj",
  hero_badge_tag: "NOVÉ",
  hero_badge_text: "PDF → Word nově i se skeny (OCR)",
  hero_badge_query: "pdf word",
  hero_title: "Každý nástroj, který potřebujete.",
  hero_rot_sr: "Zdarma, rychle, lokálně a bezpečně.",
  hero_rot_words: ["Zdarma.", "Rychle.", "Lokálně.", "Bezpečně."],
  rot_dots_label: "Přepínání hesel",
  rot_dot_aria: "Zobrazit „{word}“",
  hero_lead: "{tools} online nástrojů na PDF, obrázky, video, text i AI. Bez instalace a bez registrace. Většina běží přímo ve vašem prohlížeči, takže soubory zůstávají u vás.",
  search_label: "Hledat nástroj",
  search_placeholder: "Co chcete udělat? Třeba „komprese PDF“",
  search_clear: "Vymazat hledání",
  search_cta: "Hledat",
  suggestions_label: "Zkuste:",
  quick_empty: "Nic jsme nenašli. Zkuste třeba „pdf“, „heslo“ nebo „video“.",
  quick_more: "Zobrazit všech {count} výsledků v katalogu",
  quick_browse: "Prohlédnout všechny nástroje",
  stat_tools_label: "nástrojů",
  hero_stats_categories: "kategorií",
  hero_stats_languages: "jazyků",
  tiles_title: "S čím potřebujete pomoct?",
  tiles_sub: "Vyberte kategorii a my vám ukážeme všechno, co v ní umíme.",
  popular_title: "Začněte tady",
  popular_sub: "Šikovné nástroje na každý den. Jedno kliknutí a jdete na věc.",
  hero_pill_count: "{count} nástrojů",
  recent_title: "Kde jste skončili",
  recent_desc: "Uloženo jen ve vašem prohlížeči. Nikam se to neposílá a nepotřebuje to účet.",
  catalog_title: "Všechny nástroje",
  catalog_sub: "Filtrujte podle kategorie nebo hledejte výš. Každý nástroj je zdarma.",
  pill_all: "Vše",
  adv_filters: "Pokročilé filtry",
  filters_category: "Filtr kategorií",
  filters_processing: "Zpracování",
  filters_status: "Stav",
  filters_sort: "Řazení",
  filters_reset: "Zrušit filtry",
  processing_all: "Všechna místa",
  status_all: "Všechny stavy",
  sort_relevance: "Relevance",
  sort_name: "Název A–Z",
  results_title: "Výsledky pro „{q}“",
  cancel_filter: "Zrušit filtr",
  show_all: "Zobrazit všech {count}",
  show_less: "Zobrazit méně",
  empty_title: "Tohle zatím neumíme",
  empty_desc: "Zkuste jiné slovo, třeba „pdf“, „heslo“ nebo „video“. Nebo nám napište, jaký nástroj vám chybí.",
  why_title: "Proč lidi baví EveryTool",
  why1_h: "Soubory zůstávají u vás",
  why1_t: "Většina nástrojů pracuje přímo v prohlížeči. U každého vidíte, jestli se něco posílá na server.",
  why2_h: "Žádné čekání",
  why2_t: "Bez instalace a bez účtu. Otevřete nástroj, přetáhnete soubor a máte hotovo.",
  why3_h: "Česky a srozumitelně",
  why3_t: "Nástroje i nápověda v češtině a dalších šesti jazycích. Žádný technický žargon.",
  privacy_band_title: "Kde se vaše data zpracovávají",
  favorite_add: "Přidat do oblíbených",
  favorite_remove: "Odebrat z oblíbených",
  cta_eyebrow: "OD TVŮRCŮ Z VEVIT WEB STUDIA",
  cta_title: "Potřebujete web nebo aplikaci na míru?",
  cta_text: "EveryTool.cz navrhlo a postavilo VeVit web studio. Stejnou péči dáme i vašemu projektu.",
  cta_btn: "Poznat VeVit web studio",
  prem_title: "Chcete víc? Odemkněte Premium.",
  prem_sub: "Nástroje zůstávají zdarma pro všechny. Premium přidá vyšší limity, větší soubory a klid na práci.",
  prem_period_label: "Fakturační období",
  prem_month: "Měsíčně",
  prem_year: "Ročně",
  free_name: "Zdarma",
  free_sub: "Na každodenní práci, bez účtu",
  free_perks: [
    "Všech {tools} nástrojů",
    "Zpracování přímo v prohlížeči",
    "Základní denní limit AI nástrojů",
    "Soubory do běžné velikosti",
    "Bez reklam",
  ],
  free_cta: "Používat zdarma",
  pro_tag: "DOPORUČUJEME",
  pro_name: "Premium",
  pro_sub: "Pro ty, kdo s nástroji pracují denně",
  pro_price_placeholder: "130 Kč",
  pro_price_placeholder_yearly: "[CENA] Kč",
  pro_unit_m: "/ měsíc",
  pro_unit_y: "/ rok",
  pro_save_placeholder: "Ušetříte [X] %",
  pro_perks: [
    "Vše, co nabízí verze Zdarma",
    "200 AI dotazů denně",
    "Větší soubory a dávkové zpracování",
    "Oblíbené a historie na všech zařízeních",
    "Přednostní podpora",
  ],
  pro_cta: "Vyzkoušet Premium",
  vevit_tag: "CELÝ SVĚT VEVIT",
  vevit_name: "VeVit Premium",
  vevit_sub: "Jedno členství pro EveryTool, VeVit Edu, Store a další služby VeVit",
  vevit_tiers_label: "Úroveň VeVit Premium",
  vevit_2m_free: "2 měsíce zdarma",
  vevit_everytool_perk: "EveryTool Premium v ceně",
  vevit_cta: "Vybrat VeVit {tier}",
  vevit_platinum: "Školy a firmy: VeVit Platinum na domluvu →",
  unit_month: "/ měsíc",
  unit_year: "/ rok",
  prem_foot: "Ceny včetně DPH. Předplatné lze kdykoli zrušit v nastavení účtu.",
  conv_video_title: "Konverze videa",
  conv_video_desc: "MP4, WebM, MOV, MKV — komprese i změna formátu přímo v prohlížeči.",
  conv_audio_title: "Konverze audia",
  conv_audio_desc: "MP3, WAV, OGG, FLAC — převod, ořez i normalizace zvuku.",
  conv_docs_title: "Konverze dokumentů",
  conv_docs_desc: "PDF a obrázky do upravitelných formátů.",
  conv_docs_pdfword: "PDF → Word",
  conv_docs_pdftxt: "PDF → Text",
  conv_docs_imgpdf: "Obrázky → PDF",
  header_categories: "Kategorie",
  header_login: "Přihlásit se",
  header_login_title: "Přihlášení k účtu je volitelné, všechny nástroje fungují i bez něj.",
  footer_blurb: "{count} nástrojů na jednom místě. Vyrobeno s radostí ve VeVit web studiu.",
  footer_categories: "Kategorie",
  footer_everytool: "EveryTool",
  footer_about: "O projektu",
  footer_premium: "Premium",
  footer_studio: "VeVit web studio",
  footer_websites: "Weby na míru",
  footer_contact: "Kontakt",
  footer_copyright: "© 2026 EveryTool.cz by VeVit web studio",
  footer_languages: "Čeština · English · Deutsch · Español · Français · Slovenčina · Українська",
  doc_title: "EveryTool.cz – všechny nástroje na jednom místě",
  doc_description: "171 online nástrojů na PDF, obrázky, video, text i AI. Bez instalace a bez registrace. Většina běží přímo ve vašem prohlížeči, takže soubory zůstávají u vás.",
};

const HUB_EN: HubI18n = {
  statuses: { limited: "Limited availability", experimental: "Experimental", coming_soon: "Coming soon", broken: "Temporarily broken", maintenance: "Under maintenance" },
  loc: { client: "Local", external_ai: "Via AI", vevit_server: "On server", external: "Third party" },
  card_open: "Open tool",
  hero_badge_tag: "NEW",
  hero_badge_text: "PDF → Word now with scans too (OCR)",
  hero_badge_query: "pdf word",
  hero_title: "Every tool you need.",
  hero_rot_sr: "Free, fast, local and secure.",
  hero_rot_words: ["Free.", "Fast.", "Local.", "Secure."],
  rot_dots_label: "Switching slogans",
  rot_dot_aria: "Show “{word}”",
  hero_lead: "{tools} online tools for PDF, images, video, text and AI. No install, no sign-up. Most run right in your browser, so your files stay with you.",
  search_label: "Search tools",
  search_placeholder: "What do you want to do? Try “compress PDF”",
  search_clear: "Clear search",
  search_cta: "Search",
  suggestions_label: "Try:",
  quick_empty: "Nothing found. Try “pdf”, “password” or “video”.",
  quick_more: "Show all {count} results in the catalog",
  quick_browse: "Browse all tools",
  stat_tools_label: "tools",
  hero_stats_categories: "categories",
  hero_stats_languages: "languages",
  tiles_title: "What do you need help with?",
  tiles_sub: "Pick a category and we will show you everything we can do in it.",
  popular_title: "Start here",
  popular_sub: "Handy everyday tools. One click and you are off.",
  hero_pill_count: "{count} tools",
  recent_title: "Where you left off",
  recent_desc: "Saved only in your browser. Nothing is sent anywhere and no account is needed.",
  catalog_title: "All tools",
  catalog_sub: "Filter by category or search above. Every tool is free.",
  pill_all: "All",
  adv_filters: "Advanced filters",
  filters_category: "Category filter",
  filters_processing: "Processing",
  filters_status: "Status",
  filters_sort: "Sort",
  filters_reset: "Reset filters",
  processing_all: "All locations",
  status_all: "All statuses",
  sort_relevance: "Relevance",
  sort_name: "Name A–Z",
  results_title: "Results for “{q}”",
  cancel_filter: "Clear filter",
  show_all: "Show all {count}",
  show_less: "Show less",
  empty_title: "We cannot do that yet",
  empty_desc: "Try another word, like “pdf”, “password” or “video”. Or write to us about the tool you are missing.",
  why_title: "Why people enjoy EveryTool",
  why1_h: "Your files stay with you",
  why1_t: "Most tools work right in the browser. Each one shows whether anything is sent to a server.",
  why2_h: "No waiting",
  why2_t: "No install and no account. Open a tool, drop a file and you are done.",
  why3_h: "Clear and friendly",
  why3_t: "Tools and help in English and six other languages. No technical jargon.",
  privacy_band_title: "Where your data is processed",
  favorite_add: "Add to favorites",
  favorite_remove: "Remove from favorites",
  cta_eyebrow: "FROM THE MAKERS AT VEVIT WEB STUDIO",
  cta_title: "Need a custom website or app?",
  cta_text: "EveryTool.cz was designed and built by VeVit web studio. We will give your project the same care.",
  cta_btn: "Meet VeVit web studio",
  prem_title: "Want more? Unlock Premium.",
  prem_sub: "The tools stay free for everyone. Premium adds higher limits, bigger files and peace of mind.",
  prem_period_label: "Billing period",
  prem_month: "Monthly",
  prem_year: "Yearly",
  free_name: "Free",
  free_sub: "For everyday work, no account needed",
  free_perks: [
    "All {tools} tools",
    "Processing right in the browser",
    "Basic daily limit for AI tools",
    "Files up to a regular size",
    "No ads",
  ],
  free_cta: "Use for free",
  pro_tag: "RECOMMENDED",
  pro_name: "Premium",
  pro_sub: "For people who work with tools every day",
  pro_price_placeholder: "130 CZK",
  pro_price_placeholder_yearly: "[PRICE] CZK",
  pro_unit_m: "/ month",
  pro_unit_y: "/ year",
  pro_save_placeholder: "Save [X] %",
  pro_perks: [
    "Everything in the Free plan",
    "200 AI queries per day",
    "Bigger files and batch processing",
    "Favourites and history on all devices",
    "Priority support",
  ],
  pro_cta: "Try Premium",
  vevit_tag: "THE WHOLE VEVIT WORLD",
  vevit_name: "VeVit Premium",
  vevit_sub: "One membership for EveryTool, VeVit Edu, Store and other VeVit services",
  vevit_tiers_label: "VeVit Premium level",
  vevit_2m_free: "2 months free",
  vevit_everytool_perk: "EveryTool Premium included",
  vevit_cta: "Choose VeVit {tier}",
  vevit_platinum: "Schools and companies: VeVit Platinum on request →",
  unit_month: "/ month",
  unit_year: "/ year",
  prem_foot: "Prices include VAT. You can cancel the subscription anytime in account settings.",
  conv_video_title: "Video converter",
  conv_video_desc: "MP4, WebM, MOV, MKV — compress and convert right in the browser.",
  conv_audio_title: "Audio converter",
  conv_audio_desc: "MP3, WAV, OGG, FLAC — convert, trim and normalize audio.",
  conv_docs_title: "Document converter",
  conv_docs_desc: "PDF and images into editable formats.",
  conv_docs_pdfword: "PDF → Word",
  conv_docs_pdftxt: "PDF → Text",
  conv_docs_imgpdf: "Images → PDF",
  header_categories: "Categories",
  header_login: "Sign in",
  header_login_title: "An account is optional, all tools work without one.",
  footer_blurb: "{count} tools in one place. Made with joy at VeVit web studio.",
  footer_categories: "Categories",
  footer_everytool: "EveryTool",
  footer_about: "About",
  footer_premium: "Premium",
  footer_studio: "VeVit web studio",
  footer_websites: "Custom websites",
  footer_contact: "Contact",
  footer_copyright: "© 2026 EveryTool.cz by VeVit web studio",
  footer_languages: "Čeština · English · Deutsch · Español · Français · Slovenčina · Українська",
  doc_title: "EveryTool.cz – all tools in one place",
  doc_description: "171 online tools for PDF, images, video, text and AI. No install, no sign-up. Most run right in your browser, so your files stay with you.",
};

export const HUB_I18N: Record<Locale, HubI18n> = {
  cs: HUB_CS, en: HUB_EN, de: HUB_CS, es: HUB_CS, uk: HUB_CS, fr: HUB_CS, sk: HUB_CS,
};

// ── i18n: tool-ui runtime řetězce (z #tool-ui-i18n bloku) ──────────────

export interface ToolUiI18n {
  copied: string; copy_failed: string; copy: string;
  invalid_type: string; file_too_large: string;
  remove_file: string; move_up: string; move_down: string;
  load_failed: string;
  state_idle: string; state_ready: string; state_processing: string; state_success: string; state_error: string;
  cancel: string; retry: string; reset: string;
  download: string; result_ready: string;
  text_meta: string; file_format: string;
  maintenance_note: string;
  swap_direction: string;
}

const TOOL_UI_CS: ToolUiI18n = {
  copied: "Zkopírováno do schránky", copy_failed: "Kopírování selhalo", copy: "Kopírovat",
  invalid_type: "Některé soubory byly přeskočeny: tento typ není podporovaný.",
  file_too_large: "Soubor {name} je větší než povolený limit {limit}.",
  remove_file: "Odebrat {name}", move_up: "Přesunout {name} výše", move_down: "Přesunout {name} níže",
  load_failed: "Potřebnou část nástroje se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.",
  state_idle: "Čeká na vstup", state_ready: "Připraveno ke zpracování", state_processing: "Probíhá zpracování",
  state_success: "Výsledek je připraven", state_error: "Zpracování se nezdařilo",
  cancel: "Zrušit", retry: "Zkusit znovu", reset: "Začít znovu",
  download: "Stáhnout výsledek", result_ready: "Hotovo, výsledek je připraven",
  text_meta: "{characters} znaků · {lines} řádků", file_format: "{type} · {size}",
  maintenance_note: "Nástroj je dočasně v údržbě a nelze ho použít. Zkuste to prosím později.",
  swap_direction: "Obrátit převod",
};

const TOOL_UI_EN: ToolUiI18n = {
  copied: "Copied to clipboard", copy_failed: "Copy failed", copy: "Copy",
  invalid_type: "Some files were skipped: this type is not supported.",
  file_too_large: "File {name} is larger than the allowed limit {limit}.",
  remove_file: "Remove {name}", move_up: "Move {name} up", move_down: "Move {name} down",
  load_failed: "A required part of the tool could not be loaded. Check your connection and try again.",
  state_idle: "Waiting for input", state_ready: "Ready to process", state_processing: "Processing",
  state_success: "Result is ready", state_error: "Processing failed",
  cancel: "Cancel", retry: "Try again", reset: "Start over",
  download: "Download result", result_ready: "Done, result is ready",
  text_meta: "{characters} characters · {lines} lines", file_format: "{type} · {size}",
  maintenance_note: "This tool is temporarily under maintenance and cannot be used. Please try again later.",
  swap_direction: "Reverse conversion",
};

export const TOOL_UI_I18N: Record<Locale, ToolUiI18n> = {
  cs: TOOL_UI_CS, en: TOOL_UI_EN, de: TOOL_UI_CS, es: TOOL_UI_CS, uk: TOOL_UI_CS, fr: TOOL_UI_CS, sk: TOOL_UI_CS,
};

// ── Stavové labely (pro badge Stav v dropdownu a na kartách) ────────────
export const STATUS_LABELS: Record<Locale, Record<ToolStatus, string>> = {
  cs: { working: "Dostupné", limited: "Omezeně dostupné", experimental: "Experimentální", coming_soon: "Připravujeme", broken: "Nefunkční", maintenance: "V údržbě" },
  en: { working: "Available", limited: "Limited", experimental: "Experimental", coming_soon: "Coming soon", broken: "Broken", maintenance: "Under maintenance" },
  de: { working: "Verfügbar", limited: "Eingeschränkt", experimental: "Experimentell", coming_soon: "In Vorbereitung", broken: "Defekt", maintenance: "In Wartung" },
  es: { working: "Disponible", limited: "Limitado", experimental: "Experimental", coming_soon: "Próximamente", broken: "Roto", maintenance: "En mantenimiento" },
  uk: { working: "Доступний", limited: "Обмежений", experimental: "Експериментальний", coming_soon: "Очікується", broken: "Зламаний", maintenance: "На обслуговуванні" },
  fr: { working: "Disponible", limited: "Limité", experimental: "Expérimental", coming_soon: "Bientôt", broken: "Cassé", maintenance: "En maintenance" },
  sk: { working: "Dostupné", limited: "Obmedzene dostupné", experimental: "Experimentálne", coming_soon: "Pripravujeme", broken: "Nefunkčné", maintenance: "V údržbe" },
};

export const SUPPORTED_LOCALES: readonly Locale[] = ["cs", "en", "de", "es", "uk", "fr", "sk"];

// ── Pomocné funkce ──────────────────────────────────────────────────────

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolsByCategory(): Record<Category, Tool[]> {
  const map = {} as Record<Category, Tool[]>;
  for (const c of CATEGORY_ORDER) map[c] = [];
  for (const t of TOOLS) map[t.category].push(t);
  return map;
}

export function newTools(limit = 8): Tool[] {
  const out: Tool[] = [];
  for (const t of TOOLS) if (t.new) { out.push(t); if (out.length >= limit) break; }
  return out;
}

export function clientCount(): number {
  return TOOLS.reduce((n, t) => (t.processing_location === "client" ? n + 1 : n), 0);
}

/** Lokalizovaný name/description nástroje (fallback na cs). */
export function localizeTool(tool: Tool, locale: Locale): { name: string; description: string } {
  const override = TOOL_I18N[locale]?.[tool.slug];
  return {
    name: override?.name ?? tool.name,
    description: override?.desc ?? tool.description,
  };
}

/** Opačný směr převodu (šipka v nadpisu nástroje ho otevře). Jen dvojice, které opravdu existují. */
const REVERSE_PAIRS: [string, string][] = [
  ["pdf-to-word", "word-to-pdf"], ["pdf-to-excel", "excel-to-pdf"], ["pdf-to-pptx", "pptx-to-pdf"],
  ["pdf-to-images", "images-to-pdf"], ["csv-to-excel", "excel-to-csv"], ["excel-to-xml", "xml-to-excel"],
  ["xml-to-json", "json-to-xml"],
];
const REVERSE_TOOL: Record<string, string> = Object.fromEntries(REVERSE_PAIRS.flatMap(([a, b]) => [[a, b], [b, a]]));
export const reverseSlug = (slug: string): string | undefined => REVERSE_TOOL[slug];

/** Lokalizovaný label kategorie (fallback na cs). */
export function categoryLabel(cat: Category, locale: Locale): string {
  // override pro ne-cs jazyky by mohl být v TOOL_I18N, ale kategorie jsou krátké
  // a v registry.php se překládají jen přes lang soubory. Zde fallback na cs.
  if (locale === "en") {
    const en: Record<Category, string> = { pdf: "PDF", image: "Images", media: "Media", text: "Text", ai: "AI", dev: "Dev", security: "Security", calc: "Calculators" };
    return en[cat];
  }
  return CATEGORY_LABELS[cat];
}

export function categoryDesc(cat: Category, locale: Locale): string {
  // Popisy kategorií jsou zatím pouze cs (stejné jako v registry.php).
  // Lokalizace může být doplněna pozdějšími batch agenty přes override slovník.
  void locale;
  return CATEGORY_DESCRIPTIONS[cat];
}

export function locationMeta(loc: ProcessingLocation, locale: Locale): LocationMeta {
  const base = LOCATION_META[loc];
  if (locale === "en") {
    const en: Record<ProcessingLocation, LocationMeta> = {
      client: { label: "Local", icon: "ShieldCheck", tone: "local", title: "The file is processed in your browser and never leaves this computer." },
      vevit_server: { label: "On server", icon: "Server", tone: "server", title: "The file is processed on the server and deleted after completion." },
      external_ai: { label: "Via AI", icon: "Sparkles", tone: "ai", title: "Processing runs through an AI model." },
      external: { label: "Third party", icon: "Globe", tone: "server", title: "The tool talks directly to a selected external service (e.g. breach check sends only a 5-character hash prefix)." },
    };
    return en[loc];
  }
  return base;
}

export function statusLabel(status: ToolStatus, locale: Locale): string {
  return STATUS_LABELS[locale]?.[status] ?? STATUS_LABELS.cs[status];
}

/** Formátuje řetězec s {proměnnými} placeholdery. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}