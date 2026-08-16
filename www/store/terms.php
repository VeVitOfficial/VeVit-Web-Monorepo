<?php
require_once __DIR__ . '/config.php';
$pageTitle = 'Obchodní podmínky — VeVit Store';
$metaDesc  = 'Obchodní podmínky VeVit Store platné pro nákup fyzických i digitálních produktů.';
$activeNav = '';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-8">

  <section class="flex flex-col gap-2">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest">Právní dokumenty</span>
    <h1 class="font-display text-h1 text-on-surface">Obchodní podmínky</h1>
    <p class="text-sm text-on-surface-variant">Platné od: 1. 1. 2025 &nbsp;·&nbsp; Verze: 1.0</p>
  </section>

  <?php
  $sections = [
    ['Prodávající', 'Provozovatelem internetového obchodu VeVit Store (vevit.cz) je fyzická/právnická osoba provozující obchod pod označením VeVit. Kontakt: info@vevit.cz.'],
    ['Kupující', 'Kupujícím je každá fyzická nebo právnická osoba, která uzavřela s prodávajícím kupní smlouvu prostřednictvím internetového obchodu.'],
    ['Objednávka a uzavření smlouvy', 'Objednávka je návrhem kupní smlouvy. Kupní smlouva je uzavřena přijetím objednávky ze strany prodávajícího, o čemž je kupující informován potvrzovacím e-mailem. Prodávající si vyhrazuje právo objednávku odmítnout nebo stornovat v případě technické chyby, nedostupnosti zboží nebo podezření na podvod.'],
    ['Ceny a platba', 'Ceny jsou uvedeny v Kč včetně DPH. Platba probíhá výhradně elektronicky prostřednictvím platební brány Stripe. Cena je závazná v okamžiku odeslání objednávky.'],
    ['Dodání zboží', 'Digitální produkty jsou zpřístupněny ihned po potvrzení platby. Fyzické zboží je odesíláno do 2 pracovních dnů od potvrzení platby. Dopravce a způsob doručení jsou upřesněny v potvrzovacím e-mailu.'],
    ['Odstoupení od smlouvy', 'Spotřebitel má právo odstoupit od smlouvy bez udání důvodu ve lhůtě 14 dní od převzetí zboží (u fyzických produktů). U digitálního obsahu stažitelného na vyžádání, na jehož dodání dal spotřebitel souhlas před uplynutím lhůty pro odstoupení, právo na odstoupení zaniká jeho zpřístupněním (§ 1837 písm. l) OZ).'],
    ['Záruční podmínky a reklamace', 'Na veškeré zboží se vztahuje zákonná záruční lhůta 24 měsíců. Reklamaci uplatňujte e-mailem na info@vevit.cz. Reklamaci vyřídíme do 30 dnů.'],
    ['Ochrana osobních údajů', 'Zpracování osobních údajů se řídí Zásadami ochrany soukromí dostupnými na stránce Ochrana soukromí.'],
    ['Rozhodné právo a spory', 'Vztahy neupravené těmito podmínkami se řídí zákonem č. 89/2012 Sb. (občanský zákoník) a zákonem č. 634/1992 Sb. (zákon o ochraně spotřebitele). Mimosoudní řešení sporů: Česká obchodní inspekce (coi.cz).'],
    ['Závěrečná ustanovení', 'Tyto podmínky nabývají účinnosti dnem zveřejnění. Prodávající si vyhrazuje právo podmínky změnit. Aktuální verze je vždy dostupná na tomto URL.'],
  ];
  foreach ($sections as $i => [$title, $text]): ?>
  <section class="flex flex-col gap-2">
    <h2 class="font-semibold text-on-surface flex items-center gap-2">
      <span class="font-mono-label text-xs text-primary"><?= $i + 1 ?>.</span>
      <?= h($title) ?>
    </h2>
    <p class="text-sm text-on-surface-variant leading-relaxed"><?= h($text) ?></p>
  </section>
  <?php endforeach; ?>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>
