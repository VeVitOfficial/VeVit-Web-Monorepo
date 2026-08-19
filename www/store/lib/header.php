<?php
// Shared header / nav for VeVit Store — Release 1 Storefront
// Variables to set before include:
//   $pageTitle   string  Full page title
//   $activeNav   string  One of: home, catalog, deals, new, cart, account
//   $searchValue string  Pre-filled search query
//   $metaDesc    string  Optional meta description
//   $canonical   string  Optional canonical URL (validated absolute URL or empty)
//   $noindex     bool    Set true for checkout, success, account pages

$pageTitle   = $pageTitle ?? 'VeVit Store';
$activeNav   = $activeNav ?? '';
$searchValue = $searchValue ?? '';
$metaDesc    = $metaDesc ?? 'VeVit Store — moderní e-shop s digitálními i fyzickými produkty. Bezpečná platba, okamžité stažení.';
$canonical   = $canonical ?? '';
$noindex     = $noindex ?? false;
$currentUser = function_exists('getCurrentUser') ? getCurrentUser() : null;
$vvBase      = defined('VEVIT_BASE') ? VEVIT_BASE : '';

// Announcement bar content — empty string disables the bar
$announcementText = 'Doprava zdarma u objednávek nad 1&nbsp;000&nbsp;Kč · Digitální produkty ihned po platbě';
$announcementLink = '';
?>
<!DOCTYPE html>
<html class="dark" lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= h($pageTitle) ?></title>
<meta name="description" content="<?= h($metaDesc) ?>">
<?php if ($noindex): ?><meta name="robots" content="noindex,nofollow"><?php endif; ?>
<?php if ($canonical): ?><link rel="canonical" href="<?= h($canonical) ?>"><?php endif; ?>
<!-- Open Graph -->
<meta property="og:title" content="<?= h($pageTitle) ?>">
<meta property="og:description" content="<?= h($metaDesc) ?>">
<meta property="og:type" content="website">
<meta property="og:image" content="<?= $vvBase ?>images/logo_text.png">
<?php include __DIR__ . '/tw_config.php'; ?>
</head>
<body class="bg-background text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col pb-16 md:pb-0"
  data-vevit-me-url="<?= h($storeConfig['vevit_account']['me_url'] ?? 'https://vevit.cz/account/api/me.php') ?>"
  data-vevit-login-url="<?= h($storeConfig['vevit_account']['login_url'] ?? 'https://vevit.cz/account/login') ?>"
  data-vevit-app-origin="<?= h(rtrim($storeConfig['app_url'] ?? '', '/')) ?>"
  data-vevit-base="<?= h($vvBase) ?>"
  data-vevit-hydrate-account="<?= $currentUser ? '0' : '1' ?>">

<!-- Skip link (accessibility) -->
<a class="skip-link" href="#main-content">Přeskočit na obsah</a>

<?php if ($announcementText): ?>
<!-- Announcement bar -->
<div class="announcement-bar" role="status" aria-live="polite">
  <span class="material-symbols-outlined text-[16px] icon-filled" aria-hidden="true">local_shipping</span>
  <?php if ($announcementLink): ?>
    <a href="<?= h($announcementLink) ?>"><?= $announcementText ?></a>
  <?php else: ?>
    <span><?= $announcementText ?></span>
  <?php endif; ?>
</div>
<?php endif; ?>

