<?php
require_once __DIR__ . '/config.php';
$pageTitle = 'Ochrana soukromí — VeVit Store';
$metaDesc  = 'Zásady ochrany osobních údajů VeVit Store v souladu s GDPR.';
$activeNav = '';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[760px] mx-auto px-margin py-12 flex flex-col gap-8">

  <section class="flex flex-col gap-2">
    <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest">Právní dokumenty</span>
    <h1 class="font-display text-h1 text-on-surface">Ochrana soukromí</h1>
    <p class="text-sm text-on-surface-variant">Platné od: 1. 1. 2025 &nbsp;·&nbsp; V souladu s GDPR (nařízení EU 2016/679)</p>
  </section>

  <!-- Summary -->
  <div class="flex items-start gap-3 bg-primary/8 border border-primary/25 rounded-xl px-5 py-4 text-sm">
    <span class="material-symbols-outlined text-primary text-[18px] icon-filled shrink-0 mt-0.5" aria-hidden="true">shield</span>
    <p class="text-on-surface-variant leading-relaxed">
      <strong class="text-on-surface">Jednoduše řečeno:</strong> Shromažďujeme jen údaje nezbytné pro vyřízení objednávky. Neprodáváme je třetím stranám. Platby zpracovává Stripe — vaše platební údaje k nám vůbec nedoputují.
    </p>
  </div>

  <?php
  $sections = [
    ['Správce osobních údajů', 'Správcem je provozovatel VeVit Store. Kontakt pro věci GDPR: info@vevit.cz.'],
    ['Jaké údaje zpracováváme', "Při vytvoření objednávky zpracováváme:\n• Jméno a příjmení\n• E-mailová adresa\n• Doručovací adresa (fyzické produkty)\n• Identifikátor objednávky a stav platby\n\nPlatební údaje (číslo karty, CVV) jsou zpracovávány výhradně Stripe a k nám nejsou předávány."],
    ['Účel zpracování a právní základ', 'Osobní údaje zpracováváme za účelem vyřízení objednávky (plnění smlouvy, čl. 6 odst. 1 písm. b) GDPR), zasílání potvrzení a stavu objednávky a plnění zákonných povinností (uchovávání daňových dokladů po dobu 10 let).'],
    ['Předávání třetím stranám', "Vaše údaje předáváme:\n• Stripe, Inc. — zpracování plateb (příjemce v USA, ochrana dle standardních smluvních doložek EU)\n• Dopravce (PPL, Česká pošta) — pouze pro doručení fyzického zboží\n\nÚdaje neprodáváme ani nepředáváme marketingovým partnerům."],
    ['Doba uchovávání', 'Osobní údaje uchováváme po dobu trvání smluvního vztahu a dále dle zákonných lhůt (daňové doklady 10 let). Po uplynutí zákonné lhůty jsou údaje smazány nebo anonymizovány.'],
    ['Vaše práva (GDPR)', "Máte právo na:\n• Přístup ke svým osobním údajům\n• Opravu nepřesných údajů\n• Výmaz (\"právo být zapomenut\") — pokud neexistuje zákonná povinnost uchovávání\n• Omezení zpracování\n• Přenositelnost údajů\n• Podání stížnosti u Úřadu pro ochranu osobních údajů (uoou.cz)\n\nŽádost uplatněte e-mailem na info@vevit.cz."],
    ['Cookies', 'Používáme pouze technické cookies nezbytné pro fungování košíku (localStorage). Nepoužíváme analytické ani reklamní cookies bez vašeho souhlasu.'],
  ];
  foreach ($sections as $i => [$title, $text]): ?>
  <section class="flex flex-col gap-2">
    <h2 class="font-semibold text-on-surface flex items-center gap-2">
      <span class="font-mono-label text-xs text-primary"><?= $i + 1 ?>.</span>
      <?= h($title) ?>
    </h2>
    <p class="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line"><?= h($text) ?></p>
  </section>
  <?php endforeach; ?>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>
