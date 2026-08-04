<?php
// Sdílený header. Očekává načtené registry.php a icons.php.
require_once __DIR__ . '/registry.php';
require_once __DIR__ . '/icons.php';
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VeVit Tools — Nástroje pro vaši práci</title>
  <meta name="description" content="Sada nástrojů pro PDF, obrázky, média, text, AI, vývoj, bezpečnost i kalkulačky. Většinu souborů zpracujeme lokálně v prohlížeči, bez nahrávání na server.">
  <link rel="icon" href="/tools/assets/favicon.ico">
<link rel="stylesheet" href="/assets/fonts/vevit-fonts.css">
  <link rel="stylesheet" href="/tools/assets/css/style.css">
  <?php if (!empty($page_head)) echo $page_head; ?>
</head>
<body>
<header class="site-header glass">
  <div class="container bar">
    <div class="header-left">
      <a class="brand" href="/tools/">
        <span class="brand-logo"><?= icon_svg('Box', 20) ?></span>
        <span class="brand-mark">
          <span class="brand-name">VeVit</span>
          <span class="brand-suffix">Tools</span>
        </span>
      </a>
      <div class="cat-wrap" style="position:relative">
        <button class="cat-toggle" id="cat-toggle" aria-expanded="false" aria-haspopup="menu">
          Kategorie <?= icon_svg('ChevronDown', 16) ?>
        </button>
        <div class="cat-dropdown glass-strong hidden" id="cat-menu" role="menu">
          <a href="/tools/#nove" role="menuitem"><span class="dot" style="background:var(--color-emerald)"></span> Nejnovější</a>
          <div class="sep"></div>
          <?php foreach (CATEGORY_ORDER as $cat): ?>
            <a href="/tools/#<?= $cat ?>" role="menuitem">
              <span class="dot" style="background:<?= CATEGORY_COLORS[$cat] ?>"></span>
              <?= e(CATEGORY_LABELS[$cat]) ?>
            </a>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
    <div class="header-right">
      <a class="login-btn" href="/account/login"
         title="Přihlášení k účtu VeVit je volitelné — všechny nástroje fungují i bez něj.">
        <?= icon_svg('LogIn', 16) ?> Přihlásit se
      </a>
    </div>
  </div>
</header>