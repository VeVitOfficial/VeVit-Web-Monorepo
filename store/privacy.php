<?php
require_once __DIR__ . '/config.php';
$pageTitle    = vv_t('store.meta.title_privacy');
$metaDesc     = vv_t('store.meta.desc_privacy');
$activeNav    = '';
$vvSectionPath = '/store/privacy.php';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-8">

  <section class="flex flex-col gap-2">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest"><?= h(vv_t('store.privacy.eyebrow')) ?></span>
    <h1 class="font-display text-h1 text-on-surface"><?= h(vv_t('store.privacy.title')) ?></h1>
    <p class="text-sm text-on-surface-variant"><?= vv_t('store.privacy.meta') ?></p>
  </section>

  <!-- Summary -->
  <div class="flex items-start gap-3 bg-primary/8 border border-primary/25 rounded-xl px-5 py-4 text-sm">
    <span class="material-symbols-outlined text-primary text-[18px] icon-filled shrink-0 mt-0.5" aria-hidden="true">shield</span>
    <p class="text-on-surface-variant leading-relaxed">
      <strong class="text-on-surface"><?= h(vv_t('store.privacy.summary_label')) ?></strong> <?= vv_t('store.privacy.summary_text') ?>
    </p>
  </div>

  <?php
  $sections = [
    ['store.privacy.s1_t', 'store.privacy.s1_b'],
    ['store.privacy.s2_t', 'store.privacy.s2_b'],
    ['store.privacy.s3_t', 'store.privacy.s3_b'],
    ['store.privacy.s4_t', 'store.privacy.s4_b'],
    ['store.privacy.s5_t', 'store.privacy.s5_b'],
    ['store.privacy.s6_t', 'store.privacy.s6_b'],
    ['store.privacy.s7_t', 'store.privacy.s7_b'],
  ];
  foreach ($sections as $i => [$titleKey, $bodyKey]): ?>
  <section class="flex flex-col gap-2">
    <h2 class="font-semibold text-on-surface flex items-center gap-2">
      <span class="font-mono-label text-xs text-primary"><?= $i + 1 ?>.</span>
      <?= h(vv_t($titleKey)) ?>
    </h2>
    <p class="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line"><?= vv_t($bodyKey) ?></p>
  </section>
  <?php endforeach; ?>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>