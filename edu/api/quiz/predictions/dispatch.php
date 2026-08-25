<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/lib.php';
$cfg = auth_load_config(); beginJson($cfg);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); jsonErr('Method not allowed', 405); }
$configured = $cfg['QUIZ_DISPATCH_SECRET'] ?? null; $provided = $_SERVER['HTTP_X_QUIZ_DISPATCH_SECRET'] ?? null;
if (!is_string($configured) || strlen($configured) < 32 || !is_string($provided) || !hash_equals($configured, $provided)) jsonErr('Unauthorized', 401);
$body = jsonBody();
foreach (($body['ack_ids'] ?? []) as $id) if (is_string($id) && preg_match('/^[0-9a-f-]{36}$/i', $id) === 1) sb_update($cfg, 'edu_quiz_prediction', ['id'=>$id], ['delivered_at'=>quiz_api_iso_now()]);
$rows = sb_get($cfg, 'edu_quiz_prediction', [], 'id,user_id,body,deliver_at,delivered_at', 1000);
if (isset($rows['error'])) jsonErr('Dispatch unavailable', 503);
$now = time(); $due = array_values(array_filter($rows['data'] ?? [], static fn(array $row): bool => ($row['delivered_at'] ?? null) === null && strtotime((string)($row['deliver_at'] ?? '')) <= $now));
jsonOk(['items'=>$due,'ack_required'=>true]);
