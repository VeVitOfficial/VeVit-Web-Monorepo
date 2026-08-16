<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') { header('Allow: GET'); jsonErr('Method not allowed', 405); }
[$cfg] = quiz_api_bootstrap();
$questionId = $_GET['question_id'] ?? '';
if (!is_string($questionId) || preg_match('/^[1-6]-[0-9]+-q[0-9]+$/', $questionId) !== 1) jsonErr('Neplatná otázka.', 422);
$result = sb_rpc($cfg, 'edu_quiz_poll_distribution', ['p_question_id' => $questionId]);
if (isset($result['error'])) jsonErr('Rozložení odpovědí se nepodařilo načíst.', 503);
jsonOk(['distribution' => $result['data'] ?? []]);
