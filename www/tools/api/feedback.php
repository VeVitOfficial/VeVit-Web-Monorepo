<?php
// Endpoint pro hlášení chyb z „Beta testing" banneru na landingu.
//
// Požadavek: POST, tělo JSON {"message": "..."} (případně form-encoded `message`).
// JEDINÉ pole je text zprávy — neshromažďujeme e-mail ani jméno. Pokud uživatel
// chce odpověď / beta-tester status, sám připojí svůj e-mail do textu zprávy.
//
// E-mail se odešle na FEEDBACK_EMAIL (lze přepsat env proměnnou VEVIT_FEEDBACK_EMAIL),
// výchozí info@vevit.cz. Odesílatelem je no-reply@vevit.cz (pevné, ne z uživatelského
// vstupu — žádný header injection). Tělo zprávy je plain-text, subjekt pevný.
//
// Hardening: jen POST, délkový limit, naivní IP rate-limit (souborový counter
// v sys_get_temp_dir, mimo web root), žádný uživatelský vstup do hlaviček e-mailu.

const FEEDBACK_TO        = 'info@vevit.cz';
const FEEDBACK_FROM      = 'no-reply@vevit.cz';
const FEEDBACK_MAX_CHARS = 5000;
const FEEDBACK_RATE_WIN  = 600;   // 10 minut
const FEEDBACK_RATE_MAX  = 5;     // max 5 hlášení / IP / okno

require_once __DIR__ . '/../includes/request-rate-limit.php';

function fb_fail(int $code, string $msg): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => false, 'message' => $msg]);
  exit;
}

function fb_ip(): string { return request_rate_limit_client_ip(); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fb_fail(405, 'Pouze POST.');

// Přečti tělo — JSON nebo form-encoded.
$raw = file_get_contents('php://input');
$message = '';
$ct = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ct, 'application/json') !== false || ($raw && $raw[0] === '{')) {
  $body = json_decode($raw, true);
  if (is_array($body)) $message = (string)($body['message'] ?? '');
} else {
  $message = (string)($_POST['message'] ?? '');
}
$message = trim($message);

if ($message === '') fb_fail(400, 'Zpráva je prázdná. Napište, co se nepovedlo.');
if ((function_exists('mb_strlen') ? mb_strlen($message, 'UTF-8') : strlen($message)) > FEEDBACK_MAX_CHARS) {
  fb_fail(413, 'Zpráva je příliš dlouhá (max. ' . FEEDBACK_MAX_CHARS . ' znaků).');
}

// Feedback sends mail, therefore loss of limiter storage fails closed.
$rate = request_rate_limit_consume('feedback', fb_ip(), FEEDBACK_RATE_WIN, FEEDBACK_RATE_MAX);
if (!$rate['available']) {
  fb_fail(503, 'Odeslání hlášení je dočasně nedostupné. Zkuste to prosím později.');
}
if (!$rate['allowed']) {
  fb_fail(429, 'Odeslali jste už příliš mnoho hlášení. Zkuste to za chvíli.');
}

// Sestav e-mail (plain-text, pevné hlavičky).
$to = getenv('VEVIT_FEEDBACK_EMAIL') ?: FEEDBACK_TO;
$subject = 'VeVit Tools — hlášení chyby (Beta)';
$ip = fb_ip();
$ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 200);
$body = "Nové hlášení z Beta testing formuláře VeVit Tools.\n\n"
      . "----------------------------------------\n"
      . $message . "\n"
      . "----------------------------------------\n\n"
      . "IP: " . $ip . "\n"
      . "User-Agent: " . $ua . "\n"
      . "Čas: " . date('Y-m-d H:i:s') . "\n";

$headers = [
  'From: VeVit Tools <' . FEEDBACK_FROM . '>',
  'Reply-To: ' . FEEDBACK_FROM,
  'Content-Type: text/plain; charset=utf-8',
  'MIME-Version: 1.0',
];

$sent = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));
if (!$sent) {
  fb_fail(500, 'Zprávu se nepodařilo odeslat. Zkuste to prosím později.');
}

http_response_code(200);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => true, 'message' => 'Děkujeme! Hlášení bylo odesláno.']);
