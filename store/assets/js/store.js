const Store = {
  state: {
    products: [],
    page: 1,
    perPage: 12,
    totalPages: 1,
    filters: {
      category: '',
      type: '',
      search: '',
      sort: 'featured',
      maxPrice: 10000
    }
  },

  init() {
    this.bindFilters();
    this.bindSearch();
    this.load();
  },

  bindFilters() {
    document.querySelectorAll('.filter-cat').forEach(cb => {
      cb.addEventListener('change', () => this.load());
    });
    document.querySelectorAll('.filter-type').forEach(cb => {
      cb.addEventListener('change', () => this.load());
    });
    const sortEl = document.getElementById('sort');
    if (sortEl) sortEl.addEventListener('change', () => this.load());
    const priceEl = document.getElementById('priceRange');
    const priceVal = document.getElementById('priceValue');
    if (priceEl) {
      priceEl.addEventListener('input', e => {
        priceVal.textContent = e.target.value + ' Kč';
      });
      let debounce;
      priceEl.addEventListener('change', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => this.load(), 150);
      });
    }
  },

  bindSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    let debounce;
    input.addEventListener('input', e => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.state.filters.search = e.target.value.trim();
        this.load();
      }, 250);
    });
  },

  getQuery() {
    const cats = Array.from(document.querySelectorAll('.filter-cat:checked')).map(cb => cb.value);
    const types = Array.from(document.querySelectorAll('.filter-type:checked')).map(cb => cb.value);
    const sort = document.getElementById('sort')?.value || 'featured';
    const maxPrice = document.getElementById('priceRange')?.value || 10000;
    const params = new URLSearchParams();
    if (cats.length) params.set('category', cats.join(','));
    if (types.length && types.length < 2) params.set('type', types[0]);
    if (this.state.filters.search) params.set('search', this.state.filters.search);
    params.set('sort', sort);
    params.set('max_price', maxPrice);
    params.set('page', this.state.page);
    return params.toString();
  },

  async load() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:3rem;">Načítání...</div>';

    try {
      const res = await fetch(`api/products.php?${this.getQuery()}`);
      const data = await res.json();
      this.state.products = data.products || [];
      this.state.totalPages = data.total_pages || 1;
      this.state.page = data.page || 1;
      this.render();
      this.renderPagination();
    } catch {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:3rem;">Chyba při načítání produktů.</div>';
    }
  },

  render() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.replaceChildren();
    if (!this.state.products.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'grid-column:1/-1;text-align:center;color:var(--muted);padding:3rem;';
      empty.textContent = 'Žádné produkty nebyly nalezeny.';
      grid.appendChild(empty);
      return;
    }
    this.state.products.forEach(product => grid.appendChild(this.cardElement(product)));
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  cardElement(p) {
    const catColors = {
      merch: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      'digitalni-produkty': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      elektronika: 'linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)'
    };
    const bg = catColors[p.category_slug] || catColors.merch;
    const hasSale = p.sale_price && parseFloat(p.sale_price) > 0;
    const outOfStock = p.type === 'physical' && p.stock !== null && p.stock <= 0;

    const card = document.createElement('div');
    card.className = 'card product-card';
    const image = document.createElement('div');
    image.className = 'product-image';
    image.style.background = bg;
    image.textContent = p.category_name || '';
    card.appendChild(image);

    const info = document.createElement('div');
    info.className = 'product-info';
    const badgeWrap = document.createElement('div');
    badgeWrap.style.marginBottom = '0.5rem';
    if (hasSale || p.featured) {
      const badge = document.createElement('span');
      badge.className = hasSale ? 'badge badge-sale' : 'badge badge-new';
      badge.textContent = hasSale ? 'Sleva' : 'Novinka';
      badgeWrap.appendChild(badge);
    }
    info.appendChild(badgeWrap);

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = p.name || '';
    info.appendChild(name);
    const description = document.createElement('p');
    description.className = 'product-desc';
    description.textContent = p.short_desc || '';
    info.appendChild(description);

    const footer = document.createElement('div');
    footer.className = 'product-footer';
    const price = document.createElement('div');
    price.className = 'product-price';
    if (hasSale) {
      price.appendChild(textSpan(`${p.sale_price} Kč`, 'sale'));
      price.appendChild(textSpan(`${p.price} Kč`, 'original'));
    } else {
      price.appendChild(textSpan(`${p.price} Kč`));
    }
    footer.appendChild(price);

    const actions = document.createElement('div');
    actions.className = 'product-actions';
    if (outOfStock) {
      const disabled = iconButton('ban', 'Vyprodáno');
      disabled.disabled = true;
      actions.appendChild(disabled);
    } else {
      const add = iconButton('shopping-cart', 'Do košíku');
      add.dataset.action = 'add-to-cart';
      add.dataset.productId = String(p.id);
      add.addEventListener('click', event => {
        event.stopPropagation();
        const product = this.state.products.find(item => String(item.id) === event.currentTarget.dataset.productId);
        if (product) Cart.add({
          id: product.id, name: product.name, price: product.price,
          sale_price: product.sale_price || 0, type: product.type, slug: product.slug
        });
      });
      actions.appendChild(add);
      const detail = document.createElement('a');
      detail.href = `product.php?slug=${encodeURIComponent(p.slug || '')}`;
      detail.className = 'btn btn-sm btn-outline';
      detail.style.cssText = 'width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center;';
      detail.appendChild(iconElement('eye'));
      actions.appendChild(detail);
    }
    footer.appendChild(actions);
    info.appendChild(footer);
    card.appendChild(info);
    return card;
  },

  renderPagination() {
    const el = document.getElementById('pagination');
    if (!el) return;
    el.replaceChildren();
    if (this.state.totalPages <= 1) return;
    const previous = iconButton('chevron-left', 'Předchozí stránka');
    previous.disabled = this.state.page <= 1;
    previous.addEventListener('click', () => this.goTo(this.state.page - 1));
    el.appendChild(previous);
    for (let i = 1; i <= this.state.totalPages; i++) {
      const page = document.createElement('button');
      page.className = i === this.state.page ? 'active' : '';
      page.textContent = String(i);
      page.addEventListener('click', () => this.goTo(i));
      el.appendChild(page);
    }
    const next = iconButton('chevron-right', 'Další stránka');
    next.disabled = this.state.page >= this.state.totalPages;
    next.addEventListener('click', () => this.goTo(this.state.page + 1));
    el.appendChild(next);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  goTo(page) {
    this.state.page = page;
    this.load();
    document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

function textSpan(text, className = '') {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}

function iconElement(name) {
  const icon = document.createElement('i');
  icon.dataset.lucide = name;
  return icon;
}

function iconButton(icon, title) {
  const button = document.createElement('button');
  button.type = 'button';
  button.title = title;
  button.appendChild(iconElement(icon));
  return button;
}
window.Store = Store;
document.addEventListener('DOMContentLoaded', () => Store.init());
