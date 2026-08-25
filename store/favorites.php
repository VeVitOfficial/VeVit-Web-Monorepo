<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/customer-agenda.php';
require_once __DIR__ . '/lib/customer-page.php';
agenda_page_start('Oblíbené produkty');
try {
    $items = (new FavoriteService($pdo))->list(agenda_auth_context($storeConfig));
    if ($items === []) echo '<p class="text-on-surface-variant">Zatím nemáte žádné oblíbené produkty.</p>';
    echo '<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">';
    foreach ($items as $item) echo '<article class="bg-surface-container border border-outline-variant rounded-xl p-5"><h2 class="font-h2 text-h2">' . h((string) $item['name']) . '</h2><div class="flex flex-wrap gap-3 mt-4"><a class="btn btn-primary" href="product.php?slug=' . rawurlencode((string) $item['slug']) . '">Zobrazit produkt</a><form data-favorite-remove action="api/favorites/remove.php"><input type="hidden" name="csrf" value="'.h(store_csrf_token('favorites')).'"><input type="hidden" name="product_id" value="'.(int)$item['id'].'"><button class="btn btn-outline" type="submit" aria-label="Odebrat '.h((string)$item['name']).' z oblíbených">Odebrat</button><output class="sr-only" aria-live="polite"></output></form></div></article>';
    echo '</div>';
} catch (DomainException) {
    agenda_unavailable('Oblíbené produkty budou dostupné až po dokončení ověřeného serverového kontraktu VeVit Account.');
}
agenda_page_end();
