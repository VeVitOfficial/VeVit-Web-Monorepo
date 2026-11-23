(function initCheckoutPage() {
  'use strict';
  const page = document.getElementById('checkoutPage');
  const items = window.Cart.get();
  if (!page || !items.length) {
    window.location.href = 'cart.php';
    return;
  }
  const categoryBackground = { merch: 'cat-bg-merch', 'digitalni-produkty': 'cat-bg-digital', elektronika: 'cat-bg-electronics' };
  function renderItem(item) {
    const row = document.createElement('div');
    row.className = 'flex gap-sm items-center pb-sm border-b border-outline-variant/50 last:border-0 last:pb-0';
    row.innerHTML = '<div class="checkout-image w-14 h-14 rounded shrink-0 flex items-center justify-center"><span class="material-symbols-outlined text-white/30 text-[20px]">image</span></div><div class="flex-1 min-w-0"><div class="checkout-name font-body-md text-body-md text-on-surface truncate"></div><div class="checkout-unit font-mono-label text-caption text-on-surface-variant"></div></div><div class="checkout-total font-mono-label text-mono-label text-on-surface"></div>';
    row.querySelector('.checkout-image').classList.add(categoryBackground[item.type === 'digital' ? 'digitalni-produkty' : 'merch'] || 'cat-bg-default');
    row.querySelector('.checkout-name').textContent = String(item.name || '');
    row.querySelector('.checkout-unit').textContent = `${Number(item.qty)}× ${Number(item.price).toLocaleString('cs-CZ')} Kč`;
    row.querySelector('.checkout-total').textContent = `${(Number(item.price) * Number(item.qty)).toLocaleString('cs-CZ')} Kč`;
    return row;
  }
  document.getElementById('checkoutItems').replaceChildren(...items.map(renderItem));
  const subtotal = window.Cart.total();
  const shipping = window.Cart.shipping();
  const hasPhysical = window.Cart.hasPhysical();
  document.getElementById('shippingSection').classList.toggle('hidden', !hasPhysical);
  document.getElementById('notesStep').textContent = hasPhysical ? '3' : '2';
  document.getElementById('checkoutSubtotal').textContent = `${subtotal.toLocaleString('cs-CZ')} Kč`;
  document.getElementById('checkoutShipping').textContent = shipping === 0 ? 'Zdarma' : `${shipping.toLocaleString('cs-CZ')} Kč`;
  document.getElementById('checkoutTotal').textContent = `${(subtotal + shipping).toLocaleString('cs-CZ')} Kč`;

  let paying = false;
  function idempotencyKey() {
    const storageKey = 'vevit_checkout_idempotency';
    const current = sessionStorage.getItem(storageKey);
    if (current) return current;
    const bytes = window.crypto.getRandomValues(new Uint8Array(24));
    const generated = window.crypto.randomUUID ? window.crypto.randomUUID().replaceAll('-', '') : Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(storageKey, generated);
    return generated;
  }
  function resetPaymentButton(button) {
    paying = false;
    button.disabled = false;
    button.replaceChildren();
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined';
    icon.textContent = 'credit_card';
    button.append(icon, document.createTextNode(' Zaplatit přes Stripe'));
  }
  document.getElementById('payBtn').addEventListener('click', async event => {
    if (paying) return;
    const button = event.currentTarget;
    const name = document.getElementById('checkoutName').value.trim();
    const email = document.getElementById('checkoutEmail').value.trim();
    if (!name || !email) return window.showToast?.('Vyplňte prosím jméno a e-mail.', 'error');
    if (!/^\S+@\S+\.\S+$/.test(email)) return window.showToast?.('Zadejte platný e-mail.', 'error');
    const shippingData = hasPhysical ? {
      street: document.getElementById('checkoutStreet').value.trim(),
      city: document.getElementById('checkoutCity').value.trim(),
      zip: document.getElementById('checkoutZip').value.trim(),
      country: document.getElementById('checkoutCountry').value,
    } : null;
    if (shippingData && (!shippingData.street || !shippingData.city || !shippingData.zip)) return window.showToast?.('Vyplňte prosím doručovací adresu.', 'error');
    paying = true;
    button.disabled = true;
    button.textContent = 'Zpracovávám…';
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': page.dataset.checkoutCsrf || '' };
    try {
      const response = await fetch('api/create-checkout.php', {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': idempotencyKey() },
        body: JSON.stringify({ items: items.map(item => ({ product_id: item.id, quantity: item.qty })), idempotency_key: idempotencyKey(), email, name, shipping: shippingData, notes: document.getElementById('checkoutNotes').value }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkout?.id) throw new Error(data.error?.message || 'Chyba při přípravě objednávky.');
      const payment = await fetch('api/create-payment.php', { method: 'POST', headers, body: JSON.stringify({ snapshot: data.checkout.id }) });
      const paymentData = await payment.json();
      if (!payment.ok || !paymentData.url) throw new Error(paymentData.error?.message || 'Platbu se nepodařilo připravit.');
      sessionStorage.removeItem('vevit_checkout_idempotency');
      window.location.href = paymentData.url;
    } catch (error) {
      window.showToast?.(error.message || 'Chyba při komunikaci se serverem.', 'error');
      resetPaymentButton(button);
    }
  });
}());
