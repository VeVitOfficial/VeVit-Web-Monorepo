<?php
declare(strict_types=1);
require __DIR__ . '/test-lib.php';

$htmlPdf = (string)file_get_contents(HUB_ROOT . '/assets/js/tools/html-to-pdf.js');
$sanitizer = (string)file_get_contents(HUB_ROOT . '/assets/js/lib/html-pdf-sanitize.js');
$ssl = (string)file_get_contents(HUB_ROOT . '/includes/ssl-checker.php');
$feedback = (string)file_get_contents(HUB_ROOT . '/api/feedback.php');
$ai = (string)file_get_contents(HUB_ROOT . '/api/ai/ollama.php');
hub_assert(str_contains($htmlPdf, 'VeVitHtmlPdfSanitizer.sanitize') && str_contains($htmlPdf, 'document.createElement(\'iframe\')'), 'html-to-pdf does not use sanitized iframe rendering');
hub_assert(!str_contains($htmlPdf, 'document.body.innerHTML'), 'html-to-pdf inserts input into the main DOM');
foreach (['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'BASE', 'META', 'FORM', 'sandbox: \'allow-same-origin\''] as $needle) hub_assert(str_contains($sanitizer, $needle), 'HTML sanitizer baseline missing ' . $needle);
foreach (['verify_peer\' => true', 'verify_peer_name\' => true', '\'peer_name\' => $hostname', 'ssl_is_public_ip'] as $needle) hub_assert(str_contains($ssl, $needle), 'SSL baseline missing ' . $needle);
hub_assert(str_contains($feedback, 'if (!$sent)') && str_contains($feedback, 'fb_fail(500'), 'feedback can report success without mail confirmation');
hub_assert(str_contains($ai, 'array_key_exists(\'model\', $body)') && str_contains($ai, "'model'  => ollama_model()"), 'AI proxy permits client model selection');
echo "PASS security baseline\n";
