<?php
require_once __DIR__ . '/config.php';

$slug = $_GET['slug'] ?? '';
if (!$slug) { header('Location: index.html'); exit; }

$stmt = $pdo->prepare("SELECT p.*, p.featured::int AS featured, p.is_active::int AS is_active, c.name AS category_name, c.slug AS category_slug FROM store_products p LEFT JOIN store_categories c ON p.category_id = c.id WHERE p.slug = ? AND p.is_active = TRUE");
$stmt->execute([$slug]);
$product = $stmt->fetch();
if (!$product) { http_response_code(404); $pageTitle='Nenalezeno'; include __DIR__.'/lib/header.php'; ?>
<main class="flex-1 max-w-[1200px] mx-auto px-margin py-xl text-center flex flex-col items-center gap-md">
  <span class="material-symbols-outlined text-[80px] text-on-surface-variant/50">search_off</span>
  <h1 class="font-display text-h1 text-on-surface">Produkt nenalezen</h1>
  <p class="font-body-md text-on-surface-variant">Tento produkt už neexistuje nebo byl odstraněn.</p>
  <a href="catalog.php" class="bg-primary-container text-on-primary-fixed font-mono-label text-mono-label py-sm px-md rounded-DEFAULT border-2 border-on-primary-fixed neo-shadow uppercase">Zpět do katalogu</a>
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

$relatedStmt = $pdo->prepare("SELECT p.*, p.featured::int AS featured, p.is_active::int AS is_active, c.name AS category_name, c.slug AS category_slug FROM store_products p LEFT JOIN store_categories c ON p.category_id = c.id WHERE p.is_active = TRUE AND p.id != ? AND (p.category_id = ? OR p.type = ?) ORDER BY p.featured DESC, p.created_at DESC LIMIT 4");
$relatedStmt->execute([$product['id'], $product['category_id'], $product['type']]);
$related = $relatedStmt->fetchAll();

$pageTitle   = $product['name'] . ' — VeVit Store';
$metaDesc    = mb_substr($product['short_desc'] ?? 'Produkt VeVit Store — bezpečná platba, okamžité stažení digitálních produktů.', 0, 155);
$activeNav   = 'catalog';
$noindex     = false;
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
  <nav class="breadcrumb mb-8" aria-label="Navigační drobky">
    <a href="index.html">Domů</a>
    <span class="breadcrumb-sep material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
    <a href="catalog.php">Katalog</a>
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
      <div class="w-full aspect-square <?= $catBg ?> rounded-xl overflow-hidden border border-outline-variant relative" role="img" aria-label="Obrázek produktu <?= h($product['name']) ?>">
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[60px] text-white/20" aria-hidden="true">image</span>
          <span class="font-mono-label text-[11px] text-white/40 uppercase tracking-widest text-center px-6"><?= h($product['category_name'] ?? 'VeVit') ?></span>
        </div>
        <?php if ($product['featured']): ?>
          <div class="absolute top-3 left-3"><span class="badge badge-primary">Nové</span></div>
        <?php endif; ?>
        <?php if ($hasSale): ?>
          <div class="absolute top-3 right-3"><span class="badge badge-danger">Sleva</span></div>
        <?php endif; ?>
      </div>
      <!-- Thumbnail strip (placeholder) -->
      <div class="grid grid-cols-4 gap-2">
        <?php for ($i = 0; $i < 4; $i++): ?>
          <button type="button" class="aspect-square <?= $catBg ?> rounded-lg border-2 <?= $i === 0 ? 'border-primary' : 'border-outline-variant/50 opacity-60' ?> hover:opacity-100 hover:border-primary transition-all flex items-center justify-center"
            aria-label="Obrázek <?= $i + 1 ?>">
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
          <span class="badge badge-primary">Digitální produkt</span>
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
          <?= $product['stock'] > 0 ? 'Skladem (' . (int)$product['stock'] . ' ks)' : 'Vyprodáno' ?>
        </span>
      </div>
      <?php elseif ($isDigital): ?>
      <div class="bg-primary/8 border border-primary/30 rounded-xl p-4 mb-5">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-primary text-[20px] icon-filled flex-shrink-0 mt-0.5" aria-hidden="true">download</span>
          <div>
            <p class="font-mono-label text-mono-label text-primary uppercase">Digitální produkt</p>
            <p class="font-body-md text-sm text-on-surface-variant mt-0.5">Ke stažení ihned po potvrzení platby. Odkaz je platný 72 h (max. 5 stažení). Fyzická doprava není potřeba.</p>
          </div>
        </div>
      </div>
      <?php endif; ?>

      <hr class="border-outline-variant mb-5">

      <!-- Actions -->
      <div class="flex flex-wrap gap-3 mb-6">
        <?php if ($outOfStock): ?>
          <button disabled class="btn btn-lg flex-1 bg-surface-container-high text-on-surface-variant border-2 border-outline-variant cursor-not-allowed opacity-50">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">block</span> Vyprodáno
          </button>
        <?php elseif ($isDigital): ?>
          <button data-product-action="buy" class="btn btn-lg btn-primary flex-1">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">download</span> Koupit a stáhnout
          </button>
          <button data-product-action="add" aria-label="Přidat do košíku" class="btn btn-lg btn-outline btn-icon" style="width: 52px; flex: none">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add_shopping_cart</span>
          </button>
        <?php else: ?>
          <div class="qty-group" role="group" aria-label="Množství">
            <button data-quantity-delta="-1" aria-label="Snížit množství">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">remove</span>
            </button>
            <span id="qtyVal" class="qty-val" aria-live="polite" aria-atomic="true">1</span>
            <button data-quantity-delta="1" aria-label="Zvýšit množství">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            </button>
          </div>
          <button data-product-action="add" class="btn btn-lg btn-primary flex-1">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">shopping_bag</span> Do košíku
          </button>
        <?php endif; ?>
        <button id="favoriteButton" type="button" aria-pressed="false" aria-describedby="favoriteStatus" class="btn btn-lg btn-outline">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">favorite</span>
          Přidat do oblíbených
        </button>
      </div>
      <p id="favoriteStatus" class="font-caption text-caption text-on-surface-variant mb-4" aria-live="polite"></p>

      <!-- Trust badges -->
      <div class="flex flex-wrap gap-3 mb-6">
        <div class="flex items-center gap-1.5 text-on-surface-variant">
          <span class="material-symbols-outlined text-[16px] text-primary icon-filled" aria-hidden="true">lock</span>
          <span class="font-caption text-caption">Bezpečná platba</span>
        </div>
        <div class="flex items-center gap-1.5 text-on-surface-variant">
          <span class="material-symbols-outlined text-[16px] text-primary icon-filled" aria-hidden="true">verified</span>
          <span class="font-caption text-caption">Ověřený produkt</span>
        </div>
        <?php if (!$isDigital): ?>
        <div class="flex items-center gap-1.5 text-on-surface-variant">
          <span class="material-symbols-outlined text-[16px] text-primary icon-filled" aria-hidden="true">assignment_return</span>
          <span class="font-caption text-caption">Vrácení dle obchodních podmínek</span>
        </div>
        <?php endif; ?>
      </div>

      <!-- Accordions -->
      <div class="border-t border-outline-variant">
        <details class="vv-accordion border-b border-outline-variant">
          <summary>
            <span class="font-mono-label text-mono-label text-on-surface uppercase hover:text-primary transition-colors">Popis produktu</span>
            <span class="accordion-icon material-symbols-outlined text-on-surface-variant" aria-hidden="true">expand_more</span>
          </summary>
          <div class="pb-5 font-body-md text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
            <?= h($product['description'] ?? $product['short_desc'] ?? 'Bez popisu.') ?>
          </div>
        </details>
        <details class="vv-accordion border-b border-outline-variant">
          <summary>
            <span class="font-mono-label text-mono-label text-on-surface uppercase hover:text-primary transition-colors">Doprava &amp; vrácení</span>
            <span class="accordion-icon material-symbols-outlined text-on-surface-variant" aria-hidden="true">expand_more</span>
          </summary>
          <div class="pb-5 flex flex-col gap-2 font-body-md text-sm text-on-surface-variant">
            <?php if ($isDigital): ?>
              <p>Digitální produkt — stahování není vázáno na dopravce. Po potvrzení platby obdržíte odkaz ke stažení.</p>
              <p>Odkaz je platný <strong class="text-on-surface">72 hodin</strong> a umožňuje až <strong class="text-on-surface">5 stažení</strong>.</p>
            <?php else: ?>
              <p>Konkrétní způsob, cenu a odhad dopravy potvrzuje objednávka před zaplacením.</p>
              <p>Možnost vrácení se řídí aktuálními obchodními podmínkami a serverově nastaveným obchodním oknem; tato stránka neuvádí právní lhůtu.</p>
            <?php endif; ?>
          </div>
        </details>
        <details class="vv-accordion border-b border-outline-variant">
          <summary>
            <span class="font-mono-label text-mono-label text-on-surface uppercase hover:text-primary transition-colors">Specifikace</span>
            <span class="accordion-icon material-symbols-outlined text-on-surface-variant" aria-hidden="true">expand_more</span>
          </summary>
          <div class="pb-5">
            <dl class="grid grid-cols-2 gap-x-4 gap-y-2 font-body-md text-sm">
              <dt class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">Typ</dt>
              <dd class="text-on-surface"><?= $isDigital ? 'Digitální' : 'Fyzický' ?></dd>
              <?php if ($product['category_name']): ?>
              <dt class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">Kategorie</dt>
              <dd class="text-on-surface"><?= h($product['category_name']) ?></dd>
              <?php endif; ?>
              <?php if ($product['brand'] ?? null): ?>
              <dt class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">Značka</dt>
              <dd class="text-on-surface"><?= h($product['brand']) ?></dd>
              <?php endif; ?>
              <?php if (!$isDigital && $product['stock'] !== null): ?>
              <dt class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-wider">Sklad</dt>
              <dd class="text-on-surface"><?= (int)$product['stock'] ?> ks</dd>
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
      <h2 id="related-heading" class="font-display text-h2 text-on-surface">Podobné produkty</h2>
      <a href="catalog.php<?= $product['category_slug'] ? '?category=' . h($product['category_slug']) : '' ?>"
         class="font-mono-label text-mono-label text-primary flex items-center gap-1 hover:gap-2 transition-all duration-150 uppercase">
        Zobrazit vše <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
      </a>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4" role="list" aria-label="Podobné produkty">
      <?php foreach ($related as $r): ?>
      <article role="listitem" class="product-card bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col group relative">
        <?php
        $rDigital = $r['type'] === 'digital';
        $rStock = vv_product_is_out_of_stock($r);
        $rSale = vv_product_has_sale($r);
        $rPrice = vv_product_price($r);
        $rBg = vv_category_bg($r['category_slug'] ?? null);
        ?>
        <?php if ($r['featured']): ?><span class="badge badge-primary absolute top-2 left-2 z-10">Nové</span><?php elseif ($rSale): ?><span class="badge badge-danger absolute top-2 left-2 z-10">Sleva</span><?php endif; ?>
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
            aria-label="Přidat <?= h($r['name']) ?> do košíku"
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
