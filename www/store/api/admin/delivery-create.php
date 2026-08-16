<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';
$input=agenda_json_input(16384);
try{
    $result=agenda_admin_mutation_service($pdo,$storeConfig)->createDelivery(
        (int)($input['order_id']??0),
        $adminActor,
        is_array($input['data']??null)?$input['data']:[],
        (string)($_SERVER['HTTP_IDEMPOTENCY_KEY']??''),
    );
    http_response_code(201);
    echo json_encode(['delivery'=>['id'=>$result['public_id'],'status'=>$result['status'],'version'=>$result['version']]],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
}catch(DomainException){
    store_emit_json_error(409,'delivery_create_rejected','Zásilku nelze založit.');
}
