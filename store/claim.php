<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/customer-agenda.php';
require_once __DIR__ . '/lib/customer-page.php';
$id = (string) ($_GET['id'] ?? '');
$orderId = (string) ($_GET['order'] ?? '');
agenda_page_start($id !== '' ? 'Detail reklamace' : 'Nová reklamace');
if ($id === '') {
    if (OrderAccessService::sessionGrant($orderId) === null) {
        agenda_unavailable('Reklamaci lze založit jen pro objednávku otevřenou platným guest grantem.');
    } else {
        try{$identity=agenda_actor_for_order($orderId,$storeConfig);$claimService=new ClaimService($pdo,new ClaimRepository($pdo),new CaseQuantityAvailability($pdo),new OrderAccessService(new DateTimeImmutable('now',new DateTimeZone('UTC'))),new AuditService($pdo));$claimService->orderForCreate($orderId,$identity['actor'],$identity['grant']);$order=(new CustomerOrderService($pdo,new OrderAccessService(new DateTimeImmutable('now',new DateTimeZone('UTC')))))->detail($orderId,$identity['actor'],$identity['grant']);echo '<form data-agenda-json class="bg-surface-container border border-outline-variant rounded-xl p-6 space-y-4" method="post" action="api/claims/create.php"><input type="hidden" name="csrf" value="' . h(store_csrf_token('customer_agenda')) . '"><input type="hidden" name="order" value="'.h($orderId).'"><p class="text-on-surface-variant">Položky a množství server vždy znovu ověří proti objednávce.</p>';foreach($order['items']as$item)echo '<div data-order-item class="flex items-center gap-3"><input type="checkbox" value="'.(int)$item['id'].'" id="claim-item-'.(int)$item['id'].'"><label for="claim-item-'.(int)$item['id'].'" class="flex-1">'.h((string)$item['product_name']).'</label><input type="number" min="1" max="'.(int)$item['quantity'].'" value="1" class="w-20" aria-label="Množství"></div>';echo '<label class="block">Důvod<input class="w-full mt-1" name="reason_code" required maxlength="64"></label><label class="block">Popis<textarea class="w-full mt-1" name="problem_description" required maxlength="5000"></textarea></label><label class="block">Požadované řešení<select class="w-full mt-1" name="requested_resolution"><option value="repair">Oprava</option><option value="replacement">Výměna</option><option value="refund">Vrácení peněz</option><option value="other">Jiné</option></select></label><button class="btn btn-primary" type="submit">Odeslat reklamaci</button><output class="block" aria-live="polite"></output></form>';}catch(Throwable){agenda_unavailable('Objednávka není dostupná nebo zatím nesplňuje podmínky reklamace.');}
    }
} else {
    try {
        $service = new ClaimService($pdo, new ClaimRepository($pdo), new CaseQuantityAvailability($pdo), new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC'))), new AuditService($pdo));
        $identity = agenda_actor_for_order($service->guestOrderPublicId($id), $storeConfig);
        $detail = $service->detailPayload($id, $identity['actor'], $identity['grant']);
        $summary = $detail['summary'];
        echo '<article class="bg-surface-container border border-outline-variant rounded-xl p-6"><h2 class="font-h2 text-h2">Stav: ' . h((string) $summary['status']) . '</h2><p class="mt-3">' . h((string) $summary['problem_description']) . '</p><h3 class="font-h2 text-h2 mt-7">Reklamované položky</h3><ul class="divide-y divide-outline-variant">';
        foreach($detail['items']as$item)echo '<li class="py-3">'.h((string)$item['product_name']).' × '.(int)$item['requested_quantity'].'</li>';
        echo '</ul>';
        agenda_timeline($detail['events']);
        if(!in_array($summary['status'],['rejected','resolved','cancelled'],true))echo '<form data-agenda-message class="mt-6 border-t border-outline-variant pt-5" action="api/claims/message.php"><input type="hidden" name="csrf" value="'.h(store_csrf_token('customer_agenda')).'"><input type="hidden" name="id" value="'.h($id).'"><label class="block">Doplnit zprávu<textarea class="w-full mt-2" name="message" required maxlength="2000"></textarea></label><button class="btn btn-outline mt-3" type="submit">Odeslat zprávu</button><output class="block mt-2" aria-live="polite"></output></form>';
        $storage=new LocalPrivateStorage($storeConfig['storage_path'],$storeConfig['attachments']['allowed_mime'],$storeConfig['attachments']['max_bytes'],__DIR__);$attachments=new AttachmentService($pdo,new AttachmentRepository($pdo),$storage,new OrderAccessService(new DateTimeImmutable('now',new DateTimeZone('UTC'))),new AuditService($pdo),$storeConfig['attachments']['max_files']);agenda_attachments('claim',$id,$identity['actor'],$identity['grant'],$attachments);
        echo '</article>';
    } catch (Throwable) {
        agenda_unavailable('Reklamace není dostupná.');
    }
}
agenda_page_end();
