<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/customer-agenda.php';
require_once __DIR__ . '/lib/customer-page.php';

$id = (string) ($_GET['id'] ?? '');
agenda_page_start('Detail objednávky');
try {
    $identity = agenda_actor_for_order($id, $storeConfig);
    $orders = new CustomerOrderService($pdo, new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC'))));
    $order = $orders->detail($id, $identity['actor'], $identity['grant']);
    echo '<section class="grid lg:grid-cols-3 gap-5"><article class="lg:col-span-2 bg-surface-container border border-outline-variant rounded-xl p-6"><h2 class="font-h2 text-h2">' . h((string) $order['order_number']) . '</h2><dl class="grid sm:grid-cols-2 gap-3 mt-4"><div><dt class="text-on-surface-variant">Platba</dt><dd>' . h((string) ($order['payment_status'] ?? $order['status'])) . '</dd></div><div><dt class="text-on-surface-variant">Fulfilment</dt><dd>' . h((string) ($order['fulfillment_status'] ?? '—')) . '</dd></div></dl><h3 class="font-h2 text-h2 mt-7">Položky</h3><ul class="divide-y divide-outline-variant">';
    foreach ($order['items'] as $item) echo '<li class="py-4 flex justify-between gap-4"><span>' . h((string) $item['product_name']) . ' × ' . h((string) $item['quantity']) . '</span><span>' . h((string) $item['unit_price']) . ' ' . h(strtoupper((string) $order['currency'])) . '</span></li>';
    $raw=$orders->rawOrderForAuthorizedDelivery($id);$deliveryService=new DeliveryService($pdo,new DeliveryRepository($pdo),new DeliveryStateMachine(),new TrackingUrlPolicy($storeConfig['tracking_carriers']??[]),new AuditService($pdo));$deliveries=$raw?$deliveryService->customerDetail($id,$raw,$identity['actor'],$identity['grant'],new OrderAccessService(new DateTimeImmutable('now',new DateTimeZone('UTC')))):[];
    echo '</ul><h3 class="font-h2 text-h2 mt-7">Doručení</h3>';if($deliveries===[])echo '<p class="text-on-surface-variant mt-2">Zásilka zatím nebyla založena.</p>';foreach($deliveries as$delivery){echo '<div class="mt-3 border border-outline-variant rounded-lg p-4"><strong>'.h((string)$delivery['status']).'</strong><p class="text-on-surface-variant">Odhad: '.h((string)($delivery['estimated_delivery_at']??'—')).' · Doručeno: '.h((string)($delivery['delivered_at']??'—')).'</p>';if(!empty($delivery['tracking_url']))echo '<a class="text-primary underline" rel="noopener noreferrer" href="'.h((string)$delivery['tracking_url']).'">Sledovat zásilku</a>';elseif(!empty($delivery['tracking_number']))echo '<p>Tracking: '.h((string)$delivery['tracking_number']).'</p>';echo '</div>';}echo '</article><aside class="bg-surface-container border border-outline-variant rounded-xl p-6"><h2 class="font-h2 text-h2">Další kroky</h2>';
    if(in_array((string)$order['status'],['paid','processing','shipped','delivered'],true))echo '<a class="btn btn-primary w-full justify-center mt-4" href="claim.php?order=' . rawurlencode($id) . '">Založit reklamaci</a>';
    $hasPhysical=false;foreach($order['items']as$item)if(($item['product_type']??'')==='physical'){$hasPhysical=true;break;}if($order['status']==='delivered'&&$hasPhysical)echo '<a class="btn btn-outline w-full justify-center mt-3" href="return.php?order=' . rawurlencode($id) . '">Požádat o vrácení</a>';
    echo '</aside></section>';
} catch (Throwable) {
    agenda_unavailable('Objednávka není dostupná. Otevřete ji pouze přes původní bezpečný odkaz.');
}
agenda_page_end();
