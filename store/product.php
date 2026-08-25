<?php
require_once __DIR__ . '/config.php';

$vvLang = vv_i18n_get_lang();
$slug = $_GET['slug'] ?? '';
if (!$slug) { header('Location: index.php'); exit; }

// Main product query — LEFT JOIN translations with COALESCE fallback.
$stmt = $pdo->prepare("SELECT p.id, p.slug, p.price, p.sale_price, p.type, p.stock, p.images,
       p.brand, p.category_id, p.created_at, p.download_file, p.stripe_price_id,
       COALESCE(pt.name, p.name) AS name,
       COALESCE(pt.short_desc, p.short_desc) AS short_desc,
       COALESCE(pt.description, p.description) AS description,
       p.featured::int AS featured, p.is_active::int AS is_active,
       c.name AS category_name, c.slug AS category_slug
  FROM store_products p
  LEFT JOIN store_categories c ON p.category_id = c.id
  LEFT JOIN store_product_translations pt ON pt.product_id = p.id AND pt.lang = ?
  WHERE p.slug = ? AND p.is_active = TRUE");
$stmt->execute([$vvLang, $slug]);
$product = $stmt->fetch();
if (!$product) {
  http_response_code(404);
  $pageTitle = vv_t('store.product.notfound_title');
  $metaDesc = vv_t('store.meta.desc_default');
  $vvSectionPath = '/store/product.php';
  include __DIR__.'/lib/header.php'; ?>
<main class="flex-1 max-w-[1200px] mx-auto px-margin py-xl text-center flex flex-col items-center gap-md">
  <span class="material-symbols-outlined text-[80px] text-on-surface-variant/50" aria-hidden="true">search_off</span>
  <h1 class="font-display text-h1 text-on-surface"><?= vv_t('store.product.notfound_title') ?></h1>
  <p class="font-body-md text-on-surface-variant"><?= vv_t('store.product.notfound_text') ?></p>
  <a href="catalog.php" class="bg-primary-container text-on-primary-fixed font-mono-label text-mono-label py-sm px-md rounded-DEFAULT border-2 border-on-primary-fixed neo-shadow uppercase"><?= vv_t('store.product.notfound_back') ?></a>
</main>
<?php include __DIR__.'/lib/footer.php'; exit; }

// Sledování zobrazení — jen pro přihlášeného (naposledy prohlížené na homepage).
$viewer = getCurrentUser();
if ($viewer) {
    $pdo->prepare("INSERT INTO store_product_views (product_id, user_id, viewed_at)
                   VALUES (?,?,NOW())
                   ON CONFLICT (user_id, product_id) DO UPDATE SET viewed_at = NOW()")
        ->execute([$product['id'], $viewer['id']]);
}

$isDigital = $product['type'] === 'digital';
$outOfStock = vv_product_is_out_of_stock($product);
$hasSale = vv_product_has_sale($product);
$price = vv_product_price($product);
$catBg = vv_category_bg($product['category_slug']);

// Related products — also with translation JOIN.
$relatedStmt = $pdo->prepare("SELECT p.id, p.slug, p.price, p.sale_price, p.type, p.stock, p.images,
       p.brand, p.category_id, p.created_at, p.download_file, p.stripe_price_id,
       COALESCE(pt.name, p.name) AS name,
       COALESCE(pt.short_desc, p.short_desc) AS short_desc,
       COALESCE(pt.description, p.description) AS description,
       p.featured::int AS featured, p.is_active::int AS is_active,
       c.name AS category_name, c.slug AS category_slug
  FROM store_products p
  LEFT JOIN store_categories c ON p.category_id = c.id
  LEFT JOIN store_product_translations pt ON pt.product_id = p.id AND pt.lang = ?
  WHERE p.is_active = TRUE AND p.id != ? AND (p.category_id = ? OR p.type = ?)
  ORDER BY p.featured DESC, p.created_at DESC LIMIT 4");
$relatedStmt->execute([$vvLang, $product['id'], $product['category_id'], $product['type']]);
$related = $relatedStmt->fetchAll();

$pageTitle   = vv_t('store.meta.title_product', null, ['NAME' => $product['name']]);
$metaDesc    = mb_substr($product['short_desc'] ?? vv_t('store.meta.desc_product'), 0, 155);
$activeNav   = 'catalog';
$noindex     = false;
$vvSectionPath = '/store/product.php';
include __DIR__ . '/lib/header.php';
?>

<main id="productPage"
  data-product="<?= h(json_encode([
    'id' => (int) $product['id'], 'name' => $product['name'], 'price' => (float) $product['price'],
    'sale_price' => $product['sale_price'] ? (float) $product['sale_price'] : null,
    'type' => $product['type'], 'slug' => $product['slug'],
  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) ?>"
  data-favorites-csrf="<?= h(store_csrf_token('favorites')) ?>"
  class="flex-1 w-full max-w-store mx-auto px-margin py-8">

  <!-- Breadcrumbs -->
  <nav class="breadcrumb mb-8" aria-label="<?= h(vv_t('store.nav.breadcrumb_aria')) ?>">
    <a href="index.php"><?= vv_t('store.product.breadcrumb_home') ?></a>
    <span class="breadcrumb-sep material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
    <a href="catalog.php"><?= vv_t('store.product.breadcrumb_catalog') ?></a>
    <?php if ($product['category_slug']): ?>
      <span class="breadcrumb-sep material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
      <a href="catalog.php?category=<?= h($product['category_slug']) ?>"><?= h($product['category_name']) ?></a>
    <?php endif; ?>
    <span class="breadcrumb-sep material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
    <span class="text-on-surface normal-case"><?= h($product['name']) ?></span>
  </nav>

  <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12">

    <!-- Gallery -->
    <div class="md:col-span-6 lg:col-span-7 flex flex-col gap-3">
      <!-- Main image -->
      <div class="w-full aspect-square <?= $catBg ?> rounded-xl overflow-hidden border border-outline-variant relative" role="img" aria-label="<?= h(vv_t('store.product.gallery_aria', null, ['NAME' => $product['name']])) ?>">
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[60px] text-white/20" aria-hidden="true">image</span>
          <span class="font-mono-label text-[11px] text-white/40 uppercase tracking-widest text-center px-6"><?= h($product['category_name'] ?? 'VeVit') ?></span>
        </div>
        <?php if ($product['featured']): ?>
          <div class="absolute top-3 left-3"><span class="badge badge-primary"><?= vv_t('store.common.new_badge') ?></span></div>
        <?php endif; ?>
        <?php if ($hasSale): ?>
          <div class="absolute top-3 right-3"><span class="badge badge-danger"><?= vv_t('store.common.sale_badge') ?></span></div>
        <?php endif; ?>
      </div>
      <!-- Thumbnail strip (placeholder) -->
      <div class="grid grid-cols-4 gap-2">
        <?php for ($i = 0; $i < 4; $i++): ?>
          <button type="button" class="aspect-square <?= $catBg ?> rounded-lg border-2 <?= $i === 0 ? 'border-primary' : 'border-outline-variant/50 opacity-60' ?> hover:opacity-100 hover:border-primary transition-all flex items-center justify-center"
            aria-label="<?= h(vv_t('store.product.image_n', null, ['N' => $i + 1])) ?>">
            <span class="material-symbols-outlined text-white/20 text-[18px]" aria-hidden="true">image</span>
          </button>
        <?php endfor; ?>
      </div>
    </div>

    <!-- Product details -->
    <div class="md:col-span-6 lg:col-span-5 flex flex-col">

      <!-- Category + type -->
      <div class="flex items-center gap-2 flex-wrap mb-3">
        <?php if ($product['category_name']): ?>
          <a href="catalog.php?category=<?= h($product['category_slug']) ?>"
             class="font-mono-label text-[11px] text-primary uppercase tracking-widest hover:underline">
            <?= h($product['category_name']) ?>
          </a>
        <?php endif; ?>
        <?php if ($isDigital): ?>
          <span class="badge badge-primary"><?= vv_t('store.product.digital_badge') ?></span>
        <?php endif; ?>
      </div>

      <h1 class="font-display text-h1 md:text-display text-on-surface mb-4 leading-tight"><?= h($product['name']) ?></h1>

      <!-- Price block -->
      <div class="flex items-baseline gap-3 mb-5">
        <span class="font-display text-h1 text-primary"><?= vv_format_price($price) ?></span>
        <?php if ($hasSale): ?>
          <span class="font-body-md text-on-surface-variant line-through"><?= vv_format_price((float)$product['price']) ?></span>
          <span class="badge badge-danger">−<?= round((1 - $product['sale_price'] / $product['price']) * 100) ?>%</span>
        <?php endif; ?>
      </div>

      <p class="font-body-md text-on-surface-variant mb-5 leading-relaxed"><?= nl2br(h($product['short_desc'] ?? '')) ?></p>

      <!-- Availability -->
      <?php if (!$isDigital && $product['stock'] !== null): ?>
      <div class="flex items-center gap-2 mb-5">
        <span class="w-2.5 h-2.5 rounded-full <?= $product['stock'] > 0 ? 'bg-success' : 'bg-error' ?> flex-shrink-0" aria-hidden="true"></span>
        <span class="font-mono-label text-mono-label <?= $product['stock'] > 0 ? 'text-success' : 'text-error' ?> uppercase">
          <?= $product['stock'] > 0 ? vv_t('store.common.in_stock_n', null, ['N' => (int)$product['stock']]) : vv_t('store.common.out_of_stock') ?>
        </span>
      </div>
      <?php elseif ($isDigital): ?>
      <div class="bg-primary/8 border border-primary/30 rounded-xl p-4 mb-5">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-primary text-[20px] icon-filled flex-shrink-0 mt-0.5" aria-hidden="true">download</span>
          <div>
            <p class="font-mono-label text-mono-label text-primary uppercase"><?= vv_t('store.product.digital_download_t') ?></p>
            <p class="font-body-md text-sm text-on-surface-variant mt-0.5"><?= vv_t('store.product.digital_download_p') ?></p>
          </div>
        </div>
      </div>
      <?php endif; ?>

      <hr class="border-outline-variant mb-5">

      <!-- Actions -->
      <div class="flex flex-wrap gap-3 mb-6">
        <?php if ($outOfStock): ?>
          <button disabled class="btn btn-lg flex-1 bg-surface-container-high text-on-surface-variant border-2 border-outline-variant cursor-not-allowed opacity-50">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">block</span> <?= vv_t('store.product.out_of_stock_btn') ?>
          </button>
        <?php elseif ($isDigital): ?>
          <button data-product-action="buy" class="btn btn-lg btn-primary flex-1">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">download</span> <?= vv_t('store.product.buy_download') ?>
          </button>
          <button data-product-action="add" aria-label="<?= h(vv_t('store.common.add_to_cart')) ?>" class="btn btn-lg btn-outline btn-icon" style="width: 52px; flex: none">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add_shopping_cart</span>
          </button>
        <?php else: ?>
          <div class="qty-group" role="group" aria-label="<?= h(vv_t('store.product.quantity_aria')) ?>">
            <button data-quantity-delta="-1" aria-label="<?= h(vv_t('store.product.qty_decrease')) ?>">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">remove</span>
            </button>
            <span id="qtyVal" class="qty-val" aria-live="polite" aria-atomic="true">1</span>
            <button data-quantity-delta="1" aria-label="<?= h(vv_t('store.product.qty_increase')) ?>">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            </button>
          </div>
          <button data-product-action="add" class="btn btn-lg btn-primary flex-1">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">shopping_bag</span> <?= vv_t('store.product.add_to_cart_btn') ?>
          </button>
        <?php endif; ?>
        <button id="favoriteButton" type="button" aria-pressed="false" aria-describedby="favoriteStatus" class="btn btn-lg btn-outline">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">favorite</span>
          <?= vv_t('store.product.add_favorites') ?>
        </button>
      </div>
      <p id="favoriteStatus" class="font-caption text-caption text-on-surface-variant mb-4" aria-live="polite"></p>

      <!-- Trust badges -->
      <div class="flex flex-wrap gap-3 mb-6">
        <div class="flex items-center gap-1.5 text-on-surface-variant">
          <span class="material-symbols-outlined text-[16px] text-primary icon-filled" aria-hidden="true">lock</span>
          <span class="font-caption text-caption"><?= vv_t('store.product.trust_secure') ?></span>
        </div>
        <div class="flex items-center gap-1.5 text-on-surface-variant">
          <span class="material-symbols-outlined text-[16px] text-primary icon-filled" aria-hidden="true">verified</span>
          <span class="font-caption text-caption"><?= vv_t('store.product.trust_verified') ?></span>
        </div>
        <?php if (!$isDigital): ?>
        <div class="flex items-center gap-1.5 text-on-surface-variant">
          <span class="material-symbols-outlined text-[16px] text-primary icon-filled" aria-hidden="true">assignment_return</span>
          <span class="font-caption text-caption"><?= vv_t('store.product.trust_returns') ?></span>
        </div>
        <?php endif; ?>
      </div>

      <!-- Accordions -->
      <div class="border-t border-outline-variant">
        <details class="vv-accordion border-b border-outline-variant">
          <summary>
            <span class="font-mono-label text-mono-label text-on-surface uppercase hover:text-primary transition-colors"><?= vv_t('store.product.acc_description') ?></span>
            <span class="accordion-icon material-symbols-outlined text-on-surface-variant" aria-hidden="true">expand_more</span>
          </summary>
          <div class="pb-5 font-body-md text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
            <?= h($product['description'] ?? $product['short_desc'] ?? vv_t('store.product.no_description')) ?>
          </div>
        </details>
        <details class="vv-accordion border-b border-outline-variant">
          <summary>
            <span class="font-mono-label text-mono-label text-on-surface uppercase hover:text-primary transition-colors"><?= vv_t('store.product.acc_shipping') ?></span>
            <span class="accordion-icon material-symbols-outlined text-on-surface-variant" aria-hidden="true">expand_more</span>
          </summary>
          <div class="pb-5 flex flex-col gap-2 font-body-md text-sm text-on-surface-variant">
            <?php if ($isDigital): ?>
              <p><?= vv_t('store.product.shipping_digital_p1') ?></p>
              <p><?= vv_t('store.product.shipping_digital_p2') ?></p>
            <?php else: ?>
              <p><?= vv_t('store.product.shipping_physical_p1') ?></p>
              <p><?= vv_t('store.product.shipping_physical_p2') ?></p>
            <?php endif; ?>
          </div>
        </details>
        <details class="vv-accordion border-b border-outline-variant">
          <summary>
            <span class="font-mono-label text-mono-label text-on-surface uppercase hover:text-primary transition-colors"><?= vv_t('store.product.acc_specs') ?></span>
            <span class="accordion-icon material-symbols-outlined text-on-surface-variant" aria-hidden="true">expand_more</span>
          </summary>
          <div class="pb-5">
            <dl class="grid grid-cols-2 gap-x-4 gap-y-2 font-body-md text-sm">
              <dt class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider"><?= vv_t('store.product.spec_type') ?></dt>
              <dd class="text-on-surface"><?= $isDigital ? vv_t('store.common.digital') : vv_t('store.common.physical') ?></dd>
              <?php if ($product['category_name']): ?>
              <dt class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider"><?= vv_t('store.product.spec_category') ?></dt>
              <dd class="text-on-surface"><?= h($product['category_name']) ?></dd>
              <?php endif; ?>
              <?php if ($product['brand'] ?? null): ?>
              <dt class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider"><?= vv_t('store.product.spec_brand') ?></dt>
              <dd class="text-on-surface"><?= h($product['brand']) ?></dd>
              <?php endif; ?>
              <?php if (!$isDigital && $product['stock'] !== null): ?>
              <dt class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider"><?= vv_t('store.product.spec_stock') ?></dt>
              <dd class="text-on-surface"><?= vv_t('store.product.spec_stock_n', null, ['N' => (int)$product['stock']]) ?></dd>
              <?php endif; ?>
            </dl>
          </div>
        </details>
      </div>
    </div>
  </div>

  <!-- Related products -->
  <?php if (!empty($related)): ?>
  <section class="mt-16 pt-10 border-t border-outline-variant" aria-labelledby="related-heading">
    <div class="flex justify-between items-end mb-6">
      <h2 id="related-heading" class="font-display text-h2 text-on-surface"><?= vv_t('store.product.related_title') ?></h2>
      <a href="catalog.php<?= $product['category_slug'] ? '?category=' . h($product['category_slug']) : '' ?>"
         class="font-mono-label text-mono-label text-primary flex items-center gap-1 hover:gap-2 transition-all duration-150 uppercase">
        <?= vv_t('store.common.view_all') ?> <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
      </a>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4" role="list" aria-label="<?= h(vv_t('store.product.related_aria')) ?>">
      <?php foreach ($related as $r): ?>
      <article role="listitem" class="product-card bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col group relative">
        <?php
        $rDigital = $r['type'] === 'digital';
        $rStock = vv_product_is_out_of_stock($r);
        $rSale = vv_product_has_sale($r);
        $rPrice = vv_product_price($r);
        $rBg = vv_category_bg($r['category_slug'] ?? null);
        ?>
        <?php if ($r['featured']): ?><span class="badge badge-primary absolute top-2 left-2 z-10"><?= vv_t('store.common.new_badge') ?></span><?php elseif ($rSale): ?><span class="badge badge-danger absolute top-2 left-2 z-10"><?= vv_t('store.common.sale_badge') ?></span><?php endif; ?>
        <a href="product.php?slug=<?= h($r['slug']) ?>"
           class="aspect-square <?= $rBg ?> rounded-lg mb-3 flex items-center justify-center border border-outline-variant/40 overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
          <span class="font-mono-label text-[10px] text-white/50 uppercase tracking-widest text-center px-2"><?= h($r['category_name'] ?? 'VeVit') ?></span>
        </a>
        <a href="product.php?slug=<?= h($r['slug']) ?>"
           class="font-body-md font-bold text-[15px] text-on-surface mb-1 line-clamp-1 hover:text-primary transition-colors">
          <?= h($r['name']) ?>
        </a>
        <div class="mt-auto pt-3 border-t border-outline-variant flex items-center justify-between">
          <span class="font-display text-[16px] font-bold text-primary"><?= vv_format_price($rPrice) ?></span>
          <?php if (!$rStock): ?>
          <button data-cart-product="<?= h(json_encode(["id" => (int)$r["id"], "name" => $r["name"], "price" => (float)$r["price"], "sale_price" => $r["sale_price"] ? (float)$r["sale_price"] : null, "type" => $r["type"], "slug" => $r["slug"]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) ?>"
            aria-label="<?= h(vv_t('store.common.add_to_cart_aria', null, ['NAME' => $r['name']])) ?>"
            class="btn btn-icon btn-sm bg-surface border border-outline-variant hover:border-primary text-on-surface hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-[16px]">add_shopping_cart</span>
          </button>
          <?php endif; ?>
        </div>
      </article>
      <?php endforeach; ?>
    </div>
  </section>
  <?php endif; ?>
</main>

<script defer src="assets/js/product-page.js"></script>

<?php include __DIR__ . '/lib/footer.php'; ?>