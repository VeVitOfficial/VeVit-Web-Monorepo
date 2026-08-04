(function initProductPage() {
  'use strict';
  const page = document.getElementById('productPage');
  if (!page) return;
  let product;
  try {
    product = JSON.parse(page.dataset.product);
  } catch {
    return;
  }
  let quantity = 1;
  document.querySelectorAll('[data-quantity-delta]').forEach(button => button.addEventListener('click', () => {
    quantity = Math.max(1, quantity + Number(button.dataset.quantityDelta));
    const value = document.getElementById('qtyVal');
    if (value) value.textContent = String(quantity);
  }));
  document.querySelectorAll('[data-product-action]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.productAction === 'buy') {
      window.Cart.add(product, 1);
      window.location.href = 'cart.php';
    } else {
      window.Cart.add(product, quantity);
    }
  }));
  document.getElementById('favoriteButton')?.addEventListener('click', async function () {
    const status = document.getElementById('favoriteStatus');
    try {
      const response = await fetch('api/favorites/add.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': page.dataset.favoritesCsrf || '' },
        body: JSON.stringify({ product_id: product.id }),
      });
      if (!response.ok) throw new Error('unavailable');
      this.setAttribute('aria-pressed', 'true');
      this.lastChild.textContent = ' V oblíbených';
      status.textContent = 'Produkt byl přidán do oblíbených.';
    } catch {
      status.textContent = 'Oblíbené produkty vyžadují ověřené přihlášení VeVit Account.';
    }
  });
}());
