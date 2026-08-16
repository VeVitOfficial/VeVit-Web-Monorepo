<?php
require_once __DIR__ . '/config.php';
$pageTitle = 'Platba zrušena — VeVit Store';
$activeNav = 'cart';
$noindex   = true;
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-[560px] mx-auto px-margin py-16 flex flex-col items-center text-center gap-6">
  <div class="order-status-icon error">
    <span class="material-symbols-outlined icon-filled text-[40px] text-error" aria-hidden="true">cancel</span>
  </div>

  <div>
    <span class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest block mb-2">Checkout</span>
    <h1 class="font-display text-h1 text-on-surface mb-3">Platba byla zrušena</h1>
    <p class="font-body-md text-on-surface-variant max-w-sm mx-auto">
      Tvá objednávka nebyla dokončena. Obsah košíku zůstal uložen — můžeš to zkusit znovu nebo si nechat čas na rozmyšlenou.
    </p>
  </div>

  <div class="flex flex-col sm:flex-row gap-3 mt-2">
    <a href="cart.php" class="btn btn-outline">
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">shopping_bag</span>
      Zpět do košíku
    </a>
    <a href="checkout.php" class="btn btn-primary">
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">replay</span>
      Zkusit znovu
    </a>
  </div>

  <a href="catalog.php" class="text-sm text-on-surface-variant hover:text-primary transition-colors">
    Nebo pokračovat v nákupu
  </a>
</main>

<?php include __DIR__ . '/lib/footer.php'; ?>
