<?php
require_once __DIR__ . '/config.php';
$pageTitle     = vv_t('store.meta.title_returns');
$metaDesc      = vv_t('store.meta.desc_returns');
$activeNav     = '';
$vvSectionPath = '/store/returns.php';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-10">

  <section class="text-center flex flex-col items-center gap-3">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest"><?= vv_t('store.returns.eyebrow') ?></span>
    <h1 class="font-display text-h1 text-on-surface"><?= vv_t('store.returns.title') ?></h1>
    <p class="text-on-surface-variant max-w-md mx-auto leading-relaxed"><?= vv_t('store.returns.lead') ?></p>
  </section>

  <!-- Physical return -->
  <section aria-labelledby="physical-heading" class="flex flex-col gap-4">
    <h2 id="physical-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest"><?= vv_t('store.returns.physical_title') ?></h2>
    <div class="card flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-success icon-filled" aria-hidden="true">undo</span>
        </div>
        <div>
          <h3 class="font-semibold text-on-surface"><?= vv_t('store.returns.physical_h') ?></h3>
          <p class="text-sm text-on-surface-variant"><?= vv_t('store.returns.physical_sub') ?></p>
        </div>
      </div>
      <ul class="text-sm text-on-surface-variant flex flex-col gap-2 pl-1">
        <li class="flex items-start gap-2">
          <span class="material-symbols-outlined text-primary text-[14px] icon-filled mt-0.5 shrink-0" aria-hidden="true">check</span>
          <?= vv_t('store.returns.physical_l1') ?>
        </li>
        <li class="flex items-start gap-2">
          <span class="material-symbols-outlined text-primary text-[14px] icon-filled mt-0.5 shrink-0" aria-hidden="true">check</span>
          <?= vv_t('store.returns.physical_l2') ?>
        </li>
        <li class="flex items-start gap-2">
          <span class="material-symbols-outlined text-primary text-[14px] icon-filled mt-0.5 shrink-0" aria-hidden="true">check</span>
          <?= vv_t('store.returns.physical_l3') ?>
        </li>
      </ul>
    </div>
  </section>

  <!-- Digital return -->
  <section aria-labelledby="digital-heading" class="flex flex-col gap-4">
    <h2 id="digital-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest"><?= vv_t('store.returns.digital_title') ?></h2>
    <div class="card flex flex-col gap-3">
      <div class="flex items-start gap-3 bg-warning/8 border border-warning/25 rounded-lg p-3">
        <span class="material-symbols-outlined text-warning text-[18px] icon-filled shrink-0 mt-0.5" aria-hidden="true">info</span>
        <p class="text-sm text-on-surface-variant leading-relaxed">
          <?= vv_t('store.returns.digital_warning') ?>
        </p>
      </div>
      <p class="text-sm text-on-surface-variant"><?= vv_t('store.returns.digital_p') ?></p>
    </div>
  </section>

  <!-- Claims -->
  <section aria-labelledby="claims-heading" class="flex flex-col gap-4">
    <h2 id="claims-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest"><?= vv_t('store.returns.claims_title') ?></h2>
    <div class="card flex flex-col gap-3">
      <p class="text-sm text-on-surface-variant leading-relaxed"><?= vv_t('store.returns.claims_intro') ?></p>
      <ol class="text-sm text-on-surface-variant flex flex-col gap-2 pl-1 list-none">
        <?php
        $steps = [
          vv_t('store.returns.claims_s1'),
          vv_t('store.returns.claims_s2'),
          vv_t('store.returns.claims_s3'),
          vv_t('store.returns.claims_s4'),
        ];
        foreach ($steps as $i => $step): ?>
        <li class="flex items-start gap-3">
          <span class="w-6 h-6 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"><?= $i + 1 ?></span>
          <span class="leading-relaxed"><?= $step ?></span>
        </li>
        <?php endforeach; ?>
      </ol>
    </div>
  </section>

  <!-- Contact CTA -->
  <div class="text-center flex flex-col items-center gap-3">
    <p class="text-sm text-on-surface-variant"><?= vv_t('store.returns.cta_text') ?></p>
    <a href="contact.php" class="btn btn-outline">
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">mail</span>
      <?= vv_t('store.returns.cta_button') ?>
    </a>
  </div>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>
