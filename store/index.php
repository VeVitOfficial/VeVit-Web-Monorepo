<?php
require_once __DIR__ . '/config.php';
$pageTitle   = vv_t('store.meta.title_default') . ' — ' . vv_t('store.home.hero_title') . ' ' . vv_t('store.home.hero_title_accent');
$metaDesc    = vv_t('store.meta.desc_default');
$activeNav   = 'home';
$vvSectionPath = '/store';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full">

  <!-- ===== Hero ===== -->
  <section class="relative overflow-hidden" aria-labelledby="hero-heading"
           style="background:linear-gradient(135deg,#052e16 0%,#064e3b 45%,#0f172a 100%)">
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
         style="background:radial-gradient(ellipse 70% 60% at 65% 50%,rgba(16,185,129,.13) 0%,transparent 70%)"></div>
    <div class="absolute inset-0 pointer-events-none opacity-[0.035]" aria-hidden="true"
         style="background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);background-size:48px 48px"></div>

    <div class="relative max-w-store mx-auto px-margin py-16 md:py-24 grid md:grid-cols-2 gap-10 md:gap-16 items-center">

      <!-- Left: text -->
      <div>
        <span class="inline-flex items-center gap-1.5 font-mono-label text-mono-label text-primary uppercase tracking-widest mb-4">
          <span class="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
          <?= vv_t('store.home.hero_eyebrow') ?>
        </span>
        <h1 id="hero-heading" class="font-display text-[36px] md:text-[52px] font-extrabold text-on-surface leading-[1.1] tracking-tight mb-5"
            style="color:#f0fdf4">
          <?= vv_t('store.home.hero_title') ?><br>
          <span style="color:#4edea3"><?= vv_t('store.home.hero_title_accent') ?></span>
        </h1>
        <p class="font-body-lg text-[17px] leading-relaxed mb-8" style="color:#a7f3d0">
          <?= vv_t('store.home.hero_text') ?>
        </p>

        <div class="flex flex-wrap gap-3 mb-10">
          <a href="catalog.php" class="btn btn-primary btn-lg">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">explore</span>
            <?= vv_t('store.home.hero_browse') ?>
          </a>
          <a href="catalog.php#categories" class="btn btn-outline btn-lg" style="border-color:rgba(78,222,163,.4);color:#4edea3">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">category</span>
            <?= vv_t('store.home.hero_categories') ?>
          </a>
        </div>

        <!-- Benefits -->
        <div class="flex flex-col gap-2.5">
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-[18px] icon-filled flex-shrink-0" style="color:#4edea3" aria-hidden="true">lock</span>
            <span class="font-body-md text-[14px]" style="color:#a7f3d0"><?= vv_t('store.home.benefit_secure') ?></span>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-[18px] icon-filled flex-shrink-0" style="color:#4edea3" aria-hidden="true">bolt</span>
            <span class="font-body-md text-[14px]" style="color:#a7f3d0"><?= vv_t('store.home.benefit_instant') ?></span>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="material-symbols-outlined text-[18px] icon-filled flex-shrink-0" style="color:#4edea3" aria-hidden="true">assignment_return</span>
            <span class="font-body-md text-[14px]" style="color:#a7f3d0"><?= vv_t('store.home.benefit_returns') ?></span>
          </div>
        </div>
      </div>

      <!-- Right: brand composition -->
      <div class="hidden md:flex items-center justify-center" aria-hidden="true">
        <div class="relative w-full max-w-[380px] aspect-square">
          <div class="absolute inset-0 rounded-full opacity-20"
               style="background:radial-gradient(circle,#10b981 0%,transparent 70%)"></div>

          <div class="absolute top-[8%] left-[5%] bg-surface-container border border-outline-variant rounded-xl p-4 shadow-lg w-40"
               style="border-color:rgba(16,185,129,.2)">
            <div class="w-full aspect-square rounded-lg cat-bg-digital flex items-center justify-center mb-3">
              <span class="material-symbols-outlined text-[36px] text-white/70">palette</span>
            </div>
            <div class="font-body-md text-[12px] font-bold text-on-surface truncate">UI Kit Pro</div>
            <div class="font-display text-[15px] font-bold" style="color:#4edea3"><?= vv_format_price(490.0) ?></div>
          </div>

          <div class="absolute top-[5%] right-[5%] bg-surface-container border border-outline-variant rounded-xl p-4 shadow-lg w-36"
               style="border-color:rgba(16,185,129,.2)">
            <div class="w-full aspect-square rounded-lg cat-bg-electronics flex items-center justify-center mb-3">
              <span class="material-symbols-outlined text-[32px] text-white/70">devices</span>
            </div>
            <div class="font-body-md text-[11px] font-bold text-on-surface truncate">TWS</div>
            <div class="font-display text-[14px] font-bold" style="color:#4edea3"><?= vv_format_price(1290.0) ?></div>
          </div>

          <div class="absolute bottom-[12%] right-[0%] bg-surface-container border border-outline-variant rounded-xl p-4 shadow-lg w-44"
               style="border-color:rgba(16,185,129,.2)">
            <div class="w-full aspect-square rounded-lg cat-bg-merch flex items-center justify-center mb-3">
              <span class="material-symbols-outlined text-[36px] text-white/70">shirt</span>
            </div>
            <div class="font-body-md text-[12px] font-bold text-on-surface truncate">VeVit</div>
            <div class="font-display text-[15px] font-bold" style="color:#4edea3"><?= vv_format_price(890.0) ?></div>
          </div>

          <div class="absolute bottom-[8%] left-[5%] bg-primary-container/20 border border-primary/30 rounded-xl px-4 py-3 shadow-lg">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] icon-filled text-primary">verified</span>
              <span class="font-mono-label text-[11px] text-on-surface uppercase tracking-wide"><?= vv_t('store.home.verified_badge') ?></span>
            </div>
          </div>

          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl bg-surface-container border-2 flex items-center justify-center shadow-xl"
               style="border-color:#10b981">
            <img src="images/logo_notext.webp" alt="VeVit" width="48" height="48" class="w-12 h-12 object-contain rounded-lg">
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== Categories ===== -->
  <section id="categoriesSection" class="max-w-store mx-auto px-margin py-14" aria-labelledby="cats-heading">
    <div class="flex items-end justify-between mb-6">
      <div>
        <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest block mb-1"><?= vv_t('store.home.cats_eyebrow') ?></span>
        <h2 id="cats-heading" class="font-display text-h1 text-on-surface"><?= vv_t('store.home.cats_title') ?></h2>
      </div>
      <a href="catalog.php" class="btn btn-outline btn-sm hidden sm:inline-flex">
        <?= vv_t('store.home.cats_full_catalog') ?> <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
      </a>
    </div>
    <div id="categoriesGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div class="skeleton rounded-xl h-[160px]"></div>
      <div class="skeleton rounded-xl h-[160px]"></div>
      <div class="skeleton rounded-xl h-[160px]"></div>
      <div class="skeleton rounded-xl h-[160px]"></div>
      <div class="skeleton rounded-xl h-[160px]"></div>
      <div class="skeleton rounded-xl h-[160px]"></div>
      <div class="skeleton rounded-xl h-[160px]"></div>
      <div class="skeleton rounded-xl h-[160px]"></div>
    </div>
    <div id="catsEmpty" class="hidden text-center py-12">
      <span class="material-symbols-outlined text-[48px] text-on-surface-variant/40 block mb-3" aria-hidden="true">category</span>
      <p class="font-body-md text-on-surface-variant mb-4"><?= vv_t('store.home.cats_loading') ?></p>
      <a href="catalog.php" class="btn btn-primary"><?= vv_t('store.home.cats_open_catalog') ?></a>
    </div>
  </section>

  <!-- ===== Doporučené produkty ===== -->
  <section id="featuredSection" class="bg-surface-container-low border-y border-outline-variant" aria-labelledby="featured-heading">
    <div class="max-w-store mx-auto px-margin py-14">
      <div class="flex items-end justify-between mb-6">
        <div>
          <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest block mb-1"><?= vv_t('store.home.featured_eyebrow') ?></span>
          <h2 id="featured-heading" class="font-display text-h1 text-on-surface"><?= vv_t('store.home.featured_title') ?></h2>
        </div>
        <a href="catalog.php" class="btn btn-outline btn-sm hidden sm:inline-flex">
          <?= vv_t('store.home.featured_all') ?> <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
        </a>
      </div>
      <div id="featuredGrid" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="skeleton rounded-xl h-[280px]"></div>
        <div class="skeleton rounded-xl h-[280px]"></div>
        <div class="skeleton rounded-xl h-[280px]"></div>
        <div class="skeleton rounded-xl h-[280px]"></div>
      </div>
      <div id="featuredEmpty" class="hidden">
        <div class="bg-surface-container border border-outline-variant rounded-2xl p-10 text-center">
          <span class="material-symbols-outlined text-[40px] text-primary/50 block mb-3" aria-hidden="true">storefront</span>
          <h3 class="font-h2 text-h2 text-on-surface mb-2"><?= vv_t('store.home.featured_empty_t') ?></h3>
          <p class="font-body-md text-on-surface-variant mb-5 max-w-sm mx-auto">
            <?= vv_t('store.home.featured_empty_p') ?>
          </p>
          <div class="flex flex-wrap gap-3 justify-center">
            <a href="catalog.php" class="btn btn-primary"><?= vv_t('store.home.featured_go_catalog') ?></a>
            <a href="contact.php" class="btn btn-outline"><?= vv_t('store.home.cta_contact') ?></a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== V akci (deals) ===== -->
  <section id="dealsSection" class="hidden max-w-store mx-auto px-margin py-14" aria-labelledby="deals-heading">
    <div class="flex items-end justify-between mb-6">
      <h2 id="deals-heading" class="font-display text-h1 text-on-surface flex items-center gap-2">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">sell</span> <?= vv_t('store.home.deals_title') ?>
      </h2>
      <a href="catalog.php?deals=1" class="btn btn-outline btn-sm hidden sm:inline-flex">
        <?= vv_t('store.home.deals_all') ?> <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
      </a>
    </div>
    <div id="dealsGrid" class="grid grid-cols-2 md:grid-cols-4 gap-4" role="list"></div>
  </section>

  <!-- ===== Digital / Physical rozcestník ===== -->
  <section class="max-w-store mx-auto px-margin py-14" aria-labelledby="types-heading">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest block mb-1"><?= vv_t('store.home.types_eyebrow') ?></span>
    <h2 id="types-heading" class="font-display text-h1 text-on-surface mb-8"><?= vv_t('store.home.types_title') ?></h2>
    <div class="grid md:grid-cols-2 gap-6">

      <!-- Digital -->
      <a href="catalog.php?type=digital"
         class="group relative overflow-hidden bg-surface-container border border-outline-variant rounded-2xl p-8 hover:border-primary/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg block">
        <div class="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5 -translate-y-1/2 translate-x-1/4"
             style="background:radial-gradient(circle,#10b981,transparent)" aria-hidden="true"></div>
        <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
          <span class="material-symbols-outlined text-[26px] text-primary icon-filled" aria-hidden="true">download</span>
        </div>
        <h3 class="font-display text-h2 text-on-surface mb-2"><?= vv_t('store.home.types_digital_t') ?></h3>
        <p class="font-body-md text-on-surface-variant text-sm leading-relaxed mb-5">
          <?= vv_t('store.home.types_digital_p') ?>
        </p>
        <span class="inline-flex items-center gap-1.5 font-mono-label text-mono-label text-primary uppercase text-[11px] group-hover:gap-2.5 transition-all duration-150">
          <?= vv_t('store.home.types_digital_browse') ?>
          <span class="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
        </span>
      </a>

      <!-- Physical -->
      <a href="catalog.php?type=physical"
         class="group relative overflow-hidden bg-surface-container border border-outline-variant rounded-2xl p-8 hover:border-primary/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg block">
        <div class="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5 -translate-y-1/2 translate-x-1/4"
             style="background:radial-gradient(circle,#10b981,transparent)" aria-hidden="true"></div>
        <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
          <span class="material-symbols-outlined text-[26px] text-primary icon-filled" aria-hidden="true">inventory_2</span>
        </div>
        <h3 class="font-display text-h2 text-on-surface mb-2"><?= vv_t('store.home.types_physical_t') ?></h3>
        <p class="font-body-md text-on-surface-variant text-sm leading-relaxed mb-5">
          <?= vv_t('store.home.types_physical_p') ?>
        </p>
        <span class="inline-flex items-center gap-1.5 font-mono-label text-mono-label text-primary uppercase text-[11px] group-hover:gap-2.5 transition-all duration-150">
          <?= vv_t('store.home.types_physical_browse') ?>
          <span class="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
        </span>
      </a>
    </div>
  </section>

  <!-- ===== Oblíbené (bestsellers) ===== -->
  <section id="bestSection" class="hidden bg-surface-container-low border-y border-outline-variant" aria-labelledby="best-heading">
    <div class="max-w-store mx-auto px-margin py-14">
      <div class="flex items-end justify-between mb-6">
        <h2 id="best-heading" class="font-display text-h1 text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">trending_up</span> <?= vv_t('store.home.best_title') ?>
        </h2>
        <a href="catalog.php?sort=bestselling" class="btn btn-outline btn-sm hidden sm:inline-flex">
          <?= vv_t('store.home.best_all') ?> <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
        </a>
      </div>
      <div id="bestGrid" class="grid grid-cols-2 md:grid-cols-4 gap-4" role="list"></div>
    </div>
  </section>

  <!-- ===== Value propositions ===== -->
  <section class="max-w-store mx-auto px-margin py-14" aria-labelledby="values-heading">
    <h2 id="values-heading" class="sr-only"><?= vv_t('store.home.values_title') ?></h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">

      <div class="bg-surface-container border border-outline-variant rounded-2xl p-7 flex flex-col">
        <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 flex-shrink-0">
          <span class="material-symbols-outlined text-primary icon-filled text-[26px]" aria-hidden="true">bolt</span>
        </div>
        <h3 class="font-display text-[20px] font-bold text-on-surface mb-2"><?= vv_t('store.home.value1_t') ?></h3>
        <p class="font-body-md text-sm text-on-surface-variant leading-relaxed flex-1">
          <?= vv_t('store.home.value1_p') ?>
        </p>
      </div>

      <div class="bg-surface-container border border-outline-variant rounded-2xl p-7 flex flex-col">
        <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 flex-shrink-0">
          <span class="material-symbols-outlined text-primary icon-filled text-[26px]" aria-hidden="true">lock</span>
        </div>
        <h3 class="font-display text-[20px] font-bold text-on-surface mb-2"><?= vv_t('store.home.value2_t') ?></h3>
        <p class="font-body-md text-sm text-on-surface-variant leading-relaxed flex-1">
          <?= vv_t('store.home.value2_p') ?>
        </p>
      </div>

      <div class="bg-surface-container border border-outline-variant rounded-2xl p-7 flex flex-col">
        <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 flex-shrink-0">
          <span class="material-symbols-outlined text-primary icon-filled text-[26px]" aria-hidden="true">assignment_return</span>
        </div>
        <h3 class="font-display text-[20px] font-bold text-on-surface mb-2"><?= vv_t('store.home.value3_t') ?></h3>
        <p class="font-body-md text-sm text-on-surface-variant leading-relaxed flex-1">
          <?= vv_t('store.home.value3_p') ?>
        </p>
      </div>
    </div>
  </section>

  <!-- ===== O VeVit ===== -->
  <section class="bg-surface-container-low border-y border-outline-variant" aria-labelledby="about-heading">
    <div class="max-w-store mx-auto px-margin py-14 grid md:grid-cols-2 gap-12 items-center">
      <div>
        <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest block mb-3"><?= vv_t('store.home.about_eyebrow') ?></span>
        <h2 id="about-heading" class="font-display text-h1 text-on-surface mb-4 leading-tight"><?= vv_t('store.home.about_title') ?></h2>
        <p class="font-body-md text-on-surface-variant leading-relaxed mb-6">
          <?= vv_t('store.home.about_text') ?>
        </p>
        <a href="about.php" class="btn btn-outline">
          <?= vv_t('store.home.about_more') ?> <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
        </a>
      </div>
      <div class="flex flex-col gap-5">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-primary text-[18px] icon-filled" aria-hidden="true">check_circle</span>
          </div>
          <div>
            <h3 class="font-body-md font-bold text-on-surface mb-0.5"><?= vv_t('store.home.about_v1_t') ?></h3>
            <p class="font-body-md text-sm text-on-surface-variant"><?= vv_t('store.home.about_v1_p') ?></p>
          </div>
        </div>
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-primary text-[18px] icon-filled" aria-hidden="true">support_agent</span>
          </div>
          <div>
            <h3 class="font-body-md font-bold text-on-surface mb-0.5"><?= vv_t('store.home.about_v2_t') ?></h3>
            <p class="font-body-md text-sm text-on-surface-variant"><?= vv_t('store.home.about_v2_p') ?></p>
          </div>
        </div>
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-primary text-[18px] icon-filled" aria-hidden="true">assignment_return</span>
          </div>
          <div>
            <h3 class="font-body-md font-bold text-on-surface mb-0.5"><?= vv_t('store.home.about_v3_t') ?></h3>
            <p class="font-body-md text-sm text-on-surface-variant"><?= vv_t('store.home.about_v3_p') ?></p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== Final CTA ===== -->
  <section class="max-w-store mx-auto px-margin py-14" aria-labelledby="cta-heading">
    <div class="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center"
         style="background:linear-gradient(135deg,#052e16 0%,#064e3b 60%,#0f172a 100%)">
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
           style="background:radial-gradient(ellipse 60% 80% at 50% 50%,rgba(16,185,129,.1) 0%,transparent 70%)"></div>
      <div class="relative">
        <span class="font-mono-label text-mono-label uppercase tracking-widest block mb-3" style="color:#4edea3"><?= vv_t('store.home.cta_eyebrow') ?></span>
        <h2 id="cta-heading" class="font-display text-[32px] md:text-[40px] font-extrabold mb-3 leading-tight" style="color:#f0fdf4">
          <?= vv_t('store.home.cta_title') ?>
        </h2>
        <p class="font-body-md leading-relaxed mb-8 max-w-lg mx-auto" style="color:#a7f3d0">
          <?= vv_t('store.home.cta_text') ?>
        </p>
        <div class="flex flex-wrap gap-3 justify-center">
          <a href="catalog.php" class="btn btn-primary btn-lg">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">explore</span>
            <?= vv_t('store.home.cta_open_catalog') ?>
          </a>
          <a href="contact.php" class="btn btn-lg" style="border:1px solid rgba(78,222,163,.35);color:#4edea3;background:transparent">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">mail</span>
            <?= vv_t('store.home.cta_contact') ?>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Naposledy prohlížené (jen přihlášení) -->
  <section id="recentSection" class="hidden max-w-store mx-auto px-margin pb-14" aria-labelledby="recent-heading">
    <div class="flex items-end justify-between mb-6">
      <h2 id="recent-heading" class="font-display text-h1 text-on-surface flex items-center gap-2">
        <span class="material-symbols-outlined text-primary" aria-hidden="true">history</span> <?= vv_t('store.home.recent_title') ?>
      </h2>
    </div>
    <div id="recentGrid" class="grid grid-cols-2 md:grid-cols-4 gap-4" role="list"></div>
  </section>

</main>

<script defer src="assets/js/index-page.js"></script>

<?php include __DIR__ . '/lib/footer.php'; ?>