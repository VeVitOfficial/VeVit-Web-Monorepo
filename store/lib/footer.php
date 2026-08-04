<?php
// Shared footer — Release 1 Storefront
$activeNav = $activeNav ?? '';
$vvBase    = defined('VEVIT_BASE') ? VEVIT_BASE : '';
$currentUser = $currentUser ?? null;
?>
</div><!-- /#main-content -->

<!-- ===== Footer ===== -->
<footer class="bg-surface-container-lowest border-t border-outline-variant mt-auto" role="contentinfo">
  <div class="max-w-store mx-auto px-margin py-16">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

      <!-- Brand -->
      <div class="md:col-span-1">
        <a href="<?= $vvBase ?>index.html" class="flex items-center gap-2.5 mb-4 hover:opacity-90 transition-opacity">
          <img src="<?= $vvBase ?>images/logo_notext.png" alt="VeVit" width="36" height="36" class="w-9 h-9 rounded-lg object-contain">
          <span class="font-display text-lg font-extrabold text-on-surface tracking-tight">VeVit<span class="text-primary">.</span></span>
        </a>
        <p class="font-body-md text-sm text-on-surface-variant leading-relaxed mb-4">
          Moderní e-shop s ověřeným sortimentem. Digitální produkty ihned po platbě, fyzické zboží s doručením do 2 dnů.
        </p>
        <!-- Payment methods -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-caption text-caption text-on-surface-variant uppercase tracking-wide">Platba:</span>
          <span class="badge badge-neutral">Karta</span>
          <span class="badge badge-neutral">Stripe</span>
        </div>
      </div>

      <!-- Obchod -->
      <div>
        <h3 class="font-mono-label text-mono-label text-on-surface uppercase tracking-widest mb-4">Obchod</h3>
        <ul class="flex flex-col gap-3">
          <?php
          $shopLinks = [
            [$vvBase . 'catalog.php',             'Všechny produkty'],
            [$vvBase . 'catalog.php?sort=newest',  'Novinky'],
            [$vvBase . 'catalog.php?deals=1',       'Slevy &amp; akce'],
            [$vvBase . 'catalog.php?type=digital',  'Digitální produkty'],
            [$vvBase . 'catalog.php?type=physical', 'Fyzické produkty'],
          ];
          foreach ($shopLinks as [$href, $label]): ?>
          <li>
            <a href="<?= h($href) ?>" class="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors duration-150">
              <?= $label ?>
            </a>
          </li>
          <?php endforeach; ?>
        </ul>
      </div>

      <!-- Zákaznické informace -->
      <div>
        <h3 class="font-mono-label text-mono-label text-on-surface uppercase tracking-widest mb-4">Zákazníci</h3>
        <ul class="flex flex-col gap-3">
          <?php
          $customerLinks = [
            [$vvBase . 'shipping.php', 'Doprava a platba'],
            [$vvBase . 'returns.php',  'Vrácení a reklamace'],
            [$vvBase . 'contact.php',  'Kontakt a podpora'],
            [$vvBase . 'about.php',    'O nás'],
          ];
          foreach ($customerLinks as [$href, $label]): ?>
          <li>
            <a href="<?= h($href) ?>" class="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors duration-150">
              <?= $label ?>
            </a>
          </li>
          <?php endforeach; ?>
        </ul>
      </div>

      <!-- Právní -->
      <div>
        <h3 class="font-mono-label text-mono-label text-on-surface uppercase tracking-widest mb-4">Právní</h3>
        <ul class="flex flex-col gap-3">
          <?php
          $legalLinks = [
            [$vvBase . 'terms.php',   'Obchodní podmínky'],
            [$vvBase . 'privacy.php', 'Ochrana soukromí'],
            [$vvBase . 'returns.php', 'Právo na odstoupení'],
          ];
          foreach ($legalLinks as [$href, $label]): ?>
          <li>
            <a href="<?= h($href) ?>" class="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors duration-150">
              <?= $label ?>
            </a>
          </li>
          <?php endforeach; ?>
        </ul>
        <!-- Secure badge -->
        <div class="mt-6 flex items-center gap-2 text-on-surface-variant">
          <span class="material-symbols-outlined text-[18px] text-primary icon-filled" aria-hidden="true">lock</span>
          <span class="font-caption text-caption">Zabezpečeno přes Stripe</span>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-outline-variant pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p class="font-caption text-caption text-on-surface-variant">
        © <?= date('Y') ?> VeVit Store. Všechna práva vyhrazena.
      </p>
      <div class="flex items-center gap-1 text-on-surface-variant">
        <span class="material-symbols-outlined text-[14px] text-primary icon-filled" aria-hidden="true">favorite</span>
        <span class="font-caption text-caption">Vyrobeno s péčí</span>
      </div>
    </div>
  </div>
</footer>

<!-- ===== Mobile Bottom Navigation ===== -->
<nav class="fixed bottom-0 left-0 w-full z-40 md:hidden bg-surface-container/95 backdrop-blur-md border-t border-outline-variant" aria-label="Rychlá navigace">
  <div class="flex items-stretch h-16">
    <?php
    $bottomItems = [
      ['href' => $vvBase . 'index.html',  'key' => 'home',    'icon' => 'home',         'label' => 'Domů'],
      ['href' => $vvBase . 'catalog.php', 'key' => 'catalog', 'icon' => 'storefront',   'label' => 'Katalog'],
      ['href' => $vvBase . 'cart.php',    'key' => 'cart',    'icon' => 'shopping_bag', 'label' => 'Košík'],
    ];
    foreach ($bottomItems as $item):
      $isActive = $activeNav === $item['key'];
    ?>
    <a href="<?= h($item['href']) ?>"
       class="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 relative <?= $isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface' ?>"
       <?= $isActive ? 'aria-current="page"' : '' ?>>
      <?php if ($item['key'] === 'cart'): ?>
        <span class="relative">
          <span class="material-symbols-outlined text-[22px] <?= $isActive ? 'icon-filled' : '' ?>" aria-hidden="true"><?= $item['icon'] ?></span>
          <span class="nav-cart-badge absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-0.5 bg-primary-container text-on-primary-fixed text-[9px] font-bold rounded-full flex items-center justify-center" style="display:none">0</span>
        </span>
      <?php else: ?>
        <span class="material-symbols-outlined text-[22px] <?= $isActive ? 'icon-filled' : '' ?>" aria-hidden="true"><?= $item['icon'] ?></span>
      <?php endif; ?>
      <span class="font-caption text-[10px] font-semibold tracking-wide uppercase"><?= $item['label'] ?></span>
      <?php if ($isActive): ?>
        <span class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></span>
      <?php endif; ?>
    </a>
    <?php endforeach; ?>

    <!-- Account -->
    <?php if ($currentUser): ?>
    <a href="<?= $vvBase ?>logout.php"
       class="flex-1 flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-error transition-colors duration-150">
      <span class="material-symbols-outlined text-[22px]" aria-hidden="true">logout</span>
      <span class="font-caption text-[10px] font-semibold tracking-wide uppercase">Odhlásit</span>
    </a>
    <?php else: ?>
    <button type="button" onclick="if(window.VevitAccount)VevitAccount.openLogin();"
       class="flex-1 flex flex-col items-center justify-center gap-0.5 text-on-surface-variant hover:text-primary transition-colors duration-150"
       aria-label="Přihlásit se přes VeVit Account">
      <span class="material-symbols-outlined text-[22px]" aria-hidden="true">person</span>
      <span class="font-caption text-[10px] font-semibold tracking-wide uppercase">Účet</span>
    </button>
    <?php endif; ?>
  </div>
</nav>

<script src="<?= $vvBase ?>assets/js/cart.js"></script>
<script src="<?= $vvBase ?>assets/js/app.js"></script>
</body>
</html>