<!-- ===== Desktop Header ===== -->
<header class="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-outline-variant">
  <nav class="hidden md:flex items-center justify-between w-full max-w-store mx-auto px-margin py-3" aria-label="Hlavní navigace">

    <!-- Logo -->
    <span class="vv-app-brand" aria-label="VeVit Store"><a href="/home">VeVit</a><a href="/store">Store</a></span>

    <!-- Main nav links -->
    <div class="flex items-center gap-1">
      <?php
      $navItems = [
        ['href' => $vvBase . 'index.html',             'key' => 'home',    'label' => 'Domů'],
        ['href' => $vvBase . 'catalog.php',             'key' => 'catalog', 'label' => 'Katalog'],
        ['href' => $vvBase . 'catalog.php?sort=newest', 'key' => 'new',     'label' => 'Novinky'],
        ['href' => $vvBase . 'catalog.php?deals=1',     'key' => 'deals',   'label' => 'Slevy'],
      ];
      foreach ($navItems as $item):
        $isActive = $activeNav === $item['key'];
      ?>
      <a href="<?= h($item['href']) ?>"
         class="px-3 py-2 rounded-md font-body-md font-semibold transition-colors duration-150 <?= $isActive
           ? 'text-primary bg-primary/10'
           : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high' ?>"
         <?= $isActive ? 'aria-current="page"' : '' ?>>
        <?= $item['label'] ?>
      </a>
      <?php endforeach; ?>
    </div>

    <!-- Right: Search + Cart + Account -->
    <div class="flex items-center gap-3">
      <!-- Search -->
      <form method="get" action="<?= $vvBase ?>catalog.php" role="search" class="relative flex items-center group">
        <label for="header-search-desktop" class="sr-only">Hledat produkty</label>
        <span class="material-symbols-outlined absolute left-3 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors text-[20px]" aria-hidden="true">search</span>
        <input
          id="header-search-desktop"
          name="search"
          type="search"
          placeholder="Hledat produkty…"
          value="<?= h($searchValue) ?>"
          autocomplete="off"
          class="bg-surface-container border border-outline-variant rounded-full pl-10 pr-4 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48 lg:w-60 transition-all duration-200 placeholder:text-on-surface-variant/50">
      </form>

      <!-- Cart -->
      <a href="<?= $vvBase ?>cart.php" aria-label="Košík" class="relative p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors duration-150">
        <span class="material-symbols-outlined text-[22px]" aria-hidden="true">shopping_bag</span>
        <span class="nav-cart-badge absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary-container text-on-primary-fixed text-[10px] font-bold rounded-full flex items-center justify-center" style="display:none" aria-label="položky v košíku">0</span>
      </a>

      <!-- Jediný browserový zdroj stavu je /account/api/me.php. -->
      <div id="navAuth" class="flex items-center" aria-live="polite" aria-label="Stav přihlášení">
        <span data-vevit-language></span>
        <span data-vevit-app-switcher data-vevit-app="Store"></span>
        <span data-vevit-session></span>
      </div>
    </div>
  </nav>

  <!-- ===== Mobile Header ===== -->
  <nav class="md:hidden flex items-center justify-between w-full px-4 py-3" aria-label="Mobilní navigace">
    <!-- Hamburger -->
    <button type="button" id="mobileMenuBtn" aria-label="Otevřít menu" aria-expanded="false" aria-controls="mobileDrawer"
      class="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors duration-150">
      <span class="material-symbols-outlined text-[22px]" aria-hidden="true">menu</span>
    </button>

    <!-- Logo (centered) -->
    <span class="vv-app-brand absolute left-1/2 -translate-x-1/2" aria-label="VeVit Store"><a href="/home">VeVit</a><a href="/store">Store</a></span>

    <!-- Cart -->
    <a href="<?= $vvBase ?>cart.php" aria-label="Košík" class="relative p-2 rounded-lg text-on-surface-variant hover:text-primary transition-colors duration-150">
      <span class="material-symbols-outlined text-[22px]" aria-hidden="true">shopping_bag</span>
      <span class="nav-cart-badge absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary-container text-on-primary-fixed text-[10px] font-bold rounded-full flex items-center justify-center" style="display:none">0</span>
    </a>
  </nav>
</header>

<!-- ===== Mobile Navigation Drawer ===== -->
<div id="mobileDrawer" class="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigační menu" inert>
  <div class="mobile-drawer__backdrop" id="drawerBackdrop" aria-hidden="true"></div>
  <div class="mobile-drawer__panel" tabindex="-1">

    <!-- Drawer header -->
    <div class="mobile-drawer__header">
      <span class="vv-app-brand" aria-label="VeVit Store"><a href="/home">VeVit</a><a href="/store">Store</a></span>
      <button type="button" id="drawerCloseBtn" aria-label="Zavřít menu"
        class="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors">
        <span class="material-symbols-outlined text-[22px]" aria-hidden="true">close</span>
      </button>
    </div>

    <!-- Drawer nav -->
    <nav class="mobile-drawer__nav" aria-label="Menu">
      <div class="mobile-drawer__section-title">Navigace</div>
      <?php
      $drawerItems = [
        ['href' => $vvBase . 'index.html',             'key' => 'home',    'icon' => 'home',        'label' => 'Domů'],
        ['href' => $vvBase . 'catalog.php',             'key' => 'catalog', 'icon' => 'storefront',  'label' => 'Katalog'],
        ['href' => $vvBase . 'catalog.php?sort=newest', 'key' => 'new',     'icon' => 'new_releases','label' => 'Novinky'],
        ['href' => $vvBase . 'catalog.php?deals=1',     'key' => 'deals',   'icon' => 'sell',        'label' => 'Slevy'],
        ['href' => $vvBase . 'cart.php',                'key' => 'cart',    'icon' => 'shopping_bag','label' => 'Košík'],
      ];
      foreach ($drawerItems as $item):
        $isActive = $activeNav === $item['key'];
      ?>
      <a href="<?= h($item['href']) ?>"
         class="mobile-drawer__link <?= $isActive ? 'active' : '' ?>"
         <?= $isActive ? 'aria-current="page"' : '' ?>>
        <span class="flex items-center gap-3">
          <span class="material-symbols-outlined" aria-hidden="true"><?= $item['icon'] ?></span>
          <?= $item['label'] ?>
        </span>
      </a>
      <?php endforeach; ?>

      <div class="mobile-drawer__section-title mt-2">Informace</div>
      <?php
      $infoItems = [
        ['href' => $vvBase . 'about.php',    'icon' => 'info',           'label' => 'O nás'],
        ['href' => $vvBase . 'shipping.php', 'icon' => 'local_shipping', 'label' => 'Doprava a platba'],
        ['href' => $vvBase . 'returns.php',  'icon' => 'assignment_return','label' => 'Vrácení zboží'],
        ['href' => $vvBase . 'contact.php',  'icon' => 'mail',           'label' => 'Kontakt'],
      ];
      foreach ($infoItems as $item): ?>
      <a href="<?= h($item['href']) ?>" class="mobile-drawer__link">
        <span class="flex items-center gap-3">
          <span class="material-symbols-outlined" aria-hidden="true"><?= $item['icon'] ?></span>
          <?= $item['label'] ?>
        </span>
      </a>
      <?php endforeach; ?>

      <!-- Mobile search -->
      <div class="px-5 py-4 mt-2 border-t border-outline-variant">
        <form method="get" action="<?= $vvBase ?>catalog.php" role="search">
          <label for="mobile-drawer-search" class="sr-only">Hledat produkty</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" aria-hidden="true">search</span>
            <input
              id="mobile-drawer-search"
              name="search"
              type="search"
              placeholder="Hledat produkty…"
              class="w-full bg-surface border border-outline-variant rounded-full pl-10 pr-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50">
          </div>
        </form>
      </div>
    </nav>

    <!-- Drawer footer — auth -->
    <div class="mobile-drawer__footer">
      <span data-vevit-session></span>
    </div>
  </div>
</div>

<script src="<?= $vvBase ?>assets/js/header.js"></script>
<link rel="stylesheet" href="/assets/shared/session.css?v=20260809b">
<link rel="stylesheet" href="/assets/shared/app-switcher.css?v=20260809c">
<script type="module" src="/assets/shared/session.js?v=20260809c"></script>
<script type="module" src="/assets/shared/app-switcher.js?v=20260809b"></script>
<script type="module" src="/assets/shared/localization.js?v=20260817a"></script>

<!-- Main content landmark starts here (id used by skip link) -->
<div id="main-content">
