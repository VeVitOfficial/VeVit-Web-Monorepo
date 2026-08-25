<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/customer-agenda.php';
require_once __DIR__ . '/lib/customer-page.php';

agenda_page_start('Moje objednávky', 'Přehled objednávek je dostupný jen po ověřeném přihlášení VeVit Account.');
try {
    $orders = (new CustomerOrderService($pdo, new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC')))))->accountOrders(agenda_auth_context($storeConfig));
    if ($orders === []) echo '<p class="text-on-surface-variant">Zatím zde nejsou žádné objednávky.</p>';
    foreach ($orders as $order) {
        echo '<article class="bg-surface-container border border-outline-variant rounded-xl p-5 mb-4"><div class="flex flex-wrap justify-between gap-3"><div><h2 class="font-h2 text-h2">' . h((string) $order['order_number']) . '</h2><p class="text-on-surface-variant">' . h((string) $order['created_at']) . '</p></div><div class="text-right"><p>' . h((string) $order['status']) . '</p><strong>' . h((string) $order['total']) . ' ' . h(strtoupper((string) $order['currency'])) . '</strong></div></div><a class="btn btn-outline mt-4 inline-flex" href="order.php?id=' . rawurlencode((string) $order['public_id']) . '">Detail objednávky</a></article>';
    }
} catch (DomainException) {
    agenda_unavailable('Serverový kontrakt VeVit Account zatím není ověřený. Pro konkrétní objednávku použijte bezpečný odkaz z potvrzovacího e-mailu.');
}
agenda_page_end();
