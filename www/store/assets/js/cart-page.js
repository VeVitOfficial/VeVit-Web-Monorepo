(function initCartPage() {
  'use strict';
  const categoryBackground = {
    'digitalni-produkty': 'cat-bg-digital',
    merch: 'cat-bg-merch',
    elektronika: 'cat-bg-electronics',
  };

  function renderItem(item) {
    const id = Number(item.id);
    const quantity = Math.max(1, Number(item.qty) || 1);
    const price = Number(item.price) || 0;
    const typeSlug = item.type === 'digital' ? 'digitalni-produkty' : 'merch';
    const article = document.createElement('article');
    article.className = 'flex flex-col sm:flex-row gap-4 p-5 bg-surface-container border border-outline-variant rounded-xl';
    article.innerHTML = `
      <a class="cart-product-link w-full sm:w-28 h-28 rounded-lg border border-outline-variant/50 flex items-center justify-center shrink-0 overflow-hidden hover:opacity-90 transition-opacity"><span class="material-symbols-outlined text-white/25 text-[40px]" aria-hidden="true">image</span></a>
      <div class="flex flex-col flex-grow gap-3"><div class="flex justify-between items-start gap-3"><div class="min-w-0"><span class="cart-type badge mb-1"></span><h2 class="cart-name font-semibold text-on-surface text-[15px] leading-snug"></h2><p class="cart-unit-price text-sm text-on-surface-variant mt-0.5"></p></div><button type="button" data-cart-action="remove" class="btn-icon btn-ghost btn-sm text-on-surface-variant hover:text-error shrink-0"><span class="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span></button></div>
      <div class="flex justify-between items-center mt-auto"><div class="qty-group" role="group" aria-label="Množství"><button type="button" data-cart-action="decrease" class="qty-btn" aria-label="Méně"><span class="material-symbols-outlined text-[16px]" aria-hidden="true">remove</span></button><span class="cart-quantity qty-val" aria-live="polite"></span><button type="button" data-cart-action="increase" class="qty-btn" aria-label="Více"><span class="material-symbols-outlined text-[16px]" aria-hidden="true">add</span></button></div><div class="cart-line-total font-bold text-[17px] text-on-surface"></div></div></div>`;
    article.dataset.itemId = String(id);
    article.dataset.itemQuantity = String(quantity);
    const link = article.querySelector('.cart-product-link');
    link.href = `product.php?slug=${encodeURIComponent(String(item.slug || ''))}`;
    link.classList.add(categoryBackground[typeSlug] || 'cat-bg-default');
    link.setAttribute('aria-label', String(item.name || ''));
    const type = article.querySelector('.cart-type');
    type.textContent = item.type === 'digital' ? 'Digitální' : 'Fyzický';
    type.classList.add(item.type === 'digital' ? 'badge-primary' : 'badge-neutral');
    article.querySelector('.cart-name').textContent = String(item.name || '');
    article.querySelector('.cart-unit-price').textContent = `${price.toLocaleString('cs-CZ')} Kč / ks`;
    article.querySelector('[data-cart-action="remove"]').setAttribute('aria-label', `Odstranit ${String(item.name || '')}`);
    article.querySelector('.cart-quantity').textContent = String(quantity);
    article.querySelector('.cart-line-total').textContent = `${(price * quantity).toLocaleString('cs-CZ')} Kč`;
    return article;
  }

  function renderCart() {
    const items = window.Cart.get();
    const hasItems = items.length > 0;
    document.getElementById('emptyCart').classList.toggle('hidden', hasItems);
    document.getElementById('cartContinue').classList.toggle('hidden', !hasItems);
    const summary = document.getElementById('cartSummary');
    if (summary) summary.style.opacity = hasItems ? '1' : '0.45';
    document.getElementById('cartItems').replaceChildren(...items.map(renderItem));
    const subtotal = window.Cart.total();
    const shipping = window.Cart.shipping();
    document.getElementById('summarySubtotal').textContent = `${subtotal.toLocaleString('cs-CZ')} Kč`;
    document.getElementById('summaryShipping').textContent = shipping === 0 ? 'Zdarma' : `${shipping.toLocaleString('cs-CZ')} Kč`;
    document.getElementById('summaryTotal').textContent = `${(subtotal + shipping).toLocaleString('cs-CZ')} Kč`;
    const note = document.getElementById('summaryShippingNote');
    if (window.Cart.hasPhysical() && subtotal > 0 && subtotal < 1000) {
      note.textContent = `Přidej za ${(1000 - subtotal).toLocaleString('cs-CZ')} Kč pro dopravu zdarma`;
      note.classList.remove('hidden');
    } else {
      note.classList.add('hidden');
    }
  }

  document.getElementById('checkoutButton')?.addEventListener('click', () => {
    if (!window.Cart.get().length) return window.showToast?.('Košík je prázdný', 'error');
    window.location.href = 'checkout.php';
  });
  document.getElementById('cartItems')?.addEventListener('click', event => {
    const button = event.target.closest('[data-cart-action]');
    const article = button?.closest('[data-item-id]');
    if (!button || !article) return;
    const id = Number(article.dataset.itemId);
    const quantity = Number(article.dataset.itemQuantity);
    if (button.dataset.cartAction === 'remove') window.Cart.remove(id);
    if (button.dataset.cartAction === 'decrease') window.Cart.updateQuantity(id, quantity - 1);
    if (button.dataset.cartAction === 'increase') window.Cart.updateQuantity(id, quantity + 1);
  });
  window.addEventListener('cartchange', renderCart);
  renderCart();
}());
