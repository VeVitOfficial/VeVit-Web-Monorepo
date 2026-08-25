<?php
require_once __DIR__ . '/config.php';

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$perPage = 12;
$search = trim((string)($_GET['search'] ?? ''));
$categoryFilter = trim((string)($_GET['category'] ?? ''));
$typeFilter = $_GET['type'] ?? '';
$sort = $_GET['sort'] ?? 'featured';
$dealsOnly = !empty($_GET['deals']);
$brandFilter = trim((string)($_GET['brand'] ?? ''));
$maxPrice = isset($_GET['max_price']) ? (int)$_GET['max_price'] : 0;

$vvLang = vv_i18n_get_lang();

$where = ['p.is_active = TRUE'];
$params = [];

if ($categoryFilter) {
    $where[] = 'c.slug = ?';
    $params[] = $categoryFilter;
}
if ($typeFilter && in_array($typeFilter, ['physical','digital'])) {
    $where[] = 'p.type = ?';
    $params[] = $typeFilter;
}
if ($brandFilter) {
    $where[] = 'p.brand = ?';
    $params[] = $brandFilter;
}
if ($search) {
    $where[] = '(COALESCE(pt.name, p.name) ILIKE ? OR COALESCE(pt.short_desc, p.short_desc) ILIKE ?)';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
}
if ($dealsOnly) {
    $where[] = 'p.sale_price IS NOT NULL AND p.sale_price > 0';
}
if ($maxPrice > 0) {
    $where[] = 'COALESCE(p.sale_price, p.price) <= ?';
    $params[] = $maxPrice;
}

$order = match($sort) {
    'newest' => 'p.created_at DESC',
    'cheapest' => 'COALESCE(p.sale_price, p.price) ASC',
    'expensive' => 'COALESCE(p.sale_price, p.price) DESC',
    'bestselling' => '(SELECT COALESCE(SUM(oi.quantity), 0) FROM store_order_items oi JOIN store_orders o ON oi.order_id = o.id WHERE oi.product_id = p.id AND o.status IN (\'paid\',\'shipped\',\'delivered\')) DESC, p.created_at DESC',
    default => 'p.featured DESC, p.created_at DESC'
};

$whereSql = implode(' AND ', $where);

// Count query — no translation JOIN needed (row count is language-independent).
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM store_products p LEFT JOIN store_categories c ON p.category_id = c.id WHERE $whereSql");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();
$totalPages = max(1, (int)ceil($total / $perPage));
$page = min($page, $totalPages);
$offset = ($page - 1) * $perPage;

// Product query — LEFT JOIN store_product_translations with COALESCE fallback
// to base columns for the current locale.
$productSql = "SELECT p.id, p.slug, p.price, p.sale_price, p.type, p.stock, p.images,
       p.brand, p.category_id, p.created_at, p.download_file, p.stripe_price_id,
       COALESCE(pt.name, p.name) AS name,
       COALESCE(pt.short_desc, p.short_desc) AS short_desc,
       COALESCE(pt.description, p.description) AS description,
       p.featured::int AS featured, p.is_active::int AS is_active,
       c.name AS category_name, c.slug AS category_slug
  FROM store_products p
  LEFT JOIN store_categories c ON p.category_id = c.id
  LEFT JOIN store_product_translations pt ON pt.product_id = p.id AND pt.lang = ?
  WHERE $whereSql
  ORDER BY $order
  LIMIT $perPage OFFSET $offset";
$stmt = $pdo->prepare($productSql);
$stmt->execute(array_merge([$vvLang], $params));
$products = $stmt->fetchAll();

