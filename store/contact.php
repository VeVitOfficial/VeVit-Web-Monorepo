<?php
require_once __DIR__ . '/config.php';
$pageTitle = 'Kontakt — VeVit Store';
$metaDesc  = 'Kontaktujte VeVit Store. Rádi vám pomůžeme s objednávkou, reklamací nebo jakýmkoli dotazem.';
$activeNav = '';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-10">

  <section class="text-center flex flex-col items-center gap-3">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest">Kontakt</span>
    <h1 class="font-display text-h1 text-on-surface">Jak se na nás obrátit</h1>
    <p class="text-on-surface-variant max-w-md mx-auto leading-relaxed">
      Máte dotaz k objednávce, produktu nebo potřebujete pomoc? Napište nám.
    </p>
  </section>

  <div class="grid sm:grid-cols-2 gap-4">
    <!-- Email -->
    <div class="card flex flex-col gap-3">
      <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">mail</span>
      </div>
      <h2 class="font-semibold text-on-surface">E-mail</h2>
      <p class="text-sm text-on-surface-variant">Preferovaný způsob kontaktu. Odpovídáme obvykle do 24 hodin v pracovní dny.</p>
      <a href="mailto:info@vevit.cz" class="btn btn-primary btn-sm mt-auto">
        info@vevit.cz
      </a>
    </div>

    <!-- Response time -->
    <div class="card flex flex-col gap-3">
      <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">schedule</span>
      </div>
      <h2 class="font-semibold text-on-surface">Doba odezvy</h2>
      <ul class="text-sm text-on-surface-variant flex flex-col gap-2 mt-1">
        <li class="flex items-center gap-2">
          <span class="material-symbols-outlined text-success text-[14px] icon-filled" aria-hidden="true">check_circle</span>
          Digitální produkty — okamžitě po platbě
        </li>
        <li class="flex items-center gap-2">
          <span class="material-symbols-outlined text-success text-[14px] icon-filled" aria-hidden="true">check_circle</span>
          Fyzické objednávky — do 2 pracovních dní
        </li>
        <li class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[14px] icon-filled" aria-hidden="true">mail</span>
          E-maily — do 24 hodin v pracovní dny
        </li>
      </ul>
    </div>
  </div>

  <!-- FAQ -->
  <section aria-labelledby="faq-heading" class="flex flex-col gap-4">
    <h2 id="faq-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest">Časté dotazy</h2>
    <div class="flex flex-col gap-2">
      <?php
      $faqs = [
        ['Kde je moje objednávka?',                 'Po zaplacení obdržíte potvrzení e-mailem. Digitální produkty jsou dostupné okamžitě přes odkaz v e-mailu. Fyzické zboží odesíláme do 2 pracovních dní.'],
        ['Jak vrátit zboží?',                       'Máte právo odstoupit od smlouvy do 14 dní od doručení. Digitální obsah nelze vrátit po jeho stažení. Podrobnosti najdete ve stránce Vrácení a reklamace.'],
        ['Platba neproběhla — mám platit znovu?',   'Ne. Pokud uvidíte stav "Čekáme na potvrzení" nebo "Objednávka čeká na ověření", počkejte na potvrzovací e-mail. V případě pochybností kontaktujte nás.'],
        ['Jak získám fakturu?',                     'Fakturu zasíláme e-mailem po dokončení objednávky. Potřebujete-li ji znovu nebo s firemními údaji, napište nám.'],
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
