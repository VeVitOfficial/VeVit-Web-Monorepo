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
<body class="bg-background text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col pb-16 md:pb-0">

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
    <a href="<?= $vvBase ?>index.html" class="flex items-center gap-3 flex-shrink-0 group" aria-label="VeVit Store — domovská stránka">
      <img src="<?= $vvBase ?>images/logo_notext.png" alt="VeVit" width="40" height="40" class="w-10 h-10 rounded-lg object-contain group-hover:scale-105 transition-transform duration-200">
      <span class="font-display text-xl font-extrabold text-on-surface tracking-tight group-hover:text-primary transition-colors duration-200">VeVit<span class="text-primary">.</span></span>
    </a>

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

      <!-- Account / Login — hydrated by vevit-account.js after page load -->
      <div id="navAuth" class="flex items-center" aria-live="polite" aria-label="Stav přihlášení">
        <?php if ($currentUser): ?>
          <!-- Transitional: server-side user from legacy local session -->
          <div class="flex items-center gap-2">
            <?php if (!empty($currentUser['avatar_url'])): ?>
              <img src="<?= h($currentUser['avatar_url']) ?>" alt="" width="32" height="32" class="w-8 h-8 rounded-full object-cover border border-outline-variant">
            <?php else: ?>
              <span class="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant">
                <span class="material-symbols-outlined text-[18px]" aria-hidden="true">person</span>
              </span>
            <?php endif; ?>
            <span class="font-body-md text-sm text-on-surface max-w-[120px] truncate"><?= h($currentUser['full_name'] ?? $currentUser['nickname'] ?? $currentUser['email']) ?></span>
            <a href="<?= $vvBase ?>logout.php" aria-label="Odhlásit se" title="Odhlásit se" class="p-1.5 rounded-md text-on-surface-variant hover:text-error transition-colors">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">logout</span>
            </a>
          </div>
        <?php else: ?>
          <!-- Default: login button; vevit-account.js replaces this with user info if authenticated -->
          <button type="button" onclick="if(window.VevitAccount)VevitAccount.openLogin();" aria-label="Přihlásit se přes VeVit Account" class="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors duration-150">
            <span class="material-symbols-outlined text-[22px]" aria-hidden="true">account_circle</span>
          </button>
        <?php endif; ?>
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
    <a href="<?= $vvBase ?>index.html" class="absolute left-1/2 -translate-x-1/2 flex items-center gap-2" aria-label="VeVit Store">
      <img src="<?= $vvBase ?>images/logo_notext.png" alt="VeVit" width="32" height="32" class="w-8 h-8 rounded-lg object-contain">
      <span class="font-display text-lg font-extrabold text-on-surface tracking-tight">VeVit<span class="text-primary">.</span></span>
    </a>

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
      <a href="<?= $vvBase ?>index.html" class="flex items-center gap-2" tabindex="-1">
        <img src="<?= $vvBase ?>images/logo_notext.png" alt="VeVit" width="36" height="36" class="w-9 h-9 rounded-lg object-contain">
        <span class="font-display text-lg font-extrabold text-on-surface tracking-tight">VeVit<span class="text-primary">.</span></span>
      </a>
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
      <?php if ($currentUser): ?>
        <div class="flex items-center gap-3 mb-3">
          <?php if (!empty($currentUser['avatar_url'])): ?>
            <img src="<?= h($currentUser['avatar_url']) ?>" alt="" width="36" height="36" class="w-9 h-9 rounded-full object-cover border border-outline-variant">
          <?php else: ?>
            <span class="w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant">
              <span class="material-symbols-outlined text-[20px]" aria-hidden="true">person</span>
            </span>
          <?php endif; ?>
          <div class="flex-1 min-w-0">
            <div class="font-body-md text-sm text-on-surface truncate"><?= h($currentUser['full_name'] ?? $currentUser['nickname'] ?? $currentUser['email']) ?></div>
            <div class="font-caption text-caption text-on-surface-variant">Přihlášen</div>
          </div>
        </div>
        <a href="<?= $vvBase ?>logout.php" class="btn btn-outline w-full justify-center">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">logout</span> Odhlásit se
        </a>
      <?php else: ?>
        <button type="button" onclick="if(window.VevitAccount){VevitAccount.openLogin();}closeDrawer();" class="btn btn-primary w-full justify-center">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">login</span> Přihlásit se
        </button>
      <?php endif; ?>
    </div>
  </div>
</div>

<script>
/* VeVit Account configuration — read by vevit-account.js.
   [B1] me_url and [B2] login_url must be confirmed with the VeVit Account team. */
