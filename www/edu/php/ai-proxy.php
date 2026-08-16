<?php
/* ──────────────────────────────────────────────────────────────────────
   AI proxy pro chytrý vyhledávač (Wikipedia + AI).
   Server-side volání LLM, aby API klíč nebyl v klientovi.

   KONFIGURACE: vyplň $API_KEY a případně $API_URL / $MODEL.
   Výchozí je OpenAI-kompatibilní endpoint — funguje s:
     - OpenAI:      https://api.openai.com/v1/chat/completions       model: gpt-4o-mini
     - OpenRouter:  https://openrouter.ai/api/v1/chat/completions   model: anthropic/claude-3.5-sonnet ...
     - Groq:        https://api.groq.com/openai/v1/chat/completions  model: llama-3.1-70b-versatile
     - Ollama:      http://localhost:11434/v1/chat/completions      model: llama3.1
   ────────────────────────────────────────────────────────────────────── */

$API_URL  = 'https://api.openai.com/v1/chat/completions';
$API_KEY  = '';                      // <-- SEM VLOŽ SVŮJ API KLÍČ
$MODEL    = 'gpt-4o-mini';
$MAX_CTX  = 12000;                   // max. znaků textu článku odeslaných do LLM

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST only']); exit;
}

$body = file_get_contents('php://input');
$in   = json_decode($body, true);
$question = trim((string)($in['question'] ?? ''));
$context  = trim((string)($in['context']  ?? ''));
if ($question === '' || $context === '') {
  http_response_code(400); echo json_encode(['error' => 'missing question/context']); exit;
}
if ($API_KEY === '') {
  http_response_code(500);
  echo json_encode(['error' => 'API_KEY není nastaven v php/ai-proxy.php']); exit;
}

// oříznutí kontextu
$context = mb_substr($context, 0, $MAX_CTX);

$system = "Jsi asistent, který odpovídá na otázky výhradně na základě dodaného textu z Wikipedie. "
        . "Najdi v textu co nejpřesnější odpověď. "
        . "Odpověz POUZE platným JSON objektem (bez markdownu, bez prose kolem) se dvěma klíči:\n"
        . "- answer_text: stručná odpověď na otázku (1–2 věty, ve stejném jazyce jako otázka).\n"
        . "- exact_quote: přesná věta nebo souvislá pasáž VERBATIM (opřená doslovně z dodaného textu), "
        . "ve které se odpověď nachází (max ~300 znaků).\n"
        . "Pokud v textu odpověď jednoznačně nenajdeš, vrať {\"answer_text\":\"\",\"exact_quote\":\"\"}.";

$user = "OTÁZKA:\n" . $question . "\n\nTEXT Z WIKIPEDIE:\n" . $context;

$payload = [
  'model' => $MODEL,
  'messages' => [
    ['role' => 'system', 'content' => $system],
    ['role' => 'user',   'content' => $user],
  ],
  'temperature' => 0,
  'response_format' => ['type' => 'json_object'],
];

$ch = curl_init($API_URL);
curl_setopt_array($ch, [
  CURLOPT_POST           => true,
  CURLOPT_POSTFIELDS     => json_encode($payload),
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER      => [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $API_KEY,
  ],
  CURLOPT_USERAGENT      => 'VeVit-Edu-AI-Search/1.0 (contact: admin@vevit.cz)',
  CURLOPT_TIMEOUT        => 30,
]);
$res  = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

if ($res === false) {
  http_response_code(502);
  echo json_encode(['error' => 'upstream error: ' . $err]); exit;
}
if ($code >= 400) {
  http_response_code(502);
  echo json_encode(['error' => 'upstream HTTP ' . $code, 'upstream' => mb_substr($res,0,500)]); exit;
}

$data    = json_decode($res, true);
$content = $data['choices'][0]['message']['content'] ?? '';

$parsed  = json_decode($content, true);
if (!is_array($parsed) && preg_match('/\{.*\}/s', $content, $m)) {
  $parsed = json_decode($m[0], true);
}

echo json_encode([
  'answer_text' => is_array($parsed) ? ($parsed['answer_text'] ?? '') : '',
  'exact_quote' => is_array($parsed) ? ($parsed['exact_quote'] ?? '') : '',
]);
