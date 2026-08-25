<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/lib.php';
[$cfg, $user] = quiz_api_bootstrap(true); $body = jsonBody(); $text = trim((string)($body['body'] ?? ''));
$length = function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text);
if ($length < 1 || $length > 4000) jsonErr('Předpověď má neplatnou délku.', 422);
$saved = sb_insert($cfg, 'edu_quiz_prediction', ['user_id'=>quiz_api_user_id($user),'body'=>$text,'deliver_at'=>(new DateTimeImmutable('now', new DateTimeZone('UTC')))->modify('+1 year')->format('Y-m-d\TH:i:s\Z')]);
if (isset($saved['error'])) jsonErr('Předpověď se nepodařilo uložit.', 503);
jsonOk(['prediction'=>$saved['data']], 201);