window.VEVIT_ACCOUNT_CONFIG = {
  meUrl:     '<?= addslashes($storeConfig['vevit_account']['me_url'] ?? 'https://vevit.cz/account/api/me.php') ?>',
  loginUrl:  '<?= addslashes($storeConfig['vevit_account']['login_url'] ?? 'https://vevit.cz/account/login') ?>',
  appOrigin: '<?= addslashes(rtrim($storeConfig['app_url'] ?? '', '/')) ?>',
};
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeDrawer();
});

/* ---- Mobile Drawer ---- */
const drawer = document.getElementById('mobileDrawer');
const drawerPanel = drawer ? drawer.querySelector('.mobile-drawer__panel') : null;
const menuBtn = document.getElementById('mobileMenuBtn');
const closeBtn = document.getElementById('drawerCloseBtn');
const backdrop = document.getElementById('drawerBackdrop');
let lastFocusedEl = null;

function openDrawer() {
  if (!drawer) return;
  lastFocusedEl = document.activeElement;
  drawer.classList.add('open');
  drawer.removeAttribute('inert');
  document.body.classList.add('drawer-open');
  menuBtn.setAttribute('aria-expanded', 'true');
  // Focus first focusable element in panel
  setTimeout(() => {
    const first = drawerPanel.querySelector('a, button, input');
    if (first) first.focus();
  }, 300);
}
function closeDrawer() {
  if (!drawer) return;
  drawer.classList.remove('open');
  drawer.setAttribute('inert', '');
  document.body.classList.remove('drawer-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  if (lastFocusedEl) lastFocusedEl.focus();
}

if (menuBtn) menuBtn.addEventListener('click', openDrawer);
if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
if (backdrop) backdrop.addEventListener('click', closeDrawer);

// Focus trap inside drawer
if (drawer) {
  drawer.addEventListener('keydown', function(e) {
    if (!drawer.classList.contains('open')) return;
    if (e.key !== 'Tab') return;
    const focusable = Array.from(drawer.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.closest('[tabindex="-1"]') && !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

// Close drawer on viewport resize to desktop width
window.addEventListener('resize', function() {
  if (window.innerWidth >= 768 && drawer && drawer.classList.contains('open')) closeDrawer();
});
</script>

<script src="<?= $vvBase ?>assets/js/vevit-account.js"></script>
<?php if (!$currentUser): ?>
<script>
// Hydrate #navAuth via VeVit Account (runs only when no legacy local session).
// On auth: replace login button with user chip. On failure: leave login button.
(function () {
  if (!window.VevitAccount) return;
  var navAuth = document.getElementById('navAuth');
  if (!navAuth) return;

  VevitAccount.checkSession().then(function (result) {
    if (result.state !== 'authenticated' || !result.user) return;
    var u = result.user;

    // Build avatar element
    var avatarEl;
    if (u.avatarUrl) {
      avatarEl = document.createElement('img');
      avatarEl.width = 32;
      avatarEl.height = 32;
      avatarEl.className = 'w-8 h-8 rounded-full object-cover border border-outline-variant';
      avatarEl.alt = '';
      avatarEl.src = u.avatarUrl; // validated as https:// in _safeAvatarUrl
    } else {
      avatarEl = document.createElement('span');
      avatarEl.className = 'w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant';
      var icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[18px]';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = 'person';
      avatarEl.appendChild(icon);
    }

    var nameSpan = document.createElement('span');
    nameSpan.className = 'font-body-md text-sm text-on-surface max-w-[120px] truncate';
    nameSpan.textContent = u.displayName || '';

    var logoutA = document.createElement('a');
    logoutA.href = '<?= addslashes($vvBase) ?>logout.php';
    logoutA.setAttribute('aria-label', 'Odhlásit se');
    logoutA.title = 'Odhlásit se';
    logoutA.className = 'p-1.5 rounded-md text-on-surface-variant hover:text-error transition-colors';
    var logoutIcon = document.createElement('span');
    logoutIcon.className = 'material-symbols-outlined text-[18px]';
    logoutIcon.setAttribute('aria-hidden', 'true');
    logoutIcon.textContent = 'logout';
    logoutA.appendChild(logoutIcon);

    var wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';
    wrapper.appendChild(avatarEl);
    wrapper.appendChild(nameSpan);
    wrapper.appendChild(logoutA);

    navAuth.innerHTML = '';
    navAuth.appendChild(wrapper);
  }).catch(function () {
    // Leave login button in place on any error.
  });
}());
</script>
<?php endif; ?>

<!-- Main content landmark starts here (id used by skip link) -->
<div id="main-content">
