<?php
// Konfigurace webu. Lze přepsat proměnnými prostředí.

// ── Hostingová rozhodnutí (Fáze 4) ──────────────────────────────────────────
// Cíl: sdílený Wedos, BEZ shell_exec a bez možnosti instalovat binárky.
// Důsledky pro jednotlivé serverové nástroje:
//  * ssl-checker (certificate-info): feasible na sdíleném hostingu přes
//    stream_context + openssl_x509_parse (PHP openssl rozšíření, žádný shell).
//    Implementováno (Dávka 9), loc = server.
//  * html-to-pdf: přesunuto na client-side (html2canvas + jsPDF), viz Dávka 8.
//    Serverová varianta (Dompdf/Composer) by vyžadovala shell/knihovny.
//  * pdf-to-word: přesunuto na client-side (pdf.js + minimální OOXML .docx),
//    viz Dávka 8. Serverová PHPWord není dostupná.
//  * screenshot-tool: PLACEHOLDER — vyžaduje VPS / shell_exec (headless
//    Chromium). Na sdíleném hostingu neproveditelné; v UI je česká poznámka.
//  * pdf-password: PLACEHOLDER — vyžaduje VPS / shell_exec (qpdf). Na sdíleném
//    hostingu neproveditelné; v UI je česká poznámka.
// Vše ostatní běží čistě client-side (HTML/CSS/vanilla JS + Web Crypto /
// canvas / pdf.js / pdf-lib / ffmpeg.wasm / onnxruntime-web) nebo přes AI proxy
// k lokální Ollamě — žádný build, žádný framework, žádné Node.js.

// URL lokálního Ollama serveru (viz https://ollama.com). AI asistent volá tento
// proxy endpoint (api/ai/ollama.php), který předává dotaz na Ollamu a streamuje
// odpověď jako NDJSON.
const OLLAMA_URL = 'http://localhost:11434';

// Výchozí model AI asistenta.
const OLLAMA_MODEL = 'llama3.2';

// Vrátí hodnotu z prostředí nebo výchozí konstantu.
function env(string $key, string $default = ''): string {
    $v = getenv($key);
    return ($v === false || $v === '') ? $default : $v;
}

function ollama_url(): string {
    return env('OLLAMA_URL', OLLAMA_URL);
}

function ollama_model(): string {
    return env('OLLAMA_MODEL', OLLAMA_MODEL);
}