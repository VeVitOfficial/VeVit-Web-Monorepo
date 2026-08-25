<?php
require_once __DIR__ . '/config.php';
http_response_code(404);
$pageTitle = 'Stránka nenalezena — VeVit Store';
$activeNav = '';
$noindex   = true;
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[560px] mx-auto px-margin py-16 flex flex-col items-center text-center gap-6">
  <div class="w-20 h-20 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center">
    <span class="material-symbols-outlined text-[44px] text-on-surface-variant" aria-hidden="true">search_off</span>
  </div>

  <div>
    <span class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest block mb-2">Chyba 404</span>
    <h1 class="font-display text-h1 text-on-surface mb-3">Stránka nenalezena</h1>
    <p class="text-on-surface-variant max-w-sm mx-auto leading-relaxed">
      Stránka, kterou hledáte, neexistuje nebo byla přesunuta. Zkontrolujte URL nebo se vraťte domů.
    </p>
  </div>

  <div class="flex flex-col sm:flex-row gap-3">
    <a href="index.html" class="btn btn-outline">
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">home</span>
      Domů
    </a>
    <a href="catalog.php" class="btn btn-primary">
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">storefront</span>
      Prozkoumat katalog
    </a>
  </div>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>
