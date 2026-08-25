<?php
require_once __DIR__ . '/config.php';
$pageTitle    = vv_t('store.meta.title_terms');
$metaDesc     = vv_t('store.meta.desc_terms');
$activeNav    = '';
$vvSectionPath = '/store/terms.php';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-8">

  <section class="flex flex-col gap-2">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest"><?= h(vv_t('store.terms.eyebrow')) ?></span>
    <h1 class="font-display text-h1 text-on-surface"><?= h(vv_t('store.terms.title')) ?></h1>
    <p class="text-sm text-on-surface-variant"><?= vv_t('store.terms.meta') ?></p>
  </section>

  <?php
  $sections = [
    ['store.terms.s1_t',  'store.terms.s1_b'],
    ['store.terms.s2_t',  'store.terms.s2_b'],
    ['store.terms.s3_t',  'store.terms.s3_b'],
    ['store.terms.s4_t',  'store.terms.s4_b'],
    ['store.terms.s5_t',  'store.terms.s5_b'],
    ['store.terms.s6_t',  'store.terms.s6_b'],
    ['store.terms.s7_t',  'store.terms.s7_b'],
    ['store.terms.s8_t',  'store.terms.s8_b'],
    ['store.terms.s9_t',  'store.terms.s9_b'],
    ['store.terms.s10_t', 'store.terms.s10_b'],
  ];
  foreach ($sections as $i => [$titleKey, $bodyKey]): ?>
  <section class="flex flex-col gap-2">
    <h2 class="font-semibold text-on-surface flex items-center gap-2">
      <span class="font-mono-label text-xs text-primary"><?= $i + 1 ?>.</span>
      <?= h(vv_t($titleKey)) ?>
    </h2>
    <p class="text-sm text-on-surface-variant leading-relaxed"><?= vv_t($bodyKey) ?></p>
  </section>
  <?php endforeach; ?>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>