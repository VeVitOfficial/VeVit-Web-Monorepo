<?php
// Tools hub — server-side render z registru (i18n). Nahrazuje statický index.html.
// Načtení i18n-bootstrap + registry + icons + <!DOCTYPE/head/header> řeší header.php.
require_once __DIR__ . '/includes/header.php';

$lang = vv_tools_lang();

$totalN    = count(all_tools());
$clientN   = client_count();
$catN      = count(CATEGORY_ORDER);
$newTools  = new_tools(24);
$byCat     = tools_by_category(); // cat => pole canonical tools (raw)

/**
 * Lokalizovaná karta nástroje. Zachovává DOM háčky hub.js
 * (data-slug/data-category/data-processing-location/data-status/data-new)
 * a CSS třídy orig. statického index.html.
 */
if (!function_exists('vv_hub_card')):
function vv_hub_card(array $t, string $lang): string {
    $color   = CATEGORY_COLORS[$t['cat']] ?? '#10b981';
    $locMeta = location_meta_i18n($t['loc'], $lang);      // [label, icon, tone, title]
    $locCls  = $locMeta['tone'] === 'local' ? 'badge-loc-local' : 'badge-loc-other';
    $proc    = $t['processing_location'];                 // client|vevit_server|external_ai
    $status  = $t['status'];
    $isNew   = (bool)$t['new'];

    $svg20 = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' . icon_svg($t['icon'], 20) . '</svg>';
    $svg12 = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' . icon_svg($locMeta['icon'], 12) . '</svg>';

    $out  = '<a class="tool-card" href="/tools/' . e($t['slug']) . '"'
          . ' data-slug="' . e($t['slug']) . '"'
          . ' data-category="' . e($t['cat']) . '"'
          . ' data-processing-location="' . e($proc) . '"'
          . ' data-status="' . e($status) . '"'
          . ' data-new="' . ($isNew ? 'true' : 'false') . '">';
    $out .= '<span class="accent" style="background:' . $color . '"></span>';
    $out .= '<div class="top"><span class="icon-box" style="background:' . $color . '15">' . $svg20 . '</span>';
    if ($isNew)  $out .= '<span class="badge badge-new">' . e(vv_t('hub.badge_new', $lang)) . '</span>';
    if ($status !== 'working') $out .= '<span class="badge badge-status-' . e($status) . '">' . e(status_label($status, $lang)) . '</span>';
    $out .= '</div>';
    $out .= '<h3 class="name">' . e(tool_name($t, $lang)) . '</h3>';
    $out .= '<p class="desc">' . e(tool_desc($t, $lang)) . '</p>';
    $out .= '<div class="footer"><span class="badge ' . $locCls . '" title="' . e($locMeta['title']) . '">' . $svg12 . e($locMeta['label']) . '</span>';
    $out .= '<span class="open">' . e(vv_t('hub.card_open', $lang)) . '</span></div>';
    $out .= '</a>';
    return $out;
}

/** Sekce kategorie (nebo #nove). $barColor = NULL → default emerald (nove). */
function vv_hub_section(string $id, string $title, string $desc, array $tools, string $lang, ?string $barColor = null, bool $showCount = true): string {
    $bar = $barColor ?? 'var(--color-emerald)';
    $out  = '<section class="section" id="' . e($id) . '">';
    $out .= '<div class="section-head"><span class="bar" style="background:' . $bar . '"></span><h2>' . e($title) . '</h2>';
    if ($showCount) $out .= '<span class="count">' . count($tools) . '</span>';
    $out .= '</div>';
    if ($desc !== '') $out .= '<p class="section-desc">' . e($desc) . '</p>';
    $out .= '<div class="grid">';
    foreach ($tools as $t) $out .= vv_hub_card($t, $lang);
    $out .= '</div></section>';
    return $out;
}
endif;
?>
<main class="main">
  <section class="hero">
    <div class="hero-glow"></div>
    <div class="hero-inner">
      <div class="eyebrow"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><?= icon_svg('Wrench', 14) ?></svg> <?= e(vv_t('hub.eyebrow', $lang)) ?></div>
      <h1><?= e(vv_t('hub.h1_pre', $lang)) ?> <span class="g-emerald"><?= e(vv_t('hub.h1_mid', $lang)) ?></span><span class="g-white"> <?= e(vv_t('hub.h1_amp', $lang)) ?> </span><span class="g-sky"><?= e(vv_t('hub.h1_post', $lang)) ?></span></h1>
      <p class="subtitle"><?= e(vv_t('hub.subtitle', $lang)) ?></p>

      <div class="pills">
        <span class="pill"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><?= icon_svg('Zap', 14) ?></svg> <?= e(vv_t('hub.pill_total', $lang, ['total' => $totalN])) ?></span>
        <span class="pill"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><?= icon_svg('ShieldCheck', 14) ?></svg> <?= e(vv_t('hub.pill_local', $lang)) ?></span>
        <span class="pill"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><?= icon_svg('Gift', 14) ?></svg> <?= e(vv_t('hub.pill_free', $lang)) ?></span>
      </div>

      <?php $strong = function ($n) { return '<strong>' . (int)$n . '</strong>'; }; ?>
      <div class="stats-row">
        <span><?= vv_t('hub.stat_local', $lang, ['client' => $strong($clientN)]) ?></span>
        <span class="sep">·</span>
        <span><?= vv_t('hub.stat_categories', $lang, ['cats' => $strong($catN)]) ?></span>
        <span class="sep">·</span>
        <span><?= vv_t('hub.stat_no_reg', $lang, ['n' => $strong(0)]) ?></span>
      </div>

      <div class="search-wrap" id="hub-search-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><?= icon_svg('Search', 20) ?></svg>
        <label class="sr-only" for="hub-search"><?= e(vv_t('hub.search_label', $lang)) ?></label>
        <input id="hub-search" type="search" placeholder="<?= e(vv_t('hub.search_placeholder', $lang)) ?>" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="results-grid" aria-describedby="hub-search-help">
        <button class="search-clear hidden" id="hub-search-clear" type="button" aria-label="<?= e(vv_t('hub.search_clear', $lang)) ?>">×</button>
      </div>
      <p class="sr-only" id="hub-search-help"><?= e(vv_t('hub.search_help', $lang)) ?></p>
    </div>
  </section>

  <section class="hub-controls sections" id="hub-controls" aria-label="<?= e(vv_t('hub.filters_aria', $lang)) ?>">
    <div class="hub-control-grid">
      <label><?= e(vv_t('hub.filter_category', $lang)) ?> <select class="select" id="hub-filter-category"><option value=""><?= e(vv_t('hub.option_all_categories', $lang)) ?></option><?php foreach (CATEGORY_ORDER as $c): ?><option value="<?= e($c) ?>"><?= e(category_label($c, $lang)) ?></option><?php endforeach; ?></select></label>
      <label><?= e(vv_t('hub.filter_processing', $lang)) ?> <select class="select" id="hub-filter-processing"><option value=""><?= e(vv_t('hub.option_all_places', $lang)) ?></option><option value="client"><?= e(vv_t('hub.option_local_browser', $lang)) ?></option><option value="vevit_server"><?= e(vv_t('hub.option_vevit_server', $lang)) ?></option><option value="external_ai"><?= e(vv_t('hub.option_external_ai', $lang)) ?></option></select></label>
      <label><?= e(vv_t('hub.filter_status', $lang)) ?> <select class="select" id="hub-filter-status"><option value=""><?= e(vv_t('hub.option_all_statuses', $lang)) ?></option><option value="working"><?= e(vv_t('hub.option_status_working', $lang)) ?></option><option value="limited"><?= e(vv_t('hub.option_status_limited', $lang)) ?></option><option value="experimental"><?= e(vv_t('hub.option_status_experimental', $lang)) ?></option><option value="coming_soon"><?= e(vv_t('hub.option_status_coming_soon', $lang)) ?></option><option value="unavailable_on_wedos"><?= e(vv_t('hub.option_status_unavailable', $lang)) ?></option><option value="broken"><?= e(vv_t('hub.option_status_broken', $lang)) ?></option></select></label>
      <label><?= e(vv_t('hub.filter_sort', $lang)) ?> <select class="select" id="hub-sort"><option value="relevance"><?= e(vv_t('hub.option_sort_relevance', $lang)) ?></option><option value="name"><?= e(vv_t('hub.option_sort_name', $lang)) ?></option><option value="newest"><?= e(vv_t('hub.option_sort_newest', $lang)) ?></option></select></label>
      <label class="hub-checkbox"><input id="hub-filter-new" type="checkbox"> <?= e(vv_t('hub.option_new_only', $lang)) ?></label>
      <button class="btn btn-outline" id="hub-filters-reset" type="button"><?= e(vv_t('hub.reset_filters', $lang)) ?></button>
    </div>
  </section>

  <section class="sections hidden" id="search-results" aria-labelledby="results-title">
    <h2 class="muted" id="results-title" aria-live="polite" style="font-size:0.875rem;font-weight:500;margin:0 0 1.5rem"></h2>
    <p class="hub-state" id="results-loading" aria-live="polite"><?= e(vv_t('hub.results_loading', $lang)) ?></p>
    <p class="hub-state error-text hidden" id="results-error" role="status"><?= e(vv_t('hub.results_error', $lang)) ?></p>
    <div class="grid" id="results-grid" role="listbox" aria-label="<?= e(vv_t('hub.search_label', $lang)) ?>"></div>
    <div class="empty-state hidden" id="results-empty">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><?= icon_svg('Search', 40) ?></svg>
      <p class="t"><?= e(vv_t('hub.empty_title', $lang)) ?></p>
      <p class="muted" style="font-size:0.875rem"><?= e(vv_t('hub.empty_sub', $lang)) ?></p>
    </div>
  </section>

  <div id="sections-view">
    <div class="sections" style="padding-top:0">
      <nav class="cat-nav" id="cat-nav">
        <div class="scroll">
          <a class="chip" href="#nove" data-target="nove"><?= e(vv_t('hub.section_newest', $lang)) ?></a><?php foreach (CATEGORY_ORDER as $c): ?><a class="chip" href="#<?= e($c) ?>" data-target="<?= e($c) ?>"><span class="dot" style="background:<?= CATEGORY_COLORS[$c] ?>"></span> <?= e(category_label($c, $lang)) ?></a><?php endforeach; ?>
        </div>
      </nav>
    </div>

    <div class="sections">
      <?= vv_hub_section('nove', vv_t('hub.section_newest', $lang), vv_t('hub.section_newest_desc', $lang), $newTools, $lang, null, false) ?>

      <?php foreach (CATEGORY_ORDER as $c):
        if (empty($byCat[$c])) continue;
        echo vv_hub_section($c, category_label($c, $lang), category_desc($c, $lang), $byCat[$c], $lang, CATEGORY_COLORS[$c], true);
      endforeach; ?>
    </div>
  </div>

  <nav class="category-rail" id="category-rail" aria-label="<?= e(vv_t('hub.filter_category', $lang)) ?>">
    <span class="category-rail__track" aria-hidden="true"></span>
    <a class="category-rail__dot is-active" href="#nove" data-section="nove" data-label="<?= e(vv_t('hub.section_newest', $lang)) ?>" aria-label="<?= e(vv_t('hub.section_newest', $lang)) ?>" aria-current="location" style="--rail-color:var(--color-emerald)"><span aria-hidden="true"></span></a>
    <?php foreach (CATEGORY_ORDER as $c): ?>
      <a class="category-rail__dot" href="#<?= e($c) ?>" data-section="<?= e($c) ?>" data-label="<?= e(category_label($c, $lang)) ?>" aria-label="<?= e(category_label($c, $lang)) ?>" style="--rail-color:<?= CATEGORY_COLORS[$c] ?>"><span aria-hidden="true"></span></a>
    <?php endforeach; ?>
  </nav>

  <section class="section beta-section" id="beta">
    <div class="beta-card glass">
      <div class="beta-head">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><?= icon_svg('Bug', 18) ?></svg> <span class="beta-tag"><?= e(vv_t('hub.beta_tag', $lang)) ?></span>
      </div>
      <h2 class="beta-title"><?= e(vv_t('hub.beta_title', $lang)) ?></h2>
      <p class="beta-sub"><?= e(vv_t('hub.beta_sub', $lang)) ?></p>

      <form class="beta-form" id="beta-form" novalidate>
        <textarea class="textarea" id="beta-message" name="message" rows="4" placeholder="<?= e(vv_t('hub.beta_placeholder', $lang)) ?>"></textarea>
        <button class="btn btn-primary btn-touch" id="beta-send" type="submit">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><?= icon_svg('Send', 18) ?></svg> <span class="beta-label"><?= e(vv_t('hub.beta_send', $lang)) ?></span>
        </button>
      </form>

      <p class="beta-note hidden" id="beta-note"><?= vv_t('hub.beta_note', $lang) ?></p>
      <p class="beta-small"><?= vv_t('hub.beta_small', $lang) ?></p>
    </div>
  </section>
</main>

<?php
// Lokalizovaný dataset + stringy pro hub.js (search). Inline → žádný fetch cs tools.json,
// barvy kategorií z registru (opravuje prohozené barvy v původním hub.js).
$hubTools = array_map(function ($t) {
    return [
        'slug' => $t['slug'], 'name' => $t['name'], 'description' => $t['description'],
        'icon' => $t['icon'], 'category' => $t['category'],
        'processing_location' => $t['processing_location'], 'status' => $t['status'],
        'new' => (bool)$t['new'], 'keywords' => $t['keywords'], 'aliases' => $t['aliases'],
    ];
}, all_tools_localized($lang));

$hubCats = array_map(function ($c) use ($lang) {
    return ['id' => $c, 'name' => category_label($c, $lang), 'description' => category_desc($c, $lang), 'color' => CATEGORY_COLORS[$c]];
}, CATEGORY_ORDER);

$hubData = ['schema_version' => 1, 'categories' => $hubCats, 'tools' => $hubTools];
$hubI18N = [
    'statuses' => [
        'limited' => vv_t('status.limited', $lang), 'experimental' => vv_t('status.experimental', $lang),
        'coming_soon' => vv_t('status.coming_soon', $lang), 'unavailable_on_wedos' => vv_t('status.unavailable_on_wedos', $lang),
        'broken' => vv_t('status.broken', $lang),
    ],
    'loc' => [
        'client' => vv_t('location.client.label', $lang),
        'external_ai' => vv_t('location.ai.label', $lang),
        'vevit_server' => vv_t('location.server.label', $lang),
    ],
    'badge_new' => vv_t('hub.badge_new', $lang),
    'card_open' => vv_t('hub.card_open', $lang),
    'results_title' => vv_t('hub.results_title', $lang),
    'results_count' => vv_t('hub.results_count', $lang),
    'results_title_empty' => vv_t('hub.results_title_empty', $lang),
];
$jsonFlags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG;
?>
<script type="application/json" id="vv-hub-data"><?= json_encode($hubData, $jsonFlags) ?></script>
<script type="application/json" id="vv-hub-i18n"><?= json_encode($hubI18N, $jsonFlags) ?></script>
<script type="module" src="/assets/shared/session.js?v=20260809c"></script>
<script src="/tools/assets/js/search-core.js"></script>
<script src="/tools/assets/js/hub.js?v=20260824d"></script>
<script src="/tools/assets/js/category-rail.js?v=20260826a"></script>
<script src="/tools/assets/js/beta.js"></script>
<?php require_once __DIR__ . '/includes/footer.php';
