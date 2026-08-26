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

$toolUiKeys = [
    'copied', 'copy_failed', 'copy', 'invalid_type', 'file_too_large',
    'remove_file', 'move_up', 'move_down', 'load_failed', 'state_idle',
    'state_ready', 'state_processing', 'state_success', 'state_error',
    'cancel', 'retry', 'reset', 'download', 'result_ready', 'enter_json',
    'invalid_json', 'invalid_range', 'invalid_time', 'loading', 'saving',
    'thinking', 'interrupted', 'unknown_error', 'page', 'undo', 'text_meta', 'file_format',
    'strength_very_weak', 'strength_weak', 'strength_medium', 'strength_strong',
    'strength_very_strong', 'choose_charset', 'password_copied',
];
$toolUiDictionary = [];
foreach ($toolUiKeys as $key) {
    $toolUiDictionary[$key] = vv_t('tool_ui.' . $key, $lang);
}
$templateSource = $has_impl ? (file_get_contents($templatePath) ?: '') : '';
$isMultiStep = $has_impl && (str_contains($templateSource, 'dropzone') || in_array($tool['slug'], ['json-formatter', 'ai-chat'], true));

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

<?php if ($isMultiStep): ?>
      <ol class="tool-steps" aria-label="<?= e(vv_t('tool_page.workflow_label', $lang)) ?>">
        <li class="is-current" data-tool-step="input"><span>1</span><?= e(vv_t('tool_page.step_input', $lang)) ?></li>
        <li data-tool-step="settings"><span>2</span><?= e(vv_t('tool_page.step_settings', $lang)) ?></li>
        <li data-tool-step="result"><span>3</span><?= e(vv_t('tool_page.step_result', $lang)) ?></li>
      </ol>
<?php endif; ?>

    <!-- Tool body -->
    <div class="tool-shell glass" data-tool-slug="<?= e($tool['slug']) ?>" data-tool-category="<?= e($tool['cat']) ?>" data-processing-location="<?= e($tool['processing_location']) ?>">
      <?php if ($has_impl): ?>
        <div class="tool-tool" id="tool-root" data-tool-state="idle" aria-busy="false">
          <p class="sr-only" id="tool-live-status" role="status" aria-live="polite" aria-atomic="true"><?= e(vv_t('tool_page.ready_announcement', $lang)) ?></p>
          <?php require $templatePath; ?>
        </div>
        <script type="application/json" id="tool-ui-i18n"><?= json_encode($toolUiDictionary, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE) ?></script>
        <script src="/tools/assets/js/tools/<?= e($tool['slug']) ?>.js" defer></script>
      <?php else: ?>
        <?php $alternativeKey = $tool['slug'] === 'ai-image-gen' ? 'alt_ai_image' : ($tool['slug'] === 'pdf-password' ? 'alt_pdf_password' : 'alt_screenshot'); ?>
        <div class="tool-placeholder tool-info-only">
          <div class="tool-info-icon"><?= icon_svg($tool['status'] === 'coming_soon' ? 'Sparkles' : 'AlertCircle', 28) ?></div>
          <div><p class="t"><?= e(vv_t('tool_page.info_title', $lang)) ?></p>
          <p><?= e(vv_t('tool_page.placeholder_status', $lang, ['status' => status_label($tool['status'], $lang)])) ?> <?= e(vv_t('tool_page.info_no_action', $lang)) ?></p></div>
          <div class="tool-alternative"><strong><?= e(vv_t('tool_page.alternatives', $lang)) ?></strong><p><?= e(vv_t('tool_page.' . $alternativeKey, $lang)) ?></p></div>
          <?php if (!empty($tool['note'])): ?>
            <p class="sr-only"><?= e($tool['note']) ?></p>
          <?php endif; ?>
        </div>
      <?php endif; ?>
    </div>

    <aside class="tool-trust" aria-label="<?= e(vv_t('tool_page.processing_title', $lang)) ?>">
      <div class="tool-trust-main">
        <?= icon_svg($tool['loc'] === 'client' ? 'ShieldCheck' : ($tool['loc'] === 'ai' ? 'Sparkles' : 'Server'), 20) ?>
        <div>
          <strong><?= e(vv_t('tool_page.processing_title', $lang)) ?></strong>
          <p><?= e($loc['title']) ?></p>
        </div>
      </div>
      <?php if (!empty($tool['requirements']['browser_features']) || !empty($tool['requirements']['external_services']) || !empty($tool['requirements']['hosting_constraints'])): ?>
        <details class="tool-requirements">
          <summary><?= e(vv_t('tool_page.requirements_title', $lang)) ?> <?= icon_svg('ChevronDown', 16) ?></summary>
          <ul>
            <?php foreach (array_merge($tool['requirements']['browser_features'], $tool['requirements']['external_services'], $tool['requirements']['hosting_constraints']) as $requirement): ?>
              <li><?= e((string) $requirement) ?></li>
            <?php endforeach; ?>
          </ul>
        </details>
      <?php endif; ?>
    </aside>
  </div>
</main>
<?php require __DIR__ . '/includes/footer.php'; ?>
