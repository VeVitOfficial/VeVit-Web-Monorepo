<?php
require_once __DIR__ . '/includes/registry.php';
require_once __DIR__ . '/includes/icons.php';

$slug = isset($_GET['slug']) ? preg_replace('/[^a-z0-9-]/', '', $_GET['slug']) : '';
$tool = $slug ? get_tool($slug) : null;

if (!$tool) {
    http_response_code(404);
    require __DIR__ . '/includes/header.php';
    echo '<main class="main"><div class="tool-page center"><div class="tool-placeholder"><div class="t">Nástroj nebyl nalezen</div><p class="muted" style="font-size:0.875rem">Tento nástroj neexistuje.</p><p style="margin-top:1.5rem"><a class="btn btn-outline" href="/tools/">Zpět na přehled</a></p></div></div></main>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$color = CATEGORY_COLORS[$tool['cat']];
$cat_label = CATEGORY_LABELS[$tool['cat']];
$loc = location_meta($tool['loc']);

$templatePath = __DIR__ . '/includes/tools/' . $tool['slug'] . '.php';
$scriptPath = __DIR__ . '/tools/assets/js/tools/' . $tool['slug'] . '.js';
$has_impl = !in_array($tool['status'], ['coming_soon', 'unavailable_on_wedos', 'broken'], true)
    && is_file($templatePath) && is_file($scriptPath);
$statusLabels = ['working' => 'Dostupný', 'limited' => 'Omezeně dostupný', 'experimental' => 'Experimentální', 'coming_soon' => 'Připravujeme', 'unavailable_on_wedos' => 'Nedostupné na WEDOS', 'broken' => 'Dočasně nefunkční'];

require __DIR__ . '/includes/header.php';
?>
<main class="main">
  <div class="tool-page">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <a href="/tools/"><?= icon_svg('ArrowLeft', 16) ?> Nástroje</a>
      <span class="sep">/</span>
      <span style="color:<?= $color ?>"><?= e($cat_label) ?></span>
      <span class="sep">/</span>
      <span><?= e($tool['name']) ?></span>
    </nav>

    <!-- Tool header -->
    <div class="tool-header">
      <span class="bar" style="background:<?= $color ?>"></span>
      <h1><?= e($tool['name']) ?></h1>
      <span class="loc-tag" style="border-color:<?= $color ?>30;color:<?= $color ?>;background:<?= $color ?>10"><?= e($loc['label']) ?></span>
      <span class="loc-tag tool-status-<?= e($tool['status']) ?>"><?= e($statusLabels[$tool['status']]) ?></span>
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
          <p style="font-size:0.875rem"><?= e($statusLabels[$tool['status']]) ?>. <?= e($tool['privacy_note']) ?></p>
          <?php if (!empty($tool['note'])): ?>
            <p class="error-text" style="margin-top:0.75rem;display:block"><?= e($tool['note']) ?></p>
          <?php endif; ?>
        </div>
      <?php endif; ?>
    </div>
  </div>
</main>
<?php require __DIR__ . '/includes/footer.php'; ?>
