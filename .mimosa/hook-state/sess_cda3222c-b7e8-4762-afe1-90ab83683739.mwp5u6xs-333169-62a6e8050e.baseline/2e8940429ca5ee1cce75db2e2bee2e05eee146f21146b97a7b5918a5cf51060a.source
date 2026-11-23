const Cart = {
  KEY: 'vevit_cart',

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
    window.dispatchEvent(new Event('cartchange'));
  },

  add(product, qty = 1) {
    const items = this.get();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.sale_price ? Number(product.sale_price) : Number(product.price),
        original_price: Number(product.price),
        type: product.type,
        slug: product.slug,
        qty
      });
    }
    this.save(items);
    if (window.showToast) window.showToast('Produkt byl přidán do košíku', 'success');
  },

  remove(id) {
    const items = this.get().filter(i => i.id !== id);
    this.save(items);
  },

  updateQuantity(id, qty) {
    const items = this.get();
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (qty < 1) { this.remove(id); return; }
    item.qty = qty;
    this.save(items);
  },

  clear() {
    localStorage.removeItem(this.KEY);
    this.updateBadge();
    window.dispatchEvent(new Event('cartchange'));
  },

  total() {
    return this.get().reduce((sum, i) => sum + Number(i.price) * Number(i.qty), 0);
  },

  count() {
    return this.get().reduce((sum, i) => sum + Number(i.qty), 0);
  },

  hasPhysical() {
    return this.get().some(i => i.type === 'physical');
  },

  shipping() {
    if (!this.hasPhysical()) return 0;
    const total = this.total();
    return total >= 1000 ? 0 : 99;
  },

  updateBadge() {
    const badges = document.querySelectorAll('.nav-cart-badge, #navCartBadge');
    const c = this.count();
    badges.forEach(badge => {
      badge.textContent = c;
      badge.style.display = c > 0 ? 'flex' : 'none';
    });
  }
};

window.Cart = Cart;
