// Toast helper
window.showToast = function(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2700);
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.Cart) Cart.updateBadge();

  if (!document.querySelector('.toast-container')) {
    const tc = document.createElement('div');
    tc.className = 'toast-container';
    document.body.appendChild(tc);
  }

  // Mobile menu toggle (if present)
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => mobileNav.classList.toggle('hidden'));
  }
});

document.addEventListener('change', event => {
  if (event.target.matches('[data-submit-on-change]')) event.target.form?.requestSubmit();
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-cart-product]');
  if (!button || !window.Cart) return;
  try {
    const product = JSON.parse(button.dataset.cartProduct);
    window.Cart.add(product);
  } catch {
    window.showToast?.('Produkt nelze přidat do košíku.', 'error');
  }
});

window.addEventListener('cartchange', () => {
  if (window.Cart) Cart.updateBadge();
});
