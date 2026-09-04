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
export type ProcessingLocation = "client" | "vevit_server" | "external_ai";
export type ToolStatus = "working" | "limited" | "experimental" | "coming_soon" | "unavailable_on_wedos" | "broken";
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
  pdf: "#f59e0b",
  image: "#8b5cf6",
  media: "#ec4899",
  text: "#6b7280",
  ai: "#0ea5e9",
  dev: "#06b6d4",
  security: "#10b981",
  calc: "#ef4444",
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
  media: "Práce s videem a zvukem — konverze, komprese, střih.",
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
};

// ── Raw TOOLS pole (z registry.php TOOLS) ───────────────────────────────
// Tuple: [slug, name, desc, cat, loc, icon, new, note?]
// loc: 'client' | 'server' | 'ai' (z registry.php, před kanonizací).

type RawLoc = "client" | "server" | "ai";
type RawTool = [string, string, string, Category, RawLoc, string, boolean, string?];

const FFMPEG_TOOLS = new Set([
  "audio-convert", "audio-trim-normalize", "video-convert", "video-compress",
  "video-trim", "video-extract-audio", "video-to-gif", "video-merge", "video-target-size",
]);

const RAW_TOOLS: RawTool[] = [
  // ── PDF ────────────────────────────────────────────────────────────────
  ["pdf-merge", "Sloučení PDF", "Sloučí více PDF souborů do jednoho.", "pdf", "client", "Files", false],
  ["pdf-split", "Rozdělení PDF", "Rozdělí PDF na jednotlivé stránky.", "pdf", "client", "Scissors", false],
  ["pdf-compress", "Komprese PDF", "Zmenší velikost PDF souboru.", "pdf", "client", "Shrink", false],
  ["pdf-to-word", "PDF → Word", "Vytáhne text z PDF a sestaví .docx.", "pdf", "client", "FileText", false],
  ["html-to-pdf", "HTML → PDF", "Převede HTML kód na PDF (html2canvas+jsPDF).", "pdf", "client", "FileCode", false],
  ["invoice-gen", "Faktura generátor", "Generujte profesionální faktury s QR kódem.", "pdf", "client", "Receipt", true],
  ["pdf-to-images", "PDF → obrázky", "Převede stránky PDF na obrázky (PNG/JPEG ZIP).", "pdf", "client", "ImagePlus", true],
  ["images-to-pdf", "Obrázky → PDF", "Spojí více obrázků do jednoho PDF.", "pdf", "client", "Files", true],
  ["pdf-rotate", "Otočení PDF", "Otočí nebo překlopí stránky PDF.", "pdf", "client", "RotateCw", true],
  ["pdf-organize", "Organizace PDF", "Odstraňte nebo přerovnejte stránky PDF.", "pdf", "client", "Maximize", true],
  ["pdf-watermark", "Vodoznak PDF", "Přidá textový vodoznak do PDF.", "pdf", "client", "Stamp", true],
  ["pdf-page-numbers", "Číslování stránek", "Přidá čísla stránek do PDF.", "pdf", "client", "Hash", true],
  ["pdf-extract-text", "Extrakce textu PDF", "Vytáhne text z PDF (pdf.js).", "pdf", "client", "AlignLeft", true],
  ["pdf-password", "Ochrana PDF heslem", "Nastaví nebo odstraní heslo PDF (qpdf).", "pdf", "server", "FileKey", false, "Tento nástroj vyžaduje VPS / shell_exec (nástroj qpdf). Na sdíleném hostingu jej provozovat nelze."],

  // ── Obrázky ────────────────────────────────────────────────────────────
  ["img-compress", "Komprese obrázku", "Zmenšete obrázek přes canvas (kvalita, JPEG/WebP).", "image", "client", "Image", false],
  ["bg-remover", "Odstranit pozadí", "AI odstranění pozadí z fotografií (ONNX MODNet).", "image", "ai", "Eraser", true],
  ["img-upscaler", "Zvětšení kvality", "Zvětší rozlišení obrázku (2×/3×/4×) přes canvas.", "image", "client", "Maximize", true],
  ["gif-maker", "Tvůrce GIFu", "Vytvořte animovaný GIF ze sekvence obrázků.", "image", "client", "Film", true],
  ["screenshot-tool", "Screenshot URL", "Pořiďte screenshot libovolné webové stránky.", "image", "server", "Camera", true, "Tento nástroj vyžaduje VPS / shell_exec (headless Chromium). Na sdíleném hostingu jej provozovat nelze."],
  ["image-convert", "Převod formátu", "Převeďte PNG/JPG/WebP/BMP přes canvas.", "image", "client", "Repeat", true],
  ["image-crop", "Oříznutí obrázku", "Interaktivně ořízněte obrázek v canvasu.", "image", "client", "Crop", true],
  ["image-rotate-flip", "Otočení/Překlopení", "Otočte nebo překlopte obrázek (90/180/270/flip).", "image", "client", "RotateCw", true],
  ["image-filters", "Filtry obrázku", "Grayscale, sepia, jas, kontrast, saturace.", "image", "client", "SlidersHorizontal", true],
  ["image-watermark", "Vodoznak", "Přidejte textový nebo obrázkový vodoznak.", "image", "client", "Stamp", true],
  ["image-exif", "EXIF metadata", "Prohlížejte a odstraňujte EXIF (vč. GPS).", "image", "client", "ScanLine", true],
  ["image-collage", "Koláž obrázků", "Spojte více obrázků do koláže (různá rozvržení).", "image", "client", "Images", true],
  ["favicon-generator", "Favicon generátor", "Vygeneruje favicony (PNG více velikostí + ICO).", "image", "client", "Globe", true],
  ["meme-generator", "Meme generátor", "Vytvořte meme s horním/dolním textem (Impact).", "image", "client", "Laugh", true],

  // ── Média ──────────────────────────────────────────────────────────────
  ["video-convert", "Konverze videa", "Přeďte video mezi formáty MP4, WebM (ffmpeg.wasm).", "media", "client", "Video", false],
  ["video-compress", "Komprese videa", "Zmenší velikost videa (ffmpeg.wasm, nastavitelná kvalita).", "media", "client", "Shrink", false],
  ["video-trim", "Ořez videa", "Vyberte část videa a odstraňte zbytek (ffmpeg.wasm).", "media", "client", "Scissors", false],
  ["audio-convert", "Konverze audia", "Přeďte audio mezi MP3/WAV/OGG/FLAC (ffmpeg.wasm).", "media", "client", "Music", false],
  ["video-thumbnail", "Náhled videa", "Vygeneruje náhled/snímek z videa (bez ffmpeg).", "media", "client", "Camera", true],
  ["audio-waveform", "Křivka audia", "Vykreslí křivku hlasitosti audia (Web Audio API).", "media", "client", "Volume2", true],
  ["video-extract-audio", "Extrakce audia", "Vytáhne zvukovou stopu z videa (ffmpeg.wasm).", "media", "client", "Music", true],
  ["video-to-gif", "Video → GIF", "Vytvoří animovaný GIF z videa (ffmpeg.wasm).", "media", "client", "Film", true],
  ["video-merge", "Spojení videí", "Spojí více videí (stejný kodek/rozlišení, ffmpeg.wasm).", "media", "client", "Plus", true],
  ["video-target-size", "Cílová velikost", "Dopočítá bitrate pro cílovou velikost videa.", "media", "client", "Scale", true],
  ["audio-trim-normalize", "Ořez+normalizace audia", "Ořízne a normalizuje hlasitost audia.", "media", "client", "SlidersHorizontal", true],

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

  // ── AI ─────────────────────────────────────────────────────────────────
  ["ai-chat", "AI asistent", "Chatujte s AI asistentem pro různé úkoly.", "ai", "ai", "MessageSquare", false],
  ["ai-vision", "AI analýza obrázku", "Popište a analyzujte obsah obrázku pomocí AI.", "ai", "ai", "Eye", false],
  ["ai-seo", "SEO meta generátor", "Generujte SEO titulky a popisky automaticky.", "ai", "ai", "Search", true],
  ["ai-image-gen", "AI generátor obrázku", "Vytvořte unikátní obrázky z textového popisu.", "ai", "ai", "ImagePlus", true, "Generování obrázků vyžaduje další infrastrukturu (Stable Diffusion / ComfyUI), kterou Ollama neposkytuje. Nástroj je v přípravě."],
  ["ai-sql-gen", "AI generátor SQL", "Převeďte přirozený jazyk na SQL dotazy.", "ai", "ai", "Database", true],
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

  // ── Bezpečnost ─────────────────────────────────────────────────────────
  ["hash-gen", "Hash generátor", "Generujte MD5, SHA-256, SHA-512 hashe.", "security", "client", "Hash", false],
  ["password-gen", "Generátor hesel", "Vytvářejte bezpečná hesla na míru.", "security", "client", "Lock", false],
  ["encrypt-decrypt", "Šifrování textu", "Zašifrujte a dešifrujte text pomocí AES-256-GCM.", "security", "client", "Shield", false],
  ["steganography", "Steganografie", "Skryjte text v obrázku pomocí LSB encoding.", "security", "client", "EyeOff", true],
  ["certificate-info", "SSL certifikát info", "Zkontrolujte platnost a detaily SSL certifikátu.", "security", "server", "GlobeLock", true],
  ["password-strength", "Síla hesla", "Odhadněte entropii a dobu prolomení hesla.", "security", "client", "ShieldCheck", true],
  ["totp-generator", "TOTP generátor", "Vygenerujte 2FA TOTP kódy (RFC 6238) z tajemství.", "security", "client", "Timer", true],
  ["password-breach-check", "Kontrola úniku hesla", "Ověří, jestli heslo uniklo (HIBP k-anonymity).", "security", "client", "Fingerprint", true],
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
];

