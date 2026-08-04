<?php
require_once __DIR__ . '/config.php';
$pageTitle = 'Košík — VeVit Store';
$activeNav = 'cart';
include __DIR__ . '/lib/header.php';
?>

<main class="flex-1 w-full max-w-store mx-auto px-margin py-10 flex flex-col lg:flex-row gap-8">

  <!-- Cart Items -->
  <section class="flex-grow lg:w-2/3 flex flex-col gap-6">
    <div>
      <span class="font-mono-label text-mono-label text-primary uppercase tracking-widest block mb-1">Krok 1 / 3</span>
      <h1 class="font-display text-h1 text-on-surface">Váš košík</h1>
    </div>

    <!-- Items list -->
    <div id="cartItems" class="flex flex-col gap-4" aria-live="polite" aria-label="Položky v košíku"></div>

    <!-- Empty state -->
    <div id="emptyCart" class="hidden flex flex-col items-center text-center py-16 gap-5">
      <div class="w-20 h-20 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center">
        <span class="material-symbols-outlined text-[40px] text-on-surface-variant" aria-hidden="true">shopping_bag</span>
      </div>
      <div>
        <h2 class="font-h2 text-[20px] font-bold text-on-surface mb-1">Košík je prázdný</h2>
        <p class="text-sm text-on-surface-variant">Vyrazte do katalogu a najděte si něco pěkného.</p>
      </div>
      <a href="catalog.php" class="btn btn-primary">
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">storefront</span>
        Pokračovat v nákupu
      </a>
    </div>

    <!-- Continue shopping (shown when items exist) -->
    <div id="cartContinue" class="hidden">
      <a href="catalog.php" class="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
        Pokračovat v nákupu
      </a>
    </div>
  </section>

  <!-- Summary sidebar -->
  <aside class="w-full lg:w-80 flex flex-col gap-4">
    <div class="bg-surface-container border border-outline-variant rounded-xl p-6 sticky top-32" id="cartSummary">
      <h2 class="font-bold text-[18px] text-on-surface mb-4 pb-3 border-b border-outline-variant">Souhrn</h2>
      <div class="flex flex-col gap-3 text-sm mb-4">
        <div class="flex justify-between text-on-surface-variant">
          <span>Mezisoučet</span>
          <span id="summarySubtotal" class="text-on-surface font-semibold">0 Kč</span>
        </div>
        <div class="flex justify-between text-on-surface-variant">
          <span>Doprava</span>
          <span id="summaryShipping" class="text-on-surface font-semibold">Zdarma</span>
        </div>
        <p id="summaryShippingNote" class="text-xs text-primary hidden"></p>
      </div>
      <div class="flex justify-between items-center border-t border-outline-variant pt-4 mb-5">
        <span class="font-bold text-on-surface">Celkem</span>
        <span id="summaryTotal" class="font-display text-[22px] font-bold text-primary">0 Kč</span>
      </div>
      <button type="button" onclick="goToCheckout()" class="btn btn-primary btn-lg w-full">
        K pokladně
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
      </button>
      <div class="mt-3 flex items-center justify-center gap-1.5 text-xs text-on-surface-variant">
        <span class="material-symbols-outlined text-[14px] icon-filled" aria-hidden="true">lock</span>
        Zabezpečená platba přes Stripe
      </div>
    </div>

    <!-- Trust badges -->
    <div class="bg-surface-container border border-outline-variant rounded-xl p-4 flex items-center justify-around" aria-label="Záruky">
      <div class="text-center flex flex-col items-center gap-1">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">verified_user</span>
        <span class="font-mono-label text-[10px] text-on-surface-variant uppercase">SSL</span>
      </div>
      <div class="text-center flex flex-col items-center gap-1">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">credit_card</span>
        <span class="font-mono-label text-[10px] text-on-surface-variant uppercase">Stripe</span>
      </div>
      <div class="text-center flex flex-col items-center gap-1">
        <span class="material-symbols-outlined text-primary icon-filled" aria-hidden="true">undo</span>
        <span class="font-mono-label text-[10px] text-on-surface-variant uppercase">14 dní</span>
      </div>
    </div>
  </aside>
</main>

<script>
function goToCheckout() {
  if (!Cart.get().length) {
    window.showToast?.('Košík je prázdný', 'error');
    return;
  }
  window.location.href = 'checkout.php';
}

