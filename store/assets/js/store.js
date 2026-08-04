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
    if (!this.state.products.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:3rem;">Žádné produkty nebyly nalezeny.</div>';
      return;
    }
    grid.innerHTML = this.state.products.map(p => this.cardHtml(p)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  cardHtml(p) {
    const catColors = {
      merch: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      'digitalni-produkty': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      elektronika: 'linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)'
    };
    const bg = catColors[p.category_slug] || catColors.merch;
    const price = p.sale_price && parseFloat(p.sale_price) > 0
      ? `<span class="sale">${p.sale_price} Kč</span><span class="original">${p.price} Kč</span>`
      : `<span>${p.price} Kč</span>`;
    const badge = p.sale_price && parseFloat(p.sale_price) > 0
      ? '<span class="badge badge-sale">Sleva</span>'
      : p.featured ? '<span class="badge badge-new">Novinka</span>' : '';
    const outOfStock = p.type === 'physical' && p.stock !== null && p.stock <= 0;

    return `<div class="card product-card">
      <div class="product-image" style="background:${bg};">${p.category_name}</div>
      <div class="product-info">
        <div style="margin-bottom:0.5rem;">${badge}</div>
        <h3 class="product-name">${h(p.name)}</h3>
        <p class="product-desc">${h(p.short_desc || '')}</p>
        <div class="product-footer">
          <div class="product-price">${price}</div>
          <div class="product-actions">
            ${outOfStock
              ? '<button disabled title="Vyprodáno"><i data-lucide="ban"></i></button>'
              : `<button onclick="Cart.add({id:${p.id},name:'${h(p.name)}',price:${p.price},sale_price:${p.sale_price || 0},type:'${p.type}',slug:'${p.slug}'});event.stopPropagation();" title="Do košíku"><i data-lucide="shopping-cart"></i></button>
                 <a href="product.php?slug=${encodeURIComponent(p.slug)}" class="btn btn-sm btn-outline" style="width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center;"><i data-lucide="eye"></i></a>`}
          </div>
        </div>
      </div>
    </div>`;
  },

  renderPagination() {
    const el = document.getElementById('pagination');
    if (!el) return;
    if (this.state.totalPages <= 1) { el.innerHTML = ''; return; }
    let html = '';
    html += `<button ${this.state.page <= 1 ? 'disabled' : ''} onclick="Store.goTo(${this.state.page - 1})"><i data-lucide="chevron-left"></i></button>`;
    for (let i = 1; i <= this.state.totalPages; i++) {
      html += `<button class="${i === this.state.page ? 'active' : ''}" onclick="Store.goTo(${i})">${i}</button>`;
    }
    html += `<button ${this.state.page >= this.state.totalPages ? 'disabled' : ''} onclick="Store.goTo(${this.state.page + 1})"><i data-lucide="chevron-right"></i></button>`;
    el.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  goTo(page) {
    this.state.page = page;
    this.load();
    document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

function h(text) { return text?.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) || ''; }
window.Store = Store;
document.addEventListener('DOMContentLoaded', () => Store.init());