// ── Kanonizace (port canonical_tool + tool_policy_overrides) ────────────

function canonicalize(raw: RawTool): Tool {
  const [slug, name, description, category, loc, icon, isNew, note] = raw;
  const processing_location: ProcessingLocation =
    loc === "server" ? "vevit_server" : loc === "ai" ? "external_ai" : "client";

  let status: ToolStatus = loc === "ai" ? "limited" : "working";
  if (FFMPEG_TOOLS.has(slug)) status = "limited";
  if (slug === "pdf-password" || slug === "screenshot-tool") status = "unavailable_on_wedos";
  if (slug === "ai-image-gen") status = "coming_soon";

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

export const TOOLS: readonly Tool[] = RAW_TOOLS.map(canonicalize);

// ── Překlady názvů/descriptions (override nad cs v TOOLS) ───────────────
// Klíč = slug, hodnota = { name?, desc? } pro daný jazyk. Chybějící fallback na cs.
// Zdroj: tools/lang/<lang>.php (tool.<slug>.name / .desc).
export const TOOL_I18N: Partial<Record<Locale, Record<string, { name?: string; desc?: string }>>> = {
  en: {
    "pdf-merge": { name: "Merge PDF", desc: "Merge multiple PDF files into one." },
    "pdf-split": { name: "Split PDF", desc: "Split a PDF into individual pages." },
    "pdf-compress": { name: "Compress PDF", desc: "Reduce the size of a PDF file." },
    "pdf-to-word": { name: "PDF → Word", desc: "Extract text from PDF and build a .docx." },
    "html-to-pdf": { name: "HTML → PDF", desc: "Convert HTML code to PDF (html2canvas+jsPDF)." },
    "invoice-gen": { name: "Invoice generator", desc: "Generate professional invoices with a QR code." },
    "pdf-to-images": { name: "PDF → images", desc: "Convert PDF pages to images (PNG/JPEG ZIP)." },
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
    "video-trim": { name: "Video trim", desc: "Select a portion of video and remove the rest (ffmpeg.wasm)." },
    "audio-convert": { name: "Audio converter", desc: "Convert audio between MP3/WAV/OGG/FLAC (ffmpeg.wasm)." },
    "video-thumbnail": { name: "Video thumbnail", desc: "Generate a thumbnail/frame from video (no ffmpeg)." },
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
};

// ── i18n: hub UI řetězce (z vv-hub-i18n bloku) ──────────────────────────

export interface HubI18n {
  statuses: Partial<Record<ToolStatus, string>>;
  loc: Record<ProcessingLocation, string>;
  badge_new: string;
  card_open: string;
  results_title: string;
  results_count: string;
  results_title_empty: string;
  search_placeholder: string;
  filters_category: string;
  filters_processing: string;
  filters_status: string;
  filters_sort: string;
  filters_new_only: string;
  filters_reset: string;
  category_all: string;
  processing_all: string;
  status_all: string;
  sort_relevance: string;
  sort_name: string;
  sort_newest: string;
  section_newest_title: string;
  section_newest_desc: string;
  hero_title_a: string;
  hero_title_b: string;
  hero_title_c: string;
  hero_subtitle: string;
  hero_pill_count: string;
  hero_pill_local: string;
  hero_pill_free: string;
  hero_stats_local: string;
  hero_stats_categories: string;
  hero_stats_noreg: string;
  empty_title: string;
  empty_desc: string;
  loading: string;
  error: string;
  doc_title: string;
  doc_description: string;
  header_categories: string;
  header_newest: string;
  header_login: string;
  header_login_title: string;
  footer_back: string;
  footer_privacy: string;
  footer_copyright: string;
}

const HUB_CS: HubI18n = {
  statuses: { limited: "Omezeně dostupný", experimental: "Experimentální", coming_soon: "Připravujeme", unavailable_on_wedos: "Nedostupné na WEDOS", broken: "Dočasně nefunkční" },
  loc: { client: "Lokálně", external_ai: "Přes AI", vevit_server: "Na serveru" },
  badge_new: "NOVÉ",
  card_open: "Otevřít →",
  results_title: "{count} výsledků pro „{q}“",
  results_count: "{count} výsledků",
  results_title_empty: "Žádné výsledky",
  search_placeholder: "Hledat nástroj... (např. 'json', 'pdf', 'hash')",
  filters_category: "Kategorie",
  filters_processing: "Zpracování",
  filters_status: "Stav",
  filters_sort: "Řazení",
  filters_new_only: "Jen nové nástroje",
  filters_reset: "Zrušit filtry",
  category_all: "Všechny kategorie",
  processing_all: "Všechna místa",
  status_all: "Všechny stavy",
  sort_relevance: "Relevance",
  sort_name: "Název A–Z",
  sort_newest: "Nejnovější",
  section_newest_title: "Nejnovější nástroje",
  section_newest_desc: "Čerstvě přidané nástroje, které ještě nemusíte znát.",
  hero_title_a: "práci",
  hero_title_b: " & ",
  hero_title_c: "každý den.",
  hero_subtitle: "PDF, obrázky, video, text, AI i kalkulačky. Většinu souborů zpracujeme přímo ve vašem prohlížeči — bez nahrávání na server.",
  hero_pill_count: "{count} nástrojů",
  hero_pill_local: "Zpracováno lokálně",
  hero_pill_free: "Zdarma & bez registrace",
  hero_stats_local: "běží lokálně",
  hero_stats_categories: "kategorií",
  hero_stats_noreg: "0 nucených registrací",
  empty_title: "Žádný nástroj neodpovídá hledání.",
  empty_desc: "Zkuste jiné klíčové slovo.",
  loading: "Načítám vyhledávání…",
  error: "Hledání se nepodařilo načíst. Kategorie níže zůstávají dostupné.",
  doc_title: "VeVit Tools — Nástroje pro vaši práci",
  doc_description: "Sada nástrojů pro PDF, obrázky, média, text, AI, vývoj, bezpečnost i kalkulačky. Většinu souborů zpracujeme lokálně v prohlížeči, bez nahrávání na server.",
  header_categories: "Kategorie",
  header_newest: "Nejnovější",
  header_login: "Přihlásit se",
  header_login_title: "Přihlášení k účtu VeVit je volitelné — všechny nástroje fungují i bez něj.",
  footer_back: "Zpět na VeVit.cz",
  footer_privacy: "Vše zpracováno lokálně v prohlížeči",
  footer_copyright: "© 2026 VeVit Tools.",
};

const HUB_EN: HubI18n = {
  statuses: { limited: "Limited availability", experimental: "Experimental", coming_soon: "Coming soon", unavailable_on_wedos: "Unavailable on WEDOS", broken: "Temporarily broken" },
  loc: { client: "Local", external_ai: "Via AI", vevit_server: "On server" },
  badge_new: "NEW",
  card_open: "Open →",
  results_title: "{count} results for “{q}”",
  results_count: "{count} results",
  results_title_empty: "No results",
  search_placeholder: "Search tools... (e.g. 'json', 'pdf', 'hash')",
  filters_category: "Category",
  filters_processing: "Processing",
  filters_status: "Status",
  filters_sort: "Sort",
  filters_new_only: "New tools only",
  filters_reset: "Reset filters",
  category_all: "All categories",
  processing_all: "All locations",
  status_all: "All statuses",
  sort_relevance: "Relevance",
  sort_name: "Name A–Z",
  sort_newest: "Newest",
  section_newest_title: "Newest tools",
  section_newest_desc: "Freshly added tools you may not know yet.",
  hero_title_a: "work",
  hero_title_b: " & ",
  hero_title_c: "every day.",
  hero_subtitle: "PDF, images, video, text, AI and calculators. Most files are processed right in your browser — no upload to a server.",
  hero_pill_count: "{count} tools",
  hero_pill_local: "Processed locally",
  hero_pill_free: "Free & no sign-up",
  hero_stats_local: "run locally",
  hero_stats_categories: "categories",
  hero_stats_noreg: "0 forced sign-ups",
  empty_title: "No tool matches your search.",
  empty_desc: "Try a different keyword.",
  loading: "Loading search…",
  error: "Search could not be loaded. Categories below remain available.",
  doc_title: "VeVit Tools — Tools for your work",
  doc_description: "A set of tools for PDF, images, media, text, AI, development, security and calculators. Most files are processed locally in the browser, without uploading to a server.",
  header_categories: "Categories",
  header_newest: "Newest",
  header_login: "Sign in",
  header_login_title: "A VeVit account is optional — all tools work without one.",
  footer_back: "Back to VeVit.cz",
  footer_privacy: "Everything processed locally in the browser",
  footer_copyright: "© 2026 VeVit Tools.",
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
  download: "Stáhnout výsledek", result_ready: "Hotovo — výsledek je připraven",
  text_meta: "{characters} znaků · {lines} řádků", file_format: "{type} · {size}",
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
  download: "Download result", result_ready: "Done — result is ready",
  text_meta: "{characters} characters · {lines} lines", file_format: "{type} · {size}",
};

export const TOOL_UI_I18N: Record<Locale, ToolUiI18n> = {
  cs: TOOL_UI_CS, en: TOOL_UI_EN, de: TOOL_UI_CS, es: TOOL_UI_CS, uk: TOOL_UI_CS, fr: TOOL_UI_CS, sk: TOOL_UI_CS,
};

// ── Stavové labely (pro badge Stav v dropdownu a na kartách) ────────────
export const STATUS_LABELS: Record<Locale, Record<ToolStatus, string>> = {
  cs: { working: "Dostupné", limited: "Omezeně dostupné", experimental: "Experimentální", coming_soon: "Připravujeme", unavailable_on_wedos: "Nedostupné na WEDOS", broken: "Nefunkční" },
  en: { working: "Available", limited: "Limited", experimental: "Experimental", coming_soon: "Coming soon", unavailable_on_wedos: "Unavailable on WEDOS", broken: "Broken" },
  de: { working: "Verfügbar", limited: "Eingeschränkt", experimental: "Experimentell", coming_soon: "In Vorbereitung", unavailable_on_wedos: "Nicht auf WEDOS", broken: "Defekt" },
  es: { working: "Disponible", limited: "Limitado", experimental: "Experimental", coming_soon: "Próximamente", unavailable_on_wedos: "No en WEDOS", broken: "Roto" },
  uk: { working: "Доступний", limited: "Обмежений", experimental: "Експериментальний", coming_soon: "Очікується", unavailable_on_wedos: "Недоступно на WEDOS", broken: "Зламаний" },
  fr: { working: "Disponible", limited: "Limité", experimental: "Expérimental", coming_soon: "Bientôt", unavailable_on_wedos: "Indisponible sur WEDOS", broken: "Cassé" },
  sk: { working: "Dostupné", limited: "Obmedzene dostupné", experimental: "Experimentálne", coming_soon: "Pripravujeme", unavailable_on_wedos: "Nedostupné na WEDOS", broken: "Nefunkčné" },
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