<?php
// Proxy endpoint AI asistenta — předá prompt lokální Ollamě a streamuje odpověď
// jako NDJSON (řádek po řádku JSON objekty), přesně tak, jak očekává klient (ai-chat.js).
//
// Tento serverový proxy existuje z důvodu same-origin + CORS: prohlížeč nemůže volat
// Ollamu (localhost:11434) přímo z HTTPS stránky (mixed content). Veškeré zpracování
// zůstává na serveru/lokálně — žádná data se nikam neodesílají.
//
// ── Hardening (Fáze 0) ──────────────────────────────────────────────────────
//  * Délkový limit vstupu (AI_MAX_PROMPT_CHARS) — ochrana před zneužitím a přetížením.
//  * Naivní IP rate-limiting (souborový counter s časovým oknem v sys_get_temp_dir,
//    tedy MIMO web root — není potřeba .htaccess). Pokud adresář není zapisovatelný,
//    rate-limiting se vypne (funkčnost zůstává).
//  * System prompt se nepřijímá od klienta. Klient posílá `tool` (identifikátor
//    nástroje) + `prompt`; proxy si system prompt vyhledá v includes/ai_prompts.php
//    a předá ho Ollamě. Tím nelze z prohlížeče přepsat instrukci držící model na uzdě.

require_once __DIR__ . '/../../includes/config.php';
require_once __DIR__ . '/../../includes/ai_prompts.php';
require_once __DIR__ . '/../../includes/request-rate-limit.php';

// ── Limity ─────────────────────────────────────────────────────────────────
const AI_MAX_PROMPT_CHARS = 20000;   // maximální délka uživatelského vstupu
const AI_RATE_WINDOW      = 60;      // délka časového okna (sekundy)
const AI_RATE_MAX         = 30;      // max. požadavků na IP v okně
const AI_MAX_IMAGES       = 4;       // max. počet obrázků na požadavek (vision)
const AI_MAX_IMAGE_BYTES  = 8 * 1024 * 1024; // max. 8 MB na obrázek (base64)

// ── Pomocné: JSON odpověď s HTTP status kódem ──────────────────────────────
function fail(int $code, string $msg): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['message' => $msg]);
  exit;
}

// ── IP klienta (neověřujeme XFF — na sdíleném hostingu stačí REMOTE_ADDR,
//    a nechceme, aby si útočník padělaným XFF obešel rate-limit). ─────────────
// ── Jen POST. ──────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Pouze POST.');

// ── Přečti tělo požadavku. ──────────────────────────────────────────────────
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) fail(400, 'Neplatný JSON v těle požadavku.');

$prompt = trim((string)($body['prompt'] ?? ''));
if (array_key_exists('model', $body)) fail(400, 'Model vybírá server; klient jej nemůže měnit.');
$stream = isset($body['stream']) ? (bool)$body['stream'] : true;
$tool   = trim((string)($body['tool'] ?? ''));

// ── Volitelné obrázky (vision nástroje). Base64 bez data URL prefixu. ──────────
$images = [];
if (isset($body['images']) && is_array($body['images'])) {
  // Jen vision nástroj smí posílat obrázky (jinak by se daly obcházet limity promptu).
  if ($tool !== 'ai-vision') fail(400, 'Tento nástroj obrázky nepřijímá.');
  if (count($body['images']) > AI_MAX_IMAGES) {
    fail(413, 'Příliš mnoho obrázků (max. ' . AI_MAX_IMAGES . ').');
  }
  foreach ($body['images'] as $img) {
    if (!is_string($img)) fail(400, 'Neplatný obrázek.');
    // Odstraň případný data URL prefix, ať klient nemusí.
    if (strpos($img, 'data:') === 0) {
      $img = preg_replace('/^data:[^;]+;base64,/', '', $img);
    }
    if (!preg_match('#^[A-Za-z0-9+/=]+$#', $img)) fail(400, 'Neplatný obrázek (není base64).');
    if (strlen($img) > AI_MAX_IMAGE_BYTES) fail(413, 'Obrázek je příliš velký (max. 8 MB).');
    $images[] = $img;
  }
}

if ($prompt === '' && !$images) fail(400, 'Prázdný prompt.');
// Délkový limit (počet bajtů — pokrývá i vícebajtové UTF-8).
if (strlen($prompt) > AI_MAX_PROMPT_CHARS) {
  fail(413, 'Vstup je příliš dlouhý (max. ' . AI_MAX_PROMPT_CHARS . ' znaků).');
}

// Pokud klient posílá `tool`, musí to být známý AI nástroj (jinak by se dalo
// obcházet přidělováním promtů). Prázdný `tool` = obecný ai-chat (bez úzkého omezení).
if ($tool !== '' && !ai_tool_known($tool) && $tool !== 'ai-chat') {
  fail(400, 'Neznámý nástroj.');
}

// ── Rate-limiting dle IP. ──────────────────────────────────────────────────
// AI has a direct operating cost. Storage failure must not remove its guard.
$rate = request_rate_limit_consume('ai-ollama', request_rate_limit_client_ip(), AI_RATE_WINDOW, AI_RATE_MAX);
if (!$rate['available']) {
  fail(503, 'Vývojová AI služba je dočasně nedostupná.');
}
if (!$rate['allowed']) {
  fail(429, 'Příliš mnoho požadavků. Zkuste to za chvíli znovu.');
}

// ── Sestav payload pro Ollamu. ─────────────────────────────────────────────
$ollama = rtrim(ollama_url(), '/');
$endpoint = $ollama . '/api/generate';

$payload = [
  'model'  => ollama_model(),
  'prompt' => $prompt,
  'stream' => $stream,
];
$sys = $tool !== '' ? ai_system_prompt($tool) : null;
if ($sys !== null) $payload['system'] = $sys;
if ($images) $payload['images'] = $images;
$payloadJson = json_encode($payload);

// ── Pošli požadavek na Ollamu přes cURL se streamovaným čtením odpovědi. ────
// Status zjistíme z hlaviček ještě předtím, než začneme flushovat tělo — díky tomu
// můžeme při chybě Ollamy správně nastavit HTTP status (jinak by hlavičky už byly odeslány).
$respStatus = 0;
$headersSent = false;
$errorBody = '';

$ch = curl_init($endpoint);
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $payloadJson,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/x-ndjson'],
  CURLOPT_HEADER => false,
  CURLOPT_RETURNTRANSFER => false,
  CURLOPT_HEADERFUNCTION => function ($ch, $header) use (&$respStatus) {
    if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $m)) $respStatus = (int)$m[1];
    return strlen($header);
  },
  CURLOPT_WRITEFUNCTION => function ($ch, $data) use (&$respStatus, &$headersSent, &$errorBody) {
    if ($respStatus >= 200 && $respStatus < 300) {
      if (!$headersSent) {
        header('Content-Type: application/x-ndjson; charset=utf-8');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('X-Accel-Buffering: no');
        @ini_set('zlib.output_compression', false);
        while (ob_get_level() > 0) { ob_end_flush(); }
        $headersSent = true;
      }
      echo $data;
      @ob_flush();
      @flush();
    } else {
      $errorBody .= $data;
    }
    return strlen($data);
  },
  CURLOPT_TIMEOUT => 60,
  CURLOPT_CONNECTTIMEOUT => 10,
]);

$ok = curl_exec($ch);
$err = curl_error($ch);
$status = $respStatus ?: (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

if ($ok === false) {
  fail(502, 'Vývojová AI služba není dostupná. Tento endpoint vyžaduje samostatně provozovanou Ollamu a není určený pro sdílený WEDOS hosting.');
}

if ($status < 200 || $status >= 300) {
  $code = ($status >= 400 && $status < 600) ? $status : 502;
  fail($code, 'Vývojová AI služba požadavek nedokončila.');
}
