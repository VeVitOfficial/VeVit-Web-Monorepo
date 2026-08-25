<?php
// Shared footer — Release 1 Storefront
$activeNav = $activeNav ?? '';
$vvBase    = defined('VEVIT_BASE') ? VEVIT_BASE : '';
$currentUser = $currentUser ?? null;
$vvLang    = vv_i18n_get_lang();
?>
</div><!-- /#main-content -->

<!-- ===== Footer ===== -->
<footer class="bg-surface-container-lowest border-t border-outline-variant mt-auto" role="contentinfo">
  <div class="max-w-store mx-auto px-margin py-16">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

      <!-- Brand -->
      <div class="md:col-span-1">
        <a href="<?= $vvBase ?>index.php" class="flex items-center gap-2.5 mb-4 hover:opacity-90 transition-opacity">
          <img src="<?= $vvBase ?>images/logo_notext.webp" alt="VeVit" width="36" height="36" class="w-9 h-9 rounded-lg object-contain">
          <span class="font-display text-lg font-extrabold text-on-surface tracking-tight">VeVit<span class="text-primary">.</span></span>
        </a>
        <p class="font-body-md text-sm text-on-surface-variant leading-relaxed mb-4">
          <?= vv_t('store.footer.brand_desc') ?>
        </p>
        <!-- Payment methods -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-caption text-caption text-on-surface-variant uppercase tracking-wide"><?= vv_t('store.footer.payment_label') ?></span>
          <span class="badge badge-neutral"><?= vv_t('store.footer.payment_card') ?></span>
          <span class="badge badge-neutral"><?= vv_t('store.footer.payment_stripe') ?></span>
        </div>
      </div>

      <!-- Obchod -->
      <div>
        <h3 class="font-mono-label text-mono-label text-on-surface uppercase tracking-widest mb-4"><?= vv_t('store.footer.col_shop') ?></h3>
        <ul class="flex flex-col gap-3">
          <?php
          $shopLinks = [
            [$vvBase . 'catalog.php',             vv_t('store.footer.all_products')],
            [$vvBase . 'catalog.php?sort=newest',  vv_t('store.footer.new_arrivals')],
            [$vvBase . 'catalog.php?deals=1',       vv_t('store.footer.deals_actions')],
            [$vvBase . 'catalog.php?type=digital',  vv_t('store.footer.digital_products')],
            [$vvBase . 'catalog.php?type=physical', vv_t('store.footer.physical_products')],
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
        <h3 class="font-mono-label text-mono-label text-on-surface uppercase tracking-widest mb-4"><?= vv_t('store.footer.col_customers') ?></h3>
        <ul class="flex flex-col gap-3">
          <?php
          $customerLinks = [
            [$vvBase . 'shipping.php', vv_t('store.footer.shipping_payment')],
            [$vvBase . 'returns.php',  vv_t('store.footer.returns_claims')],
            [$vvBase . 'contact.php',  vv_t('store.footer.contact_support')],
            [$vvBase . 'about.php',    vv_t('store.footer.about_us')],
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
        <h3 class="font-mono-label text-mono-label text-on-surface uppercase tracking-widest mb-4"><?= vv_t('store.footer.col_legal') ?></h3>
        <ul class="flex flex-col gap-3">
          <?php
          $legalLinks = [
            [$vvBase . 'terms.php',   vv_t('store.footer.terms')],
            [$vvBase . 'privacy.php', vv_t('store.footer.privacy')],
            [$vvBase . 'returns.php', vv_t('store.footer.withdrawal_right')],
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
          <span class="font-caption text-caption"><?= vv_t('store.footer.secured_stripe') ?></span>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-outline-variant pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p class="font-caption text-caption text-on-surface-variant">
        <?= vv_t('store.footer.copyright', null, ['YEAR' => date('Y')]) ?>
      </p>
      <div class="flex items-center gap-1 text-on-surface-variant">
        <span class="material-symbols-outlined text-[14px] text-primary icon-filled" aria-hidden="true">favorite</span>
        <span class="font-caption text-caption"><?= vv_t('store.footer.made_with_care') ?></span>
      </div>
    </div>
  </div>
</footer>

<!-- ===== Mobile Bottom Navigation ===== -->
<nav class="fixed bottom-0 left-0 w-full z-40 md:hidden bg-surface-container/95 backdrop-blur-md border-t border-outline-variant" aria-label="<?= h(vv_t('store.nav.quick_aria')) ?>">
  <div class="flex items-stretch h-16">
    <?php
    $bottomItems = [
      ['href' => $vvBase . 'index.php',  'key' => 'home',    'icon' => 'home',         'label' => vv_t('store.nav.home')],
      ['href' => $vvBase . 'catalog.php', 'key' => 'catalog', 'icon' => 'storefront',   'label' => vv_t('store.nav.catalog')],
      ['href' => $vvBase . 'cart.php',    'key' => 'cart',    'icon' => 'shopping_bag', 'label' => vv_t('store.nav.cart')],
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

    <!-- Account: vykreslí jednotný modul po ověření Account relace. -->
    <span data-vevit-session></span>
  </div>
</nav>

<script src="<?= $vvBase ?>assets/js/cart.js"></script>
<script src="<?= $vvBase ?>assets/js/app.js"></script>
</body>
</html>