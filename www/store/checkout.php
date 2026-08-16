<?php
require_once __DIR__ . '/config.php';
$checkoutCsrfToken = store_csrf_token('checkout');
$pageTitle = 'Pokladna — VeVit Store';
$activeNav = 'cart';
include __DIR__ . '/lib/header.php';
?>

<main id="checkoutPage" data-checkout-csrf="<?= h($checkoutCsrfToken) ?>" class="flex-1 w-full max-w-[1200px] mx-auto px-margin py-xl flex flex-col gap-md">

  <!-- Heading + Steps -->
  <div class="flex flex-col gap-md mb-md">
    <div class="flex flex-col gap-xs">
      <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest">Krok 2 / 3</span>
      <h1 class="font-display text-display text-on-surface">Pokladna</h1>
    </div>

    <!-- Progress -->
    <ol class="flex items-center gap-sm flex-wrap">
      <li class="flex items-center gap-xs">
        <a href="cart.php" class="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center font-mono-label text-mono-label text-on-surface-variant hover:border-primary hover:text-primary transition-colors">
          <span class="material-symbols-outlined text-[18px]">check</span>
        </a>
        <span class="font-mono-label text-caption text-on-surface-variant uppercase">Košík</span>
      </li>
      <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
      <li class="flex items-center gap-xs">
        <span class="w-8 h-8 rounded-full bg-primary-container border-2 border-on-primary-fixed flex items-center justify-center font-mono-label text-mono-label text-on-primary-fixed">2</span>
        <span class="font-mono-label text-caption text-primary uppercase">Údaje</span>
      </li>
      <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
      <li class="flex items-center gap-xs">
        <span class="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center font-mono-label text-mono-label text-on-surface-variant">3</span>
        <span class="font-mono-label text-caption text-on-surface-variant uppercase">Platba</span>
      </li>
    </ol>
  </div>

  <div class="flex flex-col lg:flex-row gap-gutter">

    <!-- Form -->
    <section class="flex-grow lg:w-2/3 flex flex-col gap-md">

      <div class="bg-surface-container border border-outline-variant rounded-xl p-md">
        <div class="flex items-center gap-sm mb-md">
          <span class="w-7 h-7 rounded-full bg-primary-container text-on-primary-fixed font-mono-label text-mono-label flex items-center justify-center">1</span>
          <h2 class="font-h2 text-h2 text-on-surface">Kontaktní údaje</h2>
        </div>
        <div class="flex flex-col gap-md">
          <div>
            <label for="checkoutName" class="block font-mono-label text-caption text-on-surface-variant mb-xs uppercase">Jméno a příjmení</label>
            <input type="text" id="checkoutName" value="<?= h($currentUser['full_name'] ?? '') ?>" placeholder="Jan Novák" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-md py-sm rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
          </div>
          <div>
            <label for="checkoutEmail" class="block font-mono-label text-caption text-on-surface-variant mb-xs uppercase">E-mail</label>
            <input type="email" id="checkoutEmail" value="<?= h($currentUser['email'] ?? '') ?>" placeholder="jan@example.cz" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-md py-sm rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
          </div>
          <div>
            <label for="checkoutPhone" class="block font-mono-label text-caption text-on-surface-variant mb-xs uppercase">Telefon (volitelné)</label>
            <input type="tel" id="checkoutPhone" placeholder="+420 ..." class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-md py-sm rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
          </div>
        </div>
      </div>

      <div class="bg-surface-container border border-outline-variant rounded-xl p-md hidden" id="shippingSection">
        <div class="flex items-center gap-sm mb-md">
          <span class="w-7 h-7 rounded-full bg-primary-container text-on-primary-fixed font-mono-label text-mono-label flex items-center justify-center">2</span>
          <h2 class="font-h2 text-h2 text-on-surface">Doručovací adresa</h2>
        </div>
        <div class="flex flex-col gap-md">
          <div>
            <label for="checkoutStreet" class="block font-mono-label text-caption text-on-surface-variant mb-xs uppercase">Ulice a číslo</label>
            <input type="text" id="checkoutStreet" placeholder="Hlavní 123" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-md py-sm rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label for="checkoutCity" class="block font-mono-label text-caption text-on-surface-variant mb-xs uppercase">Město</label>
              <input type="text" id="checkoutCity" placeholder="Praha" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-md py-sm rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
            </div>
            <div>
              <label for="checkoutZip" class="block font-mono-label text-caption text-on-surface-variant mb-xs uppercase">PSČ</label>
              <input type="text" id="checkoutZip" placeholder="110 00" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-md py-sm rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
            </div>
          </div>
          <div>
            <label for="checkoutCountry" class="block font-mono-label text-caption text-on-surface-variant mb-xs uppercase">Země</label>
            <select id="checkoutCountry" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-md py-sm rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
              <option value="CZ">Česká republika</option>
              <option value="SK">Slovensko</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-surface-container border border-outline-variant rounded-xl p-md">
        <div class="flex items-center gap-sm mb-md">
          <span class="w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant text-on-surface-variant font-mono-label text-mono-label flex items-center justify-center" id="notesStep">3</span>
          <h2 class="font-h2 text-h2 text-on-surface">Poznámka k objednávce</h2>
        </div>
        <textarea id="checkoutNotes" rows="3" placeholder="Nepovinné — napište nám, na co si dát pozor..." class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-md py-sm rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50 resize-none"></textarea>
      </div>
    </section>

    <!-- Summary -->
    <aside class="w-full lg:w-1/3 flex flex-col gap-md">
      <div class="bg-surface-container border border-outline-variant rounded-xl p-md sticky top-32">
        <h2 class="font-h2 text-h2 text-on-surface mb-md pb-sm border-b border-outline-variant">Souhrn objednávky</h2>
        <div id="checkoutItems" class="flex flex-col gap-sm mb-md max-h-[260px] overflow-y-auto"></div>
        <div class="flex flex-col gap-sm font-body-md text-body-md mb-md pt-sm border-t border-outline-variant">
          <div class="flex justify-between text-on-surface-variant"><span>Mezisoučet</span><span id="checkoutSubtotal" class="text-on-surface">0 Kč</span></div>
          <div class="flex justify-between text-on-surface-variant"><span>Doprava</span><span id="checkoutShipping" class="text-on-surface">Zdarma</span></div>
        </div>
        <div class="flex justify-between items-center border-t border-outline-variant pt-md mb-md">
          <span class="font-h2 text-h2 text-on-surface">Celkem</span>
          <span id="checkoutTotal" class="font-display text-h1 text-primary">0 Kč</span>
        </div>
        <button id="payBtn" class="w-full bg-primary-container text-on-primary-fixed font-mono-label text-mono-label py-4 border-2 border-on-primary-fixed rounded uppercase tracking-wider flex items-center justify-center gap-sm hard-shadow-primary hard-shadow-primary-active transition-all">
          <span class="material-symbols-outlined">credit_card</span> Zaplatit přes Stripe
        </button>
        <div class="mt-md flex items-center justify-center gap-xs text-on-surface-variant font-caption text-caption">
          <span class="material-symbols-outlined" style="font-size: 16px;">lock</span> SSL šifrovaná platba přes Stripe
        </div>
      </div>
    </aside>
  </div>
</main>

<script defer src="assets/js/checkout-page.js"></script>

<?php include __DIR__ . '/lib/footer.php'; ?>
