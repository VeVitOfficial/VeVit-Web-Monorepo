<?php
declare(strict_types=1);
require_once __DIR__.'/../../config.php';require_once __DIR__.'/../../lib/customer-agenda.php';agenda_prepare_http(['GET'],$storeConfig);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');try{echo json_encode(['favorites'=>(new FavoriteService($pdo))->list(agenda_auth_context($storeConfig))],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);}catch(Throwable){store_emit_json_error(401,'verified_account_required','Oblíbené produkty vyžadují ověřené přihlášení.');}
