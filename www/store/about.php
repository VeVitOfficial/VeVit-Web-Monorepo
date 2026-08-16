<?php
require_once __DIR__ . '/config.php';
$pageTitle   = 'O nás — VeVit Store';
$metaDesc    = 'Zjistěte, kdo stojí za VeVit Store — moderním e-shopem s ověřeným sortimentem digitálních i fyzických produktů.';
$activeNav   = '';
$vvBase      = defined('VEVIT_BASE') ? VEVIT_BASE : '';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-12">

  <!-- Hero -->
  <section class="text-center flex flex-col items-center gap-4">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest">O nás</span>
    <h1 class="font-display text-h1 text-on-surface">Tvoříme obchod, kterému <br class="hidden sm:block">lze věřit</h1>
    <p class="text-on-surface-variant max-w-lg mx-auto leading-relaxed">
      VeVit Store je moderní e-shop zaměřený na digitální a fyzické produkty s důrazem na bezpečnost, transparentnost a spokojenost zákazníka.
    </p>
  </section>

  <!-- Values -->
  <section aria-labelledby="values-heading">
    <h2 id="values-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest mb-6">Naše hodnoty</h2>
    <div class="grid sm:grid-cols-2 gap-4">
      <?php
      $values = [
        ['lock',         'Bezpečnost',       'Platby probíhají výhradně přes Stripe. Žádné platební údaje neprocházejí naším serverem.'],
        ['verified',     'Transparentnost',  'Zobrazujeme reálné ceny bez skrytých poplatků. Stav objednávky vždy ověřujeme ze serveru.'],
        ['bolt',         'Rychlost',         'Digitální produkty dostanete ihned po potvrzení platby. Fyzické zboží odesíláme do 2 dní.'],
        ['support_agent','Podpora',          'Jsme dostupní na e-mailu. Každá reklamace je řešena férově a bez zbytečných průtahů.'],
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
    <h2 class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest">Náš příběh</h2>
    <p class="text-on-surface-variant leading-relaxed">
      VeVit Store vznikl s jednoduchou myšlenkou — vytvořit obchod, kde zákazník ví, co kupuje, za kolik a jak bezpečně. Zaměřujeme se na pečlivě vybraný sortiment a na procesech, které chrání jak zákazníka, tak integritu prodeje.
    </p>
    <p class="text-on-surface-variant leading-relaxed">
      Každý technický detail — od zabezpečení plateb po správu digitálních licencí — je navržen tak, aby zákazník mohl nakupovat s klidem.
    </p>
  </section>

  <!-- CTA -->
  <section class="bg-surface-container border border-outline-variant rounded-xl p-8 text-center flex flex-col items-center gap-4">
    <span class="material-symbols-outlined text-primary text-[36px] icon-filled" aria-hidden="true">storefront</span>
    <h2 class="font-bold text-[20px] text-on-surface">Připraveni nakupovat?</h2>
    <p class="text-sm text-on-surface-variant max-w-xs">Procházejte náš katalog a najděte si produkt, který hledáte.</p>
    <a href="<?= $vvBase ?>catalog.php" class="btn btn-primary">
      Prozkoumat katalog
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
    </a>
  </section>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>