$catStmt = $pdo->query("
  SELECT c.*, COUNT(p.id) AS product_count
  FROM store_categories c
  LEFT JOIN store_products p ON p.category_id = c.id AND p.is_active = TRUE
  GROUP BY c.id
  ORDER BY c.sort_order
");
$categories = $catStmt->fetchAll();

$currentCategory = null;
if ($categoryFilter) {
    foreach ($categories as $cat) {
        if ($cat['slug'] === $categoryFilter) { $currentCategory = $cat; break; }
    }
}

// Helper to build URL with current filters but optionally override one
function vv_url(array $overrides = []): string {
    $params = $_GET;
    foreach ($overrides as $k => $v) {
        if ($v === null || $v === '') unset($params[$k]);
        else $params[$k] = $v;
    }
    return 'catalog.php' . (empty($params) ? '' : '?' . http_build_query($params));
}

// Page meta
if ($currentCategory) {
    $pageTitle = vv_t('store.meta.title_catalog_cat', null, ['NAME' => $currentCategory['name']]);
    $metaDesc  = vv_t('store.meta.desc_catalog_cat',  null, ['NAME' => $currentCategory['name']]);
} elseif ($search) {
    $pageTitle = vv_t('store.meta.title_catalog_search');
    $metaDesc  = vv_t('store.meta.desc_catalog');
} else {
    $pageTitle = vv_t('store.meta.title_catalog');
    $metaDesc  = vv_t('store.meta.desc_catalog');
}
$activeNav   = $dealsOnly ? 'deals' : ($sort === 'newest' && !$categoryFilter && !$search ? 'new' : 'catalog');
$searchValue = $search;
$noindex     = (bool)($search || $dealsOnly || $typeFilter || $brandFilter || $maxPrice || $page > 1);
$vvSectionPath = '/store/catalog.php';
include __DIR__ . '/lib/header.php';

// Plural helper for search result count
function vv_catalog_result_word(int $n): string {
    if ($n === 1) return vv_t('store.catalog.result_one');
    if ($n > 1 && $n < 5) return vv_t('store.catalog.result_few');
    return vv_t('store.catalog.result_many');
}

// Build active filter chips
$activeFilters = [];
if ($categoryFilter && $currentCategory) {
    $activeFilters[] = ['label' => $currentCategory['name'], 'remove' => vv_url(['category' => null, 'page' => null])];
}
if ($typeFilter) {
    $activeFilters[] = ['label' => $typeFilter === 'digital' ? vv_t('store.catalog.filter_digital') : vv_t('store.catalog.filter_physical'), 'remove' => vv_url(['type' => null, 'page' => null])];
}
if ($brandFilter) {
    $activeFilters[] = ['label' => $brandFilter, 'remove' => vv_url(['brand' => null, 'page' => null])];
}
if ($dealsOnly) {
    $activeFilters[] = ['label' => vv_t('store.catalog.filter_deals'), 'remove' => vv_url(['deals' => null, 'page' => null])];
}
if ($maxPrice) {
    $activeFilters[] = ['label' => vv_t('store.catalog.filter_max_price', null, ['PRICE' => number_format($maxPrice, 0, ',', ' ')]), 'remove' => vv_url(['max_price' => null, 'page' => null])];
}
if ($search) {
    $activeFilters[] = ['label' => vv_t('store.catalog.filter_search', null, ['QUERY' => $search]), 'remove' => vv_url(['search' => null, 'page' => null])];
}
?>

<main class="flex-1 w-full max-w-store mx-auto px-margin py-8">

  <!-- Breadcrumbs -->
  <nav class="breadcrumb mb-6" aria-label="<?= h(vv_t('store.nav.breadcrumb_aria')) ?>">
    <a href="index.php"><?= vv_t('store.catalog.breadcrumb_home') ?></a>
    <span class="breadcrumb-sep material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
    <?php if ($currentCategory): ?>
      <a href="catalog.php"><?= vv_t('store.catalog.breadcrumb_catalog') ?></a>
      <span class="breadcrumb-sep material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
      <span class="text-on-surface normal-case"><?= h($currentCategory['name']) ?></span>
    <?php elseif ($search): ?>
      <a href="catalog.php"><?= vv_t('store.catalog.breadcrumb_catalog') ?></a>
      <span class="breadcrumb-sep material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
      <span class="text-on-surface normal-case"><?= vv_t('store.catalog.breadcrumb_search') ?></span>
    <?php elseif ($dealsOnly): ?>
      <a href="catalog.php"><?= vv_t('store.catalog.breadcrumb_catalog') ?></a>
      <span class="breadcrumb-sep material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
      <span class="text-on-surface normal-case"><?= vv_t('store.catalog.breadcrumb_deals') ?></span>
    <?php else: ?>
      <span class="text-on-surface normal-case"><?= vv_t('store.catalog.breadcrumb_catalog') ?></span>
    <?php endif; ?>
  </nav>

  <div class="flex flex-col md:flex-row gap-8">

    <!-- ===== Desktop Sidebar Filters ===== -->
    <aside class="hidden md:block w-64 flex-shrink-0" aria-label="<?= h(vv_t('store.catalog.filters_aria')) ?>">
      <div class="bg-surface-container border border-outline-variant rounded-xl p-5 sticky top-20">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-mono-label text-mono-label text-on-surface uppercase tracking-widest"><?= vv_t('store.catalog.filters_title') ?></h2>
          <?php if (!empty($activeFilters)): ?>
            <a href="catalog.php" class="font-caption text-caption text-primary hover:underline"><?= vv_t('store.catalog.filters_clear') ?></a>
          <?php endif; ?>
        </div>

        <!-- Categories -->
        <div class="mb-6">
          <h3 class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-widest mb-3"><?= vv_t('store.catalog.cat_title') ?></h3>
          <nav class="flex flex-col gap-0.5" aria-label="<?= h(vv_t('store.catalog.cat_title')) ?>">
            <a href="<?= h(vv_url(['category' => null, 'page' => null])) ?>"
               class="flex items-center justify-between px-2 py-1.5 rounded-md transition-colors <?= !$categoryFilter ? 'text-primary bg-primary/8 font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high' ?>"
               <?= !$categoryFilter ? 'aria-current="true"' : '' ?>>
              <span class="flex items-center gap-2 text-sm"><span class="material-symbols-outlined text-[16px]" aria-hidden="true">grid_view</span> <?= vv_t('store.catalog.cat_all') ?></span>
            </a>
            <?php foreach ($categories as $cat): $active = $categoryFilter === $cat['slug']; ?>
            <a href="<?= h(vv_url(['category' => $cat['slug'], 'page' => null])) ?>"
               class="flex items-center justify-between px-2 py-1.5 rounded-md transition-colors <?= $active ? 'text-primary bg-primary/8 font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high' ?>"
               <?= $active ? 'aria-current="true"' : '' ?>>
              <span class="flex items-center gap-2 text-sm">
                <span class="material-symbols-outlined text-[16px]" aria-hidden="true"><?= h($cat['icon'] ?? 'label') ?></span>
                <?= h($cat['name']) ?>
              </span>
              <span class="font-caption text-[11px] text-on-surface-variant"><?= (int)$cat['product_count'] ?></span>
            </a>
            <?php endforeach; ?>
          </nav>
        </div>

        <!-- Product type -->
        <div class="mb-6">
          <h3 class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-widest mb-3"><?= vv_t('store.catalog.type_title') ?></h3>
          <nav class="flex flex-col gap-0.5" aria-label="<?= h(vv_t('store.catalog.type_title')) ?>">
            <?php
            $typeOptions = ['' => vv_t('store.catalog.type_all'), 'physical' => vv_t('store.catalog.type_physical'), 'digital' => vv_t('store.catalog.type_digital')];
            $typeIcons   = ['' => 'all_inclusive', 'physical' => 'local_shipping', 'digital' => 'download'];
            foreach ($typeOptions as $val => $label):
              $active = $typeFilter === (string)$val || ($val === '' && !$typeFilter);
            ?>
            <a href="<?= h(vv_url(['type' => $val, 'page' => null])) ?>"
               class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors <?= $active ? 'text-primary bg-primary/8 font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high' ?>"
               <?= $active ? 'aria-current="true"' : '' ?>>
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true"><?= $typeIcons[$val] ?></span>
              <?= $label ?>
            </a>
            <?php endforeach; ?>
          </nav>
        </div>

        <!-- Max price -->
        <div class="mb-5">
          <h3 class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-widest mb-3"><?= vv_t('store.catalog.price_title') ?></h3>
          <form method="get" class="flex flex-col gap-2">
            <?php foreach ($_GET as $k => $v): if ($k === 'max_price' || $k === 'page') continue; ?>
              <input type="hidden" name="<?= h($k) ?>" value="<?= h(is_array($v) ? '' : (string)$v) ?>">
            <?php endforeach; ?>
            <div class="relative">
              <input type="number" name="max_price" id="maxPriceDesktop" min="0" step="100"
                value="<?= $maxPrice ?: '' ?>" placeholder="<?= vv_t('store.catalog.price_placeholder') ?>"
                aria-label="<?= h(vv_t('store.catalog.price_aria')) ?>"
                class="form-input text-sm h-[38px] rounded-lg">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 font-mono-label text-[11px] text-on-surface-variant pointer-events-none"><?= vv_t('store.common.currency') ?></span>
            </div>
            <button type="submit" class="btn btn-outline btn-sm w-full"><?= vv_t('store.catalog.price_apply') ?></button>
          </form>
        </div>

        <!-- Deals toggle -->
        <a href="<?= h(vv_url(['deals' => $dealsOnly ? null : 1, 'page' => null])) ?>"
           class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors <?= $dealsOnly ? 'text-primary bg-primary/8 font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high' ?>"
           role="checkbox" aria-checked="<?= $dealsOnly ? 'true' : 'false' ?>">
          <span class="material-symbols-outlined text-[18px] <?= $dealsOnly ? 'icon-filled' : '' ?>" aria-hidden="true"><?= $dealsOnly ? 'check_box' : 'check_box_outline_blank' ?></span>
          <?= vv_t('store.catalog.deals_only') ?>
        </a>
      </div>
    </aside>

    <!-- ===== Product area ===== -->
    <section class="flex-1 flex flex-col gap-5 min-w-0" aria-labelledby="catalog-heading">

      <!-- Mobile: filter button + sort -->
      <div class="flex items-center gap-3 md:hidden">
        <button type="button" id="mobileFilterBtn" aria-controls="mobileFilterDrawer" aria-expanded="false"
          class="btn btn-outline btn-sm flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]" aria-hidden="true">tune</span>
          <?= vv_t('store.catalog.filters_title') ?>
          <?php if (!empty($activeFilters)): ?>
            <span class="ml-1 min-w-[18px] h-[18px] bg-primary-container text-on-primary-fixed text-[10px] font-bold rounded-full flex items-center justify-center"><?= count($activeFilters) ?></span>
          <?php endif; ?>
        </button>
        <form method="get" class="flex items-center gap-2 flex-1 justify-end">
          <label for="mobileSortSelect" class="font-mono-label text-[11px] text-on-surface-variant uppercase sr-only"><?= vv_t('store.catalog.sort_aria') ?></label>
          <?php foreach ($_GET as $k => $v): if ($k === 'sort' || $k === 'page') continue; ?>
            <input type="hidden" name="<?= h($k) ?>" value="<?= h(is_array($v) ? '' : (string)$v) ?>">
          <?php endforeach; ?>
          <select id="mobileSortSelect" name="sort" data-submit-on-change
            class="form-input form-select text-sm h-[36px] rounded-lg flex-1 max-w-[180px]">
            <option value="featured" <?= $sort === 'featured' ? 'selected' : '' ?>><?= vv_t('store.catalog.sort_featured') ?></option>
            <option value="newest" <?= $sort === 'newest' ? 'selected' : '' ?>><?= vv_t('store.catalog.sort_newest') ?></option>
            <option value="cheapest" <?= $sort === 'cheapest' ? 'selected' : '' ?>><?= vv_t('store.catalog.sort_cheapest') ?></option>
            <option value="expensive" <?= $sort === 'expensive' ? 'selected' : '' ?>><?= vv_t('store.catalog.sort_expensive') ?></option>
          </select>
        </form>
      </div>

      <!-- Heading + sort (desktop) -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 id="catalog-heading" class="font-display text-h2 font-bold text-on-surface">
            <?php
            if ($currentCategory)   echo h($currentCategory['name']);
            elseif ($dealsOnly)     echo vv_t('store.catalog.heading_deals');
            elseif ($sort === 'newest' && !$search) echo vv_t('store.catalog.heading_new');
            elseif ($search)        echo vv_t('store.catalog.heading_search');
            else                    echo vv_t('store.catalog.heading_catalog');
            ?>
          </h1>
          <?php if ($search): ?>
          <p class="font-body-md text-sm text-on-surface-variant mt-0.5">
            <?= vv_t('store.catalog.search_meta', null, ['QUERY' => $search, 'TOTAL' => $total, 'RESULTS' => vv_catalog_result_word($total)]) ?>
          </p>
          <?php endif; ?>
        </div>
        <!-- Desktop sort -->
        <form method="get" class="hidden md:flex items-center gap-2">
          <label for="desktopSortSelect" class="font-mono-label text-[11px] text-on-surface-variant uppercase whitespace-nowrap"><?= vv_t('store.catalog.sort_label') ?></label>
          <?php foreach ($_GET as $k => $v): if ($k === 'sort' || $k === 'page') continue; ?>
            <input type="hidden" name="<?= h($k) ?>" value="<?= h(is_array($v) ? '' : (string)$v) ?>">
          <?php endforeach; ?>
          <select id="desktopSortSelect" name="sort" data-submit-on-change
            class="form-input form-select text-sm h-[36px] rounded-lg w-auto">
            <option value="featured" <?= $sort === 'featured' ? 'selected' : '' ?>><?= vv_t('store.catalog.sort_featured') ?></option>
            <option value="newest" <?= $sort === 'newest' ? 'selected' : '' ?>><?= vv_t('store.catalog.sort_newest') ?></option>
            <option value="cheapest" <?= $sort === 'cheapest' ? 'selected' : '' ?>><?= vv_t('store.catalog.sort_cheapest') ?></option>
            <option value="expensive" <?= $sort === 'expensive' ? 'selected' : '' ?>><?= vv_t('store.catalog.sort_expensive') ?></option>
          </select>
        </form>
      </div>

      <!-- Active filter chips + result count -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-mono-label text-[11px] text-on-surface-variant uppercase whitespace-nowrap"><?= vv_t('store.catalog.count_products', null, ['N' => $total]) ?></span>
        <?php foreach ($activeFilters as $f): ?>
          <a href="<?= h($f['remove']) ?>" class="filter-chip" aria-label="<?= h(vv_t('store.catalog.filter_chip_remove', null, ['LABEL' => $f['label']])) ?>">
            <?= h($f['label']) ?>
            <span class="chip-remove material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
          </a>
        <?php endforeach; ?>
        <?php if (count($activeFilters) > 1): ?>
          <a href="catalog.php" class="font-caption text-caption text-on-surface-variant hover:text-primary transition-colors underline underline-offset-2"><?= vv_t('store.catalog.filters_clear') ?></a>
        <?php endif; ?>
      </div>

      <?php if (empty($products)): ?>
        <!-- Empty state -->
        <div class="text-center py-20 flex flex-col items-center gap-4" role="status">
          <div class="w-20 h-20 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center">
            <span class="material-symbols-outlined text-[40px] text-on-surface-variant/50" aria-hidden="true">search_off</span>
          </div>
          <h2 class="font-h2 text-h2 text-on-surface"><?= vv_t('store.catalog.empty_title') ?></h2>
          <p class="font-body-md text-on-surface-variant max-w-sm">
            <?= $search ? vv_t('store.catalog.empty_search') : vv_t('store.catalog.empty_filters') ?>
          </p>
          <a href="catalog.php" class="btn btn-primary">
            <span class="material-symbols-outlined text-[16px]" aria-hidden="true">storefront</span>
            <?= vv_t('store.catalog.empty_show_all') ?>
          </a>
        </div>
      <?php else: ?>
        <!-- Product grid -->
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="<?= h(vv_t('store.catalog.products_aria')) ?>">
          <?php foreach ($products as $p): ?>
          <article role="listitem" class="product-card bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col group relative">
            <?php
            $isDigital  = $p['type'] === 'digital';
            $outOfStock = vv_product_is_out_of_stock($p);
            $hasSale    = vv_product_has_sale($p);
            $price      = vv_product_price($p);
            $catBg      = vv_category_bg($p['category_slug'] ?? null);
            ?>
            <?php if ($p['featured']): ?>
              <span class="badge badge-primary absolute top-2 left-2 z-10"><?= vv_t('store.common.new_badge') ?></span>
            <?php elseif ($hasSale): ?>
              <span class="badge badge-danger absolute top-2 left-2 z-10"><?= vv_t('store.common.sale_badge') ?></span>
            <?php endif; ?>
            <a href="product.php?slug=<?= h($p['slug']) ?>"
               class="aspect-square <?= $catBg ?> rounded-lg mb-4 flex items-center justify-center relative overflow-hidden border border-outline-variant/40 group-hover:scale-[1.02] transition-transform duration-300">
              <span class="font-mono-label text-[11px] text-white/60 uppercase tracking-widest text-center px-3"><?= h($p['category_name'] ?? 'VeVit') ?></span>
            </a>
            <div class="flex items-center gap-1.5 flex-wrap mb-1.5">
              <?php if ($isDigital): ?>
                <span class="badge badge-primary"><?= vv_t('store.common.digital') ?></span>
              <?php endif; ?>
              <?php if (!$isDigital && $p['stock'] !== null): ?>
                <span class="badge <?= $p['stock'] > 0 ? 'badge-success' : 'badge-danger' ?>">
                  <?= $p['stock'] > 0 ? vv_t('store.common.in_stock') : vv_t('store.common.out_of_stock') ?>
                </span>
              <?php endif; ?>
            </div>
            <a href="product.php?slug=<?= h($p['slug']) ?>"
               class="font-body-md font-bold text-[16px] text-on-surface mb-1 line-clamp-1 hover:text-primary transition-colors duration-150">
              <?= h($p['name']) ?>
            </a>
            <p class="font-body-md text-[13px] text-on-surface-variant line-clamp-2 mb-3 flex-1 leading-relaxed">
              <?= h($p['short_desc'] ?? '') ?>
            </p>
            <div class="flex justify-between items-center mt-auto pt-3 border-t border-outline-variant">
              <div class="flex flex-col gap-0.5">
                <span class="font-display text-[18px] font-bold text-primary"><?= vv_format_price($price) ?></span>
                <?php if ($hasSale): ?>
                  <span class="font-caption text-caption text-on-surface-variant line-through"><?= vv_format_price((float)$p['price']) ?></span>
                <?php endif; ?>
              </div>
              <?php if ($outOfStock): ?>
                <button disabled aria-label="<?= h(vv_t('store.common.out_of_stock_aria')) ?>" class="btn btn-icon btn-sm bg-surface border border-outline-variant text-on-surface-variant cursor-not-allowed opacity-50">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">block</span>
                </button>
              <?php else: ?>
                <button data-cart-product="<?= h(json_encode([
                    "id" => (int)$p["id"], "name" => $p["name"], "price" => (float)$p["price"],
                    "sale_price" => $p["sale_price"] ? (float)$p["sale_price"] : null,
                    "type" => $p["type"], "slug" => $p["slug"]
                  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) ?>"
                  aria-label="<?= h(vv_t('store.common.add_to_cart_aria', null, ['NAME' => $p['name']])) ?>"
                  class="btn btn-icon btn-sm bg-surface border border-outline-variant hover:border-primary text-on-surface hover:text-primary transition-colors">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add_shopping_cart</span>
                </button>
              <?php endif; ?>
            </div>
          </article>
          <?php endforeach; ?>
        </div>

        <!-- Pagination -->
        <?php if ($totalPages > 1): ?>
        <nav class="mt-10 flex justify-center items-center gap-1.5 flex-wrap" aria-label="<?= h(vv_t('store.catalog.pagination_aria')) ?>">
          <?php if ($page > 1): ?>
            <a href="<?= h(vv_url(['page' => $page-1])) ?>" aria-label="<?= h(vv_t('store.catalog.page_prev')) ?>"
               class="btn btn-icon btn-sm btn-outline">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>
            </a>
          <?php endif; ?>
          <?php
          $startPage = max(1, $page - 2);
          $endPage = min($totalPages, $page + 2);
          if ($startPage > 1): ?>
            <a href="<?= h(vv_url(['page' => 1])) ?>" class="btn btn-icon btn-sm btn-outline" aria-label="<?= h(vv_t('store.catalog.page_n', null, ['N' => 1])) ?>">1</a>
            <?php if ($startPage > 2): ?><span class="font-mono-label text-[12px] text-on-surface-variant px-1">…</span><?php endif; ?>
          <?php endif; ?>
          <?php for ($i = $startPage; $i <= $endPage; $i++): ?>
            <?php if ($i === $page): ?>
              <span class="btn btn-icon btn-sm btn-primary" aria-current="page" aria-label="<?= h(vv_t('store.catalog.page_n', null, ['N' => $i])) ?>"><?= $i ?></span>
            <?php else: ?>
              <a href="<?= h(vv_url(['page' => $i])) ?>" class="btn btn-icon btn-sm btn-outline" aria-label="<?= h(vv_t('store.catalog.page_n', null, ['N' => $i])) ?>"><?= $i ?></a>
            <?php endif; ?>
          <?php endfor; ?>
          <?php if ($endPage < $totalPages): ?>
            <?php if ($endPage < $totalPages - 1): ?><span class="font-mono-label text-[12px] text-on-surface-variant px-1">…</span><?php endif; ?>
            <a href="<?= h(vv_url(['page' => $totalPages])) ?>" class="btn btn-icon btn-sm btn-outline" aria-label="<?= h(vv_t('store.catalog.page_n', null, ['N' => $totalPages])) ?>"><?= $totalPages ?></a>
          <?php endif; ?>
          <?php if ($page < $totalPages): ?>
            <a href="<?= h(vv_url(['page' => $page+1])) ?>" aria-label="<?= h(vv_t('store.catalog.page_next')) ?>"
               class="btn btn-icon btn-sm btn-outline">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
            </a>
          <?php endif; ?>
        </nav>
        <?php endif; ?>
      <?php endif; ?>
    </section>
  </div>
</main>

<!-- ===== Mobile Filter Drawer ===== -->
<div id="mobileFilterDrawer" class="mobile-drawer" role="dialog" aria-modal="true" aria-label="<?= h(vv_t('store.catalog.filters_aria')) ?>" inert>
  <div class="mobile-drawer__backdrop" id="filterBackdrop" aria-hidden="true"></div>
  <div class="mobile-drawer__panel">
    <div class="mobile-drawer__header">
      <h2 class="font-mono-label text-mono-label text-on-surface uppercase tracking-widest"><?= vv_t('store.catalog.filters_title') ?></h2>
      <button type="button" id="filterDrawerClose" aria-label="<?= h(vv_t('store.catalog.close_filters')) ?>"
        class="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors">
        <span class="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
      </button>
    </div>
    <div class="mobile-drawer__nav px-0 py-0">
      <div class="p-5 flex flex-col gap-5">

        <!-- Category -->
        <fieldset>
          <legend class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-widest mb-3"><?= vv_t('store.catalog.cat_title') ?></legend>
          <div class="flex flex-col gap-1">
            <a href="<?= h(vv_url(['category' => null, 'page' => null])) ?>"
               class="flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors <?= !$categoryFilter ? 'text-primary bg-primary/8 font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high' ?>">
              <span class="flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">grid_view</span> <?= vv_t('store.catalog.cat_all') ?></span>
            </a>
            <?php foreach ($categories as $cat): $active = $categoryFilter === $cat['slug']; ?>
            <a href="<?= h(vv_url(['category' => $cat['slug'], 'page' => null])) ?>"
               class="flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors <?= $active ? 'text-primary bg-primary/8 font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high' ?>">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]"><?= h($cat['icon'] ?? 'label') ?></span>
                <?= h($cat['name']) ?>
              </span>
              <span class="text-[11px] text-on-surface-variant"><?= (int)$cat['product_count'] ?></span>
            </a>
            <?php endforeach; ?>
          </div>
        </fieldset>

        <!-- Type -->
        <fieldset>
          <legend class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-widest mb-3"><?= vv_t('store.catalog.type_title') ?></legend>
          <div class="flex flex-col gap-1">
            <?php foreach ($typeOptions as $val => $label): $active = $typeFilter === (string)$val || ($val === '' && !$typeFilter); ?>
            <a href="<?= h(vv_url(['type' => $val, 'page' => null])) ?>"
               class="flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors <?= $active ? 'text-primary bg-primary/8 font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high' ?>">
              <span class="material-symbols-outlined text-[16px]"><?= $typeIcons[$val] ?></span>
              <?= $label ?>
            </a>
            <?php endforeach; ?>
          </div>
        </fieldset>

        <!-- Price -->
        <div>
          <h3 class="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-widest mb-3"><?= vv_t('store.catalog.price_title') ?></h3>
          <form method="get" class="flex gap-2">
            <?php foreach ($_GET as $k => $v): if ($k === 'max_price' || $k === 'page') continue; ?>
              <input type="hidden" name="<?= h($k) ?>" value="<?= h(is_array($v) ? '' : (string)$v) ?>">
            <?php endforeach; ?>
            <div class="relative flex-1">
              <input type="number" name="max_price" min="0" step="100"
                value="<?= $maxPrice ?: '' ?>" placeholder="<?= vv_t('store.catalog.price_placeholder') ?>"
                aria-label="<?= h(vv_t('store.catalog.price_aria')) ?>"
                class="form-input text-sm h-[38px] rounded-lg w-full">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 font-mono-label text-[11px] text-on-surface-variant pointer-events-none"><?= vv_t('store.common.currency') ?></span>
            </div>
            <button type="submit" class="btn btn-outline btn-sm whitespace-nowrap"><?= vv_t('store.catalog.price_apply') ?></button>
          </form>
        </div>

        <!-- Deals -->
        <div>
          <a href="<?= h(vv_url(['deals' => $dealsOnly ? null : 1, 'page' => null])) ?>"
             class="flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors <?= $dealsOnly ? 'text-primary bg-primary/8 font-semibold' : 'text-on-surface-variant hover:bg-surface-container-high' ?>"
             role="checkbox" aria-checked="<?= $dealsOnly ? 'true' : 'false' ?>">
            <span class="material-symbols-outlined text-[18px] <?= $dealsOnly ? 'icon-filled' : '' ?>">
              <?= $dealsOnly ? 'check_box' : 'check_box_outline_blank' ?>
            </span>
            <?= vv_t('store.catalog.deals_only') ?>
          </a>
        </div>

        <?php if (!empty($activeFilters)): ?>
        <a href="catalog.php" class="btn btn-outline w-full">
          <span class="material-symbols-outlined text-[16px]">filter_alt_off</span>
          <?= vv_t('store.catalog.filters_clear_all') ?>
        </a>
        <?php endif; ?>
      </div>
    </div>
  </div>
</div>

<script src="assets/js/catalog-page.js"></script>

<?php include __DIR__ . '/lib/footer.php'; ?>