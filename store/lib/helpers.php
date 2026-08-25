<?php
// VeVit Store — shared helpers

function vv_category_bg(?string $slug): string {
    return match($slug) {
        'digitalni-produkty' => 'cat-bg-digital',
        'elektronika' => 'cat-bg-electronics',
        'merch' => 'cat-bg-merch',
        default => 'cat-bg-default',
    };
}

function vv_format_price(float $value): string {
    $lang = vv_i18n_get_lang();
    $currency = vv_t('store.common.currency');
    // cs/sk: tisícová mezera = nedělitelná mezera, desetinná čárka.
    // Ostatní: tisícová čárka, desetinná tečka.
    if ($lang === 'cs' || $lang === 'sk') {
        return number_format($value, 0, ',', "\u{A0}") . "\u{A0}" . $currency;
    }
    return number_format($value, 0, '.', ',') . ' ' . $currency;
}

function vv_product_price(array $p): float {
    $hasSale = $p['sale_price'] && floatval($p['sale_price']) > 0;
    return $hasSale ? floatval($p['sale_price']) : floatval($p['price']);
}

function vv_product_has_sale(array $p): bool {
    return $p['sale_price'] && floatval($p['sale_price']) > 0;
}

function vv_product_is_out_of_stock(array $p): bool {
    return $p['type'] !== 'digital' && $p['stock'] !== null && (int)$p['stock'] <= 0;
}

/**
 * Render a single product card. Used in homepage trending, catalog, related products.
 */
function vv_render_product_card(array $p): void {
    $isDigital = $p['type'] === 'digital';
    $outOfStock = vv_product_is_out_of_stock($p);
    $hasSale = vv_product_has_sale($p);
    $price = vv_product_price($p);
    $catBg = vv_category_bg($p['category_slug'] ?? null);
    $name = $p['name'];
    $slug = $p['slug'];
    $shortDesc = $p['short_desc'] ?? '';
    ?>
    <article class="bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col group relative transition-colors hover:border-primary/50">
      <?php if ($p['featured']): ?>
        <div class="absolute top-sm left-sm z-10">
          <span class="font-mono-label text-mono-label text-primary border border-primary px-2 py-1 rounded bg-background/70 backdrop-blur-sm uppercase"><?= vv_t('store.common.new_badge') ?></span>
        </div>
      <?php elseif ($hasSale): ?>
        <div class="absolute top-sm left-sm z-10">
          <span class="font-mono-label text-mono-label text-error border border-error px-2 py-1 rounded bg-background/70 backdrop-blur-sm uppercase"><?= vv_t('store.common.sale_badge') ?></span>
        </div>
      <?php endif; ?>
      <a href="product.php?slug=<?= h($slug) ?>" class="aspect-square <?= $catBg ?> rounded-lg mb-md flex items-center justify-center relative overflow-hidden border border-outline-variant/50 group-hover:scale-[1.02] transition-transform duration-300">
        <span class="font-mono-label text-mono-label text-white/70 uppercase tracking-widest text-center px-sm"><?= h($p['category_name'] ?? 'VeVit') ?></span>
      </a>
      <div class="flex items-center justify-between mb-xs">
        <span class="font-mono-label text-caption text-on-surface-variant uppercase"><?= $isDigital ? vv_t('store.common.digital') : vv_t('store.common.physical') ?></span>
        <?php if (!$isDigital && $p['stock'] !== null): ?>
          <span class="font-mono-label text-caption <?= $p['stock'] > 0 ? 'text-primary' : 'text-error' ?>">
            <?= $p['stock'] > 0 ? vv_t('store.common.in_stock') : vv_t('store.common.out_of_stock') ?>
          </span>
        <?php endif; ?>
      </div>
      <a href="product.php?slug=<?= h($slug) ?>" class="font-h2 text-h2 text-on-surface mb-xs line-clamp-1 hover:text-primary transition-colors"><?= h($name) ?></a>
      <p class="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-sm flex-1"><?= h($shortDesc) ?></p>
      <div class="flex justify-between items-center mt-sm pt-sm border-t border-outline-variant">
        <div class="flex flex-col">
          <span class="font-h2 text-h2 text-primary"><?= vv_format_price($price) ?></span>
          <?php if ($hasSale): ?>
            <span class="font-caption text-caption text-on-surface-variant line-through"><?= vv_format_price((float)$p['price']) ?></span>
          <?php endif; ?>
        </div>
        <?php if ($outOfStock): ?>
          <button disabled aria-label="<?= vv_t('store.common.out_of_stock_aria') ?>" class="bg-surface border border-outline-variant text-on-surface-variant rounded-full p-2 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-[20px]">block</span>
          </button>
        <?php else: ?>
          <button data-cart-product="<?= h(json_encode([
            "id" => (int)$p["id"],
            "name" => $p["name"],
            "price" => (float)$p["price"],
            "sale_price" => $p["sale_price"] ? (float)$p["sale_price"] : null,
            "type" => $p["type"],
            "slug" => $p["slug"],
          ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) ?>" aria-label="<?= vv_t('store.common.add_to_cart') ?>" class="bg-surface border border-outline hover:border-primary text-on-surface hover:text-primary rounded-full p-2 transition-colors">
            <span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
          </button>
        <?php endif; ?>
      </div>
    </article>
    <?php
}
