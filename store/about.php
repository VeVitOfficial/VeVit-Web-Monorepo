<?php
require_once __DIR__ . '/config.php';
$pageTitle     = vv_t('store.meta.title_about');
$metaDesc      = vv_t('store.meta.desc_about');
$activeNav     = '';
$vvSectionPath = '/store/about.php';
$vvBase        = defined('VEVIT_BASE') ? VEVIT_BASE : '';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-12">

  <!-- Hero -->
  <section class="text-center flex flex-col items-center gap-4">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest"><?= vv_t('store.about.eyebrow') ?></span>
    <h1 class="font-display text-h1 text-on-surface"><?= vv_t('store.about.title') ?></h1>
    <p class="text-on-surface-variant max-w-lg mx-auto leading-relaxed">
      <?= vv_t('store.about.lead') ?>
    </p>
  </section>

  <!-- Values -->
  <section aria-labelledby="values-heading">
    <h2 id="values-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest mb-6"><?= vv_t('store.about.values_title') ?></h2>
    <div class="grid sm:grid-cols-2 gap-4">
      <?php
      $values = [
        ['lock',          vv_t('store.about.v1_t'), vv_t('store.about.v1_p')],
        ['verified',      vv_t('store.about.v2_t'), vv_t('store.about.v2_p')],
        ['bolt',          vv_t('store.about.v3_t'), vv_t('store.about.v3_p')],
        ['support_agent', vv_t('store.about.v4_t'), vv_t('store.about.v4_p')],
      ];
      foreach ($values as [$icon, $title, $text]): ?>
      <div class="card flex flex-col gap-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true"><?= $icon ?></span>
        </div>
        <h3 class="font-semibold text-on-surface"><?= h($title) ?></h3>
        <p class="text-sm text-on-surface-variant leading-relaxed"><?= h($text) ?></p>
      </div>
      <?php endforeach; ?>
    </div>
  </section>

  <!-- Story -->
  <section class="flex flex-col gap-4">
    <h2 class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest"><?= vv_t('store.about.story_title') ?></h2>
    <p class="text-on-surface-variant leading-relaxed">
      <?= vv_t('store.about.story_p1') ?>
    </p>
    <p class="text-on-surface-variant leading-relaxed">
      <?= vv_t('store.about.story_p2') ?>
    </p>
  </section>

  <!-- CTA -->
  <section class="bg-surface-container border border-outline-variant rounded-xl p-8 text-center flex flex-col items-center gap-4">
    <span class="material-symbols-outlined text-primary text-[36px] icon-filled" aria-hidden="true">storefront</span>
    <h2 class="font-bold text-[20px] text-on-surface"><?= vv_t('store.about.cta_title') ?></h2>
    <p class="text-sm text-on-surface-variant max-w-xs"><?= vv_t('store.about.cta_text') ?></p>
    <a href="<?= $vvBase ?>catalog.php" class="btn btn-primary">
      <?= vv_t('store.about.cta_button') ?>
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
    </a>
  </section>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>
