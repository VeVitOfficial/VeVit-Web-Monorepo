<?php
require_once __DIR__ . '/includes/i18n-bootstrap.php';
require_once __DIR__ . '/includes/registry.php';
require_once __DIR__ . '/includes/icons.php';
require_once __DIR__ . '/includes/config.php';

$lang = vv_tools_lang();
$slug = isset($_GET['slug']) ? preg_replace('/[^a-z0-9-]/', '', $_GET['slug']) : '';
$tool = $slug ? get_tool($slug) : null;

if (!$tool) {
    http_response_code(404);
    require __DIR__ . '/includes/header.php';
    echo '<main class="main"><div class="tool-page center"><div class="tool-placeholder"><div class="t">' . e(vv_t('tool_page.not_found_title')) . '</div><p class="muted" style="font-size:0.875rem">' . e(vv_t('tool_page.not_found_text')) . '</p><p style="margin-top:1.5rem"><a class="btn btn-outline" href="/' . e($lang) . '/tools/">' . e(vv_t('tool_page.not_found_back')) . '</a></p></div></div></main>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

// Lokalizovat name/desc pro aktuální jazyk.
$tool = localize_tool($tool, $lang);

$color = CATEGORY_COLORS[$tool['cat']];
$cat_label = category_label($tool['cat'], $lang);
$loc = location_meta_i18n($tool['loc'], $lang);

$templatePath = __DIR__ . '/includes/tools/' . $tool['slug'] . '.php';
$scriptPath = __DIR__ . '/assets/js/tools/' . $tool['slug'] . '.js';
$has_impl = !in_array($tool['status'], ['coming_soon', 'unavailable_on_wedos', 'broken'], true)
    && is_file($templatePath) && is_file($scriptPath);

require __DIR__ . '/includes/header.php';
?>
<main class="main">
  <div class="tool-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <a href="/<?= e($lang) ?>/tools/"><?= icon_svg('ArrowLeft', 16) ?> <?= e(vv_t('tool_page.breadcrumb_tools')) ?></a>
      <span class="sep">/</span>
      <span style="color:<?= $color ?>"><?= e($cat_label) ?></span>
      <span class="sep">/</span>
      <span><?= e($tool['name']) ?></span>
    </nav>

    <!-- Tool header -->
    <div class="tool-header">
      <span class="bar" style="background:<?= $color ?>"></span>
      <h1><?= e($tool['name']) ?></h1>
      <span class="loc-tag" style="border-color:<?= $color ?>30;color:<?= $color ?>;background:<?= $color ?>10" title="<?= e($loc['title']) ?>"><?= e($loc['label']) ?></span>
      <span class="loc-tag tool-status-<?= e($tool['status']) ?>"><?= e(status_label($tool['status'], $lang)) ?></span>
    </div>
    <p class="tool-desc"><?= e($tool['desc']) ?></p>

    <!-- Tool body -->
    <div class="tool-shell glass">
      <?php if ($has_impl): ?>
        <div class="tool-tool" id="tool-root">
          <?php require $templatePath; ?>
        </div>
        <script src="/tools/assets/js/tools/<?= e($tool['slug']) ?>.js" defer></script>
      <?php else: ?>
        <div class="tool-placeholder">
          <p class="t"><?= e($tool['name']) ?></p>
          <p style="font-size:0.875rem"><?= e(vv_t('tool_page.placeholder_status', $lang, ['status' => status_label($tool['status'], $lang)])) ?> <?= e($tool['privacy_note']) ?></p>
          <?php if (!empty($tool['note'])): ?>
            <p class="error-text" style="margin-top:0.75rem;display:block"><?= e($tool['note']) ?></p>
          <?php endif; ?>
        </div>
      <?php endif; ?>
    </div>
  </div>
</main>
<?php require __DIR__ . '/includes/footer.php'; ?>