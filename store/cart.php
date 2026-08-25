<?php
require_once __DIR__ . '/config.php';
$pageTitle    = vv_t('store.meta.title_cart');
$metaDesc     = vv_t('store.meta.desc_default');
$activeNav    = 'cart';
$vvSectionPath = '/store/cart.php';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-store mx-auto px-margin py-10 flex flex-col lg:flex-row gap-8">

  <!-- Cart Items -->
  <section class="flex-grow lg:w-2/3 flex flex-col gap-6">
    <div>
      <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest block mb-1"><?= vv_t('store.cart.step') ?></span>
      <h1 class="font-display text-h1 text-on-surface"><?= vv_t('store.cart.title') ?></h1>
    </div>

    <!-- Items list -->
    <div id="cartItems" class="flex flex-col gap-4" aria-live="polite" aria-label="<?= h(vv_t('store.cart.items_aria')) ?>"></div>

    <!-- Empty state -->
    <div id="emptyCart" class="hidden flex flex-col items-center text-center py-16 gap-5">
      <div class="w-20 h-20 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center">
        <span class="material-symbols-outlined text-[40px] text-on-surface-variant" aria-hidden="true">shopping_bag</span>
      </div>
      <div>
        <h2 class="font-h2 text-[20px] font-bold text-on-surface mb-1"><?= vv_t('store.cart.empty_title') ?></h2>
        <p class="text-sm text-on-surface-variant"><?= vv_t('store.cart.empty_text') ?></p>
      </div>
      <a href="catalog.php" class="btn btn-primary">
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">storefront</span>
        <?= vv_t('store.cart.continue_shopping') ?>
      </a>
    </div>

    <!-- Continue shopping (shown when items exist) -->
    <div id="cartContinue" class="hidden">
      <a href="catalog.php" class="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
        <?= vv_t('store.cart.continue_shopping') ?>
      </a>
    </div>
  </section>

  <!-- Summary sidebar -->
  <aside class="w-full lg:w-80 flex flex-col gap-4">
    <div class="bg-surface-container border border-outline-variant rounded-xl p-6 sticky top-32" id="cartSummary">
      <h2 class="font-bold text-[18px] text-on-surface mb-4 pb-3 border-b border-outline-variant"><?= vv_t('store.cart.summary') ?></h2>
      <div class="flex flex-col gap-3 text-sm mb-4">
        <div class="flex justify-between text-on-surface-variant">
          <span><?= vv_t('store.cart.subtotal') ?></span>
          <span id="summarySubtotal" class="text-on-surface font-semibold">0 Kč</span>
        </div>
        <div class="flex justify-between text-on-surface-variant">
          <span><?= vv_t('store.cart.shipping') ?></span>
          <span id="summaryShipping" class="text-on-surface font-semibold"><?= vv_t('store.common.free') ?></span>
        </div>
        <p id="summaryShippingNote" class="text-xs text-primary hidden"></p>
      </div>
      <div class="flex justify-between items-center border-t border-outline-variant pt-4 mb-5">
        <span class="font-bold text-on-surface"><?= vv_t('store.cart.total') ?></span>
        <span id="summaryTotal" class="font-display text-[22px] font-bold text-primary">0 Kč</span>
      </div>
      <button type="button" id="checkoutButton" class="btn btn-primary btn-lg w-full">
        <?= vv_t('store.cart.checkout') ?>
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
      </button>
      <div class="mt-3 flex items-center justify-center gap-1.5 text-xs text-on-surface-variant">
        <span class="material-symbols-outlined text-[14px] icon-filled" aria-hidden="true">lock</span>
        <?= vv_t('store.cart.secured_stripe') ?>
      </div>
    </div>

    <!-- Trust badges -->
    <div class="bg-surface-container border border-outline-variant rounded-xl p-4 flex items-center justify-around" aria-label="<?= h(vv_t('store.cart.trust_aria')) ?>">
      <div class="text-center flex flex-col items-center gap-1">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">verified_user</span>
        <span class="font-mono-label text-[10px] text-on-surface-variant uppercase">SSL</span>
      </div>
      <div class="text-center flex flex-col items-center gap-1">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">credit_card</span>
        <span class="font-mono-label text-[10px] text-on-surface-variant uppercase">Stripe</span>
      </div>
      <div class="text-center flex flex-col items-center gap-1">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">undo</span>
        <span class="font-mono-label text-[10px] text-on-surface-variant uppercase"><?= vv_t('store.cart.trust_14days') ?></span>
      </div>
    </div>
  </aside>
</main>

<script defer src="assets/js/cart-page.js"></script>

<?php include __DIR__ . '/lib/footer.php'; ?>