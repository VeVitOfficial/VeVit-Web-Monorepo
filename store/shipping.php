<?php
require_once __DIR__ . '/config.php';
$pageTitle     = vv_t('store.meta.title_shipping');
$metaDesc      = vv_t('store.meta.desc_shipping');
$activeNav     = '';
$vvSectionPath = '/store/shipping.php';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-10">

  <section class="text-center flex flex-col items-center gap-3">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest"><?= vv_t('store.shipping.eyebrow') ?></span>
    <h1 class="font-display text-h1 text-on-surface"><?= vv_t('store.shipping.title') ?></h1>
    <p class="text-on-surface-variant max-w-md mx-auto leading-relaxed"><?= vv_t('store.shipping.lead') ?></p>
  </section>

  <!-- Shipping -->
  <section aria-labelledby="shipping-heading" class="flex flex-col gap-4">
    <h2 id="shipping-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest"><?= vv_t('store.shipping.shipping_title') ?></h2>
    <div class="card flex flex-col gap-4">
      <div class="flex items-center gap-3 pb-4 border-b border-outline-variant/50">
        <div class="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-success icon-filled" aria-hidden="true">local_shipping</span>
        </div>
        <div>
          <h3 class="font-semibold text-on-surface"><?= vv_t('store.shipping.physical_t') ?></h3>
          <p class="text-sm text-on-surface-variant"><?= vv_t('store.shipping.physical_p') ?></p>
        </div>
        <div class="ml-auto text-right">
          <p class="font-bold text-on-surface"><?= vv_t('store.shipping.physical_price') ?></p>
          <p class="text-xs text-primary font-semibold"><?= vv_t('store.shipping.free_from') ?></p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">download</span>
        </div>
        <div>
          <h3 class="font-semibold text-on-surface"><?= vv_t('store.shipping.digital_t') ?></h3>
          <p class="text-sm text-on-surface-variant"><?= vv_t('store.shipping.digital_p') ?></p>
        </div>
        <div class="ml-auto">
          <span class="badge badge-primary"><?= vv_t('store.common.free') ?></span>
        </div>
      </div>
    </div>
  </section>

  <!-- Payment -->
  <section aria-labelledby="payment-heading" class="flex flex-col gap-4">
    <h2 id="payment-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest"><?= vv_t('store.shipping.payment_title') ?></h2>
    <div class="card flex flex-col gap-4">
      <p class="text-sm text-on-surface-variant"><?= vv_t('store.shipping.payment_intro') ?></p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <?php
        $methods = [
          ['credit_card',    vv_t('store.shipping.method_card_t'), vv_t('store.shipping.method_card_s')],
          ['smartphone',     vv_t('store.shipping.method_pay_t'),  vv_t('store.shipping.method_pay_s')],
          ['account_balance',vv_t('store.shipping.method_bank_t'), vv_t('store.shipping.method_bank_s')],
        ];
        foreach ($methods as [$icon, $name, $sub]): ?>
        <div class="bg-surface-container-low border border-outline-variant/50 rounded-lg p-3 flex flex-col gap-1.5">
          <span class="material-symbols-outlined text-primary icon-filled text-[20px]" aria-hidden="true"><?= $icon ?></span>
          <p class="font-semibold text-[13px] text-on-surface"><?= h($name) ?></p>
          <p class="text-[11px] text-on-surface-variant"><?= h($sub) ?></p>
        </div>
        <?php endforeach; ?>
      </div>
    </div>
  </section>

  <!-- Security note -->
  <div class="flex items-start gap-3 bg-primary/8 border border-primary/25 rounded-xl px-5 py-4 text-sm">
    <span class="material-symbols-outlined text-primary text-[18px] icon-filled flex-shrink-0 mt-0.5" aria-hidden="true">lock</span>
    <div class="text-on-surface-variant leading-relaxed">
      <strong class="text-on-surface"><?= vv_t('store.shipping.security_label') ?></strong> <?= vv_t('store.shipping.security_text') ?>
    </div>
  </div>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>