function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  // innerHTML escapes <, >, & — but NOT " or ' which can break out of attribute context
  return d.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const catBgMap = {
  'digitalni-produkty': 'cat-bg-digital',
  merch:               'cat-bg-merch',
  elektronika:         'cat-bg-electronics',
};

function renderCart() {
  const items    = Cart.get();
  const itemsEl  = document.getElementById('cartItems');
  const emptyEl  = document.getElementById('emptyCart');
  const summaryEl = document.getElementById('cartSummary');
  const continueEl = document.getElementById('cartContinue');

  const hasItems = items.length > 0;
  emptyEl.classList.toggle('hidden', hasItems);
  continueEl.classList.toggle('hidden', !hasItems);
  if (summaryEl) summaryEl.style.opacity = hasItems ? '1' : '0.45';

  const typeSlug = (type) => type === 'digital' ? 'digitalni-produkty' : 'merch';

  itemsEl.innerHTML = items.map(item => {
    const bg       = catBgMap[typeSlug(item.type)] || 'cat-bg-default';
    const lineTotal = (Number(item.price) * Number(item.qty)).toLocaleString('cs-CZ');
    const typeLabel = item.type === 'digital' ? 'Digitální' : 'Fyzický';
    const badgeClass = item.type === 'digital' ? 'badge-primary' : 'badge-neutral';
    return `
      <article class="flex flex-col sm:flex-row gap-4 p-5 bg-surface-container border border-outline-variant rounded-xl">
        <a href="product.php?slug=${encodeURIComponent(item.slug)}"
           class="w-full sm:w-28 h-28 ${bg} rounded-lg border border-outline-variant/50 flex items-center justify-center shrink-0 overflow-hidden hover:opacity-90 transition-opacity"
           aria-label="${esc(item.name)}">
          <span class="material-symbols-outlined text-white/25 text-[40px]" aria-hidden="true">image</span>
        </a>
        <div class="flex flex-col flex-grow gap-3">
          <div class="flex justify-between items-start gap-3">
            <div class="min-w-0">
              <span class="badge ${badgeClass} mb-1">${typeLabel}</span>
              <h2 class="font-semibold text-on-surface text-[15px] leading-snug">${esc(item.name)}</h2>
              <p class="text-sm text-on-surface-variant mt-0.5">${Number(item.price).toLocaleString('cs-CZ')} Kč / ks</p>
            </div>
            <button onclick="Cart.remove(${Number(item.id)})"
                    class="btn-icon btn-ghost btn-sm text-on-surface-variant hover:text-error shrink-0"
                    aria-label="Odstranit ${esc(item.name)}">
              <span class="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
            </button>
          </div>
          <div class="flex justify-between items-center mt-auto">
            <div class="qty-group" role="group" aria-label="Množství">
              <button onclick="Cart.updateQuantity(${Number(item.id)}, ${Number(item.qty) - 1})"
                      class="qty-btn" aria-label="Méně">
                <span class="material-symbols-outlined text-[16px]" aria-hidden="true">remove</span>
              </button>
              <span class="qty-val" aria-live="polite">${Number(item.qty)}</span>
              <button onclick="Cart.updateQuantity(${Number(item.id)}, ${Number(item.qty) + 1})"
                      class="qty-btn" aria-label="Více">
                <span class="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
              </button>
            </div>
            <div class="font-bold text-[17px] text-on-surface">${lineTotal} Kč</div>
          </div>
        </div>
      </article>`;
  }).join('');

  const subtotal = Cart.total();
  const shipping = Cart.shipping();
  const total    = subtotal + shipping;
  document.getElementById('summarySubtotal').textContent = subtotal.toLocaleString('cs-CZ') + ' Kč';
  document.getElementById('summaryShipping').textContent = shipping === 0 ? 'Zdarma' : shipping.toLocaleString('cs-CZ') + ' Kč';
  document.getElementById('summaryTotal').textContent    = total.toLocaleString('cs-CZ') + ' Kč';

  const noteEl = document.getElementById('summaryShippingNote');
  if (Cart.hasPhysical() && subtotal > 0 && subtotal < 1000) {
    noteEl.textContent = 'Přidej za ' + (1000 - subtotal).toLocaleString('cs-CZ') + ' Kč pro dopravu zdarma';
    noteEl.classList.remove('hidden');
  } else {
    noteEl.classList.add('hidden');
  }
}

window.addEventListener('cartchange', renderCart);
document.addEventListener('DOMContentLoaded', renderCart);
</script>

<?php include __DIR__ . '/lib/footer.php'; ?>
