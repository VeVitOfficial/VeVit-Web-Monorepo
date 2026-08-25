<?php
require_once __DIR__ . '/config.php';
$pageTitle     = vv_t('store.meta.title_contact');
$metaDesc      = vv_t('store.meta.desc_contact');
$activeNav     = '';
$vvSectionPath = '/store/contact.php';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-10">

  <section class="text-center flex flex-col items-center gap-3">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest"><?= vv_t('store.contact.eyebrow') ?></span>
    <h1 class="font-display text-h1 text-on-surface"><?= vv_t('store.contact.title') ?></h1>
    <p class="text-on-surface-variant max-w-md mx-auto leading-relaxed">
      <?= vv_t('store.contact.lead') ?>
    </p>
  </section>

  <div class="grid sm:grid-cols-2 gap-4">
    <!-- Email -->
    <div class="card flex flex-col gap-3">
      <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">mail</span>
      </div>
      <h2 class="font-semibold text-on-surface"><?= vv_t('store.contact.email_t') ?></h2>
      <p class="text-sm text-on-surface-variant"><?= vv_t('store.contact.email_p') ?></p>
      <a href="mailto:info@vevit.cz" class="btn btn-primary btn-sm mt-auto">
        info@vevit.cz
      </a>
    </div>

    <!-- Response time -->
    <div class="card flex flex-col gap-3">
      <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">schedule</span>
      </div>
      <h2 class="font-semibold text-on-surface"><?= vv_t('store.contact.response_t') ?></h2>
      <ul class="text-sm text-on-surface-variant flex flex-col gap-2 mt-1">
        <li class="flex items-center gap-2">
          <span class="material-symbols-outlined text-success text-[14px] icon-filled" aria-hidden="true">check_circle</span>
          <?= vv_t('store.contact.r1') ?>
        </li>
        <li class="flex items-center gap-2">
          <span class="material-symbols-outlined text-success text-[14px] icon-filled" aria-hidden="true">check_circle</span>
          <?= vv_t('store.contact.r2') ?>
        </li>
        <li class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[14px] icon-filled" aria-hidden="true">mail</span>
          <?= vv_t('store.contact.r3') ?>
        </li>
      </ul>
    </div>
  </div>

  <!-- FAQ -->
  <section aria-labelledby="faq-heading" class="flex flex-col gap-4">
    <h2 id="faq-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest"><?= vv_t('store.contact.faq_title') ?></h2>
    <div class="flex flex-col gap-2">
      <?php
      $faqs = [
        [vv_t('store.contact.faq1_q'), vv_t('store.contact.faq1_a')],
        [vv_t('store.contact.faq2_q'), vv_t('store.contact.faq2_a')],
        [vv_t('store.contact.faq3_q'), vv_t('store.contact.faq3_a')],
        [vv_t('store.contact.faq4_q'), vv_t('store.contact.faq4_a')],
      ];
      foreach ($faqs as [$q, $a]): ?>
      <details class="vv-accordion bg-surface-container border border-outline-variant rounded-xl">
        <summary class="flex justify-between items-center gap-3 p-5 cursor-pointer font-semibold text-on-surface text-[15px] list-none">
          <?= h($q) ?>
          <span class="accordion-icon material-symbols-outlined text-primary shrink-0" aria-hidden="true">expand_more</span>
        </summary>
        <div class="px-5 pb-5 text-sm text-on-surface-variant leading-relaxed"><?= h($a) ?></div>
      </details>
      <?php endforeach; ?>
    </div>
  </section>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>
