<?php
require_once __DIR__ . '/config.php';
$pageTitle = 'Vrácení a reklamace — VeVit Store';
$metaDesc  = 'Podmínky vrácení zboží a reklamační řád VeVit Store. 14denní lhůta pro fyzické produkty.';
$activeNav = '';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-10">

  <section class="text-center flex flex-col items-center gap-3">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest">Zákaznická podpora</span>
    <h1 class="font-display text-h1 text-on-surface">Vrácení a reklamace</h1>
    <p class="text-on-surface-variant max-w-md mx-auto leading-relaxed">Vaše práva jako spotřebitele jsou pro nás důležitá. Zde najdete přehledný souhrn.</p>
  </section>

  <!-- Physical return -->
  <section aria-labelledby="physical-heading" class="flex flex-col gap-4">
    <h2 id="physical-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest">Fyzické produkty</h2>
    <div class="card flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-success icon-filled" aria-hidden="true">undo</span>
        </div>
        <div>
          <h3 class="font-semibold text-on-surface">14denní právo na odstoupení</h3>
          <p class="text-sm text-on-surface-variant">Bez udání důvodu, od doručení zásilky</p>
        </div>
      </div>
      <ul class="text-sm text-on-surface-variant flex flex-col gap-2 pl-1">
        <li class="flex items-start gap-2">
          <span class="material-symbols-outlined text-primary text-[14px] icon-filled mt-0.5 shrink-0" aria-hidden="true">check</span>
          Zboží musí být vráceno v původním stavu a obalu.
        </li>
        <li class="flex items-start gap-2">
          <span class="material-symbols-outlined text-primary text-[14px] icon-filled mt-0.5 shrink-0" aria-hidden="true">check</span>
          Náklady na zpáteční dopravu hradí zákazník, pokud není dohodou jinak.
        </li>
        <li class="flex items-start gap-2">
          <span class="material-symbols-outlined text-primary text-[14px] icon-filled mt-0.5 shrink-0" aria-hidden="true">check</span>
          Peníze vracíme do 14 dnů od obdržení vráceného zboží.
        </li>
      </ul>
    </div>
  </section>

  <!-- Digital return -->
  <section aria-labelledby="digital-heading" class="flex flex-col gap-4">
    <h2 id="digital-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest">Digitální produkty</h2>
    <div class="card flex flex-col gap-3">
      <div class="flex items-start gap-3 bg-warning/8 border border-warning/25 rounded-lg p-3">
        <span class="material-symbols-outlined text-warning text-[18px] icon-filled shrink-0 mt-0.5" aria-hidden="true">info</span>
        <p class="text-sm text-on-surface-variant leading-relaxed">
          V souladu s § 1837 písm. l) OZ <strong class="text-on-surface">nelze digitální obsah vrátit</strong> po zahájení jeho stahování nebo zpřístupnění, pokud jste s tím před nákupem souhlasili.
        </p>
      </div>
      <p class="text-sm text-on-surface-variant">Máte-li technický problém s fungováním digitálního produktu, kontaktujte nás — reklamaci prošetříme a nabídneme řešení.</p>
    </div>
  </section>

  <!-- Claims -->
  <section aria-labelledby="claims-heading" class="flex flex-col gap-4">
    <h2 id="claims-heading" class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest">Reklamace</h2>
    <div class="card flex flex-col gap-3">
      <p class="text-sm text-on-surface-variant leading-relaxed">Na veškeré zboží se vztahuje zákonná záruční lhůta <strong class="text-on-surface">24 měsíců</strong>. Pro uplatnění reklamace:</p>
      <ol class="text-sm text-on-surface-variant flex flex-col gap-2 pl-1 list-none">
        <?php
        $steps = [
          'Napište nám na <a href="mailto:info@vevit.cz" class="text-primary hover:underline">info@vevit.cz</a> s číslem objednávky a popisem závady.',
          'Reklamaci potvrdíme a sdělíme vám další postup do 3 pracovních dnů.',
          'Zboží odešlete na námi sdelenou adresu (ne na dobírku).',
          'Reklamaci vyřídíme do 30 dnů od jejího uplatnění.',
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
    <p class="text-sm text-on-surface-variant">Máte otázky k vrácení nebo reklamaci?</p>
    <a href="contact.php" class="btn btn-outline">
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">mail</span>
      Kontaktovat podporu
    </a>
  </div>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>
