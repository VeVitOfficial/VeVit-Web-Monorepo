<?php
// Sdílený header. Očekává načtené i18n-bootstrap.php + registry.php + icons.php.
// i18n-bootstrap registruje slovník a nastaví jazyk z VEVIT_LANG / URL prefixu.
if (!function_exists('vv_tools_lang')) {
    require_once __DIR__ . '/i18n-bootstrap.php';
}
require_once __DIR__ . '/registry.php';
require_once __DIR__ . '/icons.php';

$lang = vv_tools_lang();
$hreflang = vv_hreflang_tags('/tools', $lang);
?>
<!DOCTYPE html>
<html lang="<?= e($lang) ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e(vv_t('header.title')) ?></title>
  <meta name="description" content="<?= e(vv_t('header.meta_description')) ?>">
  <link rel="icon" href="/tools/assets/favicon.ico">
  <link rel="stylesheet" href="/assets/fonts/vevit-fonts.css">
  <link rel="stylesheet" href="/tools/assets/css/style.css">
  <link rel="stylesheet" href="/assets/shared/app-switcher.css?v=20260826a">
  <?= $hreflang ?>
  <?php if (!empty($page_head)) echo $page_head; ?>
</head>
<body>
<header class="site-header glass">
  <div class="container bar">
    <div class="header-left">
      <a class="brand" href="/<?= $lang ?>/tools/">
        <span class="brand-logo"><?= icon_svg('Box', 20) ?></span>
        <span class="brand-mark">
          <span class="brand-name"><?= e(vv_t('header.brand_name')) ?></span>
          <span class="brand-suffix"><?= e(vv_t('header.brand_suffix')) ?></span>
        </span>
      </a>
      <div class="cat-wrap" style="position:relative">
        <button class="cat-toggle" id="cat-toggle" aria-expanded="false" aria-haspopup="menu">
          <?= e(vv_t('header.categories')) ?> <?= icon_svg('ChevronDown', 16) ?>
        </button>
        <div class="cat-dropdown glass-strong hidden" id="cat-menu" role="menu">
          <a href="/tools/#nove" role="menuitem"><span class="dot" style="background:var(--color-emerald)"></span> <?= e(vv_t('header.newest')) ?></a>
          <div class="sep"></div>
          <?php foreach (CATEGORY_ORDER as $cat): ?>
            <a href="/tools/#<?= $cat ?>" role="menuitem">
              <span class="dot" style="background:<?= CATEGORY_COLORS[$cat] ?>"></span>
              <?= e(category_label($cat)) ?>
            </a>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
    <div class="header-right vv-app-actions">
      <span data-vevit-language></span>
      <span data-vevit-app-switcher data-vevit-app="Tools"></span>
      <a class="login-btn" href="/<?= $lang ?>/account/login"
         title="<?= e(vv_t('header.login_title')) ?>">
        <?= icon_svg('LogIn', 16) ?> <?= e(vv_t('header.login')) ?>
      </a>
    </div>
  </div>
</header>
<script type="module" src="/assets/shared/app-switcher.js?v=20260825b"></script>
<script type="module" src="/assets/shared/localization.js?v=20260826f"></script>
