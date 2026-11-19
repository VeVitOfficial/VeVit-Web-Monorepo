/* ---- Helpers ---- */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmtPrice(v) {
  return Number(v || 0).toLocaleString('cs-CZ', { maximumFractionDigits: 0 }).replace(/\s/g, ' ') + ' Kč';
}
function catBg(slug) {
  return ({'elektronika-a-prislusenstvi':'cat-bg-electronics','umeni-papirenstvi-a-tvorivost':'cat-bg-digital','domov-kuchyne-a-bydleni':'cat-bg-merch','sport-fitness-a-outdoor':'cat-bg-default','moda-obleceni-a-doplnky':'cat-bg-merch','krasa-zdravi-a-osobni-pece':'cat-bg-default','chovatelske-potreby-pet-products':'cat-bg-default','eko-and-udrzitelny-zivotni-styl':'cat-bg-default'})[slug] || 'cat-bg-default';
}
function hasSale(p) { return p.sale_price && Number(p.sale_price) > 0; }
function priceOf(p) { return hasSale(p) ? Number(p.sale_price) : Number(p.price); }
function isOutOfStock(p) { return p.type !== 'digital' && p.stock !== null && Number(p.stock) <= 0; }

/* ---- Product card ---- */
function renderProductCard(p) {
  const digital  = p.type === 'digital';
  const soldout  = isOutOfStock(p);
  const sale     = hasSale(p);
  const price    = priceOf(p);
  const bg       = catBg(p.category_slug);
  const el = document.createElement('article');
  el.setAttribute('role', 'listitem');
  el.className = 'product-card bg-surface-container border border-outline-variant rounded-xl p-4 flex flex-col group relative';
  el.innerHTML = `
    <span class="product-badge badge absolute top-2 left-2 z-10 hidden"></span>
    <a class="product-image aspect-square rounded-lg mb-4 flex items-center justify-center relative overflow-hidden border border-outline-variant/40 group-hover:scale-[1.02] transition-transform duration-300" tabindex="-1">
      <span class="product-category font-mono-label text-mono-label text-white/60 uppercase tracking-widest text-center px-3 text-[10px]"></span>
    </a>
    <div class="product-stock flex items-center gap-1.5 flex-wrap mb-1.5"></div>
    <a class="product-name font-h2 text-[15px] font-bold text-on-surface mb-1 line-clamp-2 hover:text-primary transition-colors duration-150 leading-snug"></a>
    <p class="product-description font-body-md text-[12px] text-on-surface-variant line-clamp-2 mb-3 flex-1 leading-relaxed"></p>
    <div class="flex justify-between items-center mt-auto pt-3 border-t border-outline-variant">
      <div><span class="product-price font-display text-[17px] font-bold text-primary block"></span><span class="product-original-price hidden font-caption text-caption text-on-surface-variant line-through"></span></div>
      <button type="button" class="product-add btn btn-icon btn-sm bg-surface border border-outline-variant transition-colors"><span class="material-symbols-outlined text-[18px]"></span></button>
    </div>`;
  const href = `product.php?slug=${encodeURIComponent(String(p.slug || ''))}`;
  const badge = el.querySelector('.product-badge');
  if (p.featured || sale) {
    badge.textContent = p.featured ? 'Nové' : 'Sleva';
    badge.classList.add(p.featured ? 'badge-primary' : 'badge-danger');
    badge.classList.remove('hidden');
  }
  const image = el.querySelector('.product-image');
  image.href = href;
  image.classList.add(bg);
  el.querySelector('.product-category').textContent = String(p.category_name || 'VeVit');
  const stock = el.querySelector('.product-stock');
  if ((!digital && p.stock !== null) || digital) {
    const stockBadge = document.createElement('span');
    stockBadge.className = `badge ${digital ? 'badge-primary' : Number(p.stock) > 0 ? 'badge-success' : 'badge-danger'}`;
    stockBadge.textContent = digital ? 'Digitální' : Number(p.stock) > 0 ? 'Skladem' : 'Vyprodáno';
    stock.appendChild(stockBadge);
  }
  const name = el.querySelector('.product-name');
  name.href = href;
  name.textContent = String(p.name || '');
  el.querySelector('.product-description').textContent = String(p.short_desc || '');
  el.querySelector('.product-price').textContent = fmtPrice(price);
  if (sale) {
    const original = el.querySelector('.product-original-price');
    original.textContent = fmtPrice(Number(p.price));
    original.classList.remove('hidden');
  }
  const add = el.querySelector('.product-add');
  const icon = add.querySelector('span');
  if (soldout) {
    add.disabled = true;
    add.setAttribute('aria-label', 'Vyprodáno');
    add.classList.add('text-on-surface-variant', 'cursor-not-allowed', 'opacity-50');
    icon.textContent = 'block';
  } else {
    add.dataset.addProduct = JSON.stringify({ id: Number(p.id), name: p.name, price: Number(p.price), sale_price: p.sale_price ? Number(p.sale_price) : null, type: p.type, slug: p.slug });
    add.setAttribute('aria-label', `Přidat ${String(p.name || '')} do košíku`);
    add.classList.add('hover:border-primary', 'text-on-surface', 'hover:text-primary');
    icon.textContent = 'add_shopping_cart';
  }
  return el;
}

/* ---- Category card ---- */
function renderCatCard(cat, large) {
  const bg = catBg(cat.slug);
  const a  = document.createElement('a');
  a.href   = `catalog.php?category=${encodeURIComponent(cat.slug)}`;
  a.className = `${large ? 'sm:col-span-2' : ''} relative group rounded-xl overflow-hidden border border-outline-variant hover:border-primary/50 transition-colors block ${bg} h-[160px]`;
  a.innerHTML = '<div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div><div class="absolute bottom-3 left-3 right-10"><h3 class="category-name font-display text-[15px] font-bold text-white leading-tight mb-0.5 line-clamp-2"></h3><p class="category-count font-mono-label text-[10px] text-white/60 uppercase"></p></div><div class="absolute top-2 right-2 bg-black/40 backdrop-blur-sm p-1.5 rounded-lg border border-white/10"><span class="category-icon material-symbols-outlined text-primary text-[16px]"></span></div>';
  a.querySelector('.category-name').textContent = String(cat.name || '');
  a.querySelector('.category-count').textContent = `${Number(cat.product_count)} produktů`;
  a.querySelector('.category-icon').textContent = String(cat.icon || 'category');
  return a;
}

/* ---- Fill product row ---- */
function fillRow(gridId, sectionId, products, showEmpty) {
  const section = document.getElementById(sectionId);
  const grid    = document.getElementById(gridId);
  if (!section || !grid) return;
  if (!products || !products.length) {
    if (showEmpty) section.classList.remove('hidden');
    return;
  }
  grid.replaceChildren();
  products.slice(0, 8).forEach(p => grid.appendChild(renderProductCard(p)));
  section.classList.remove('hidden');
}

/* ---- Render categories ---- */
function renderCategories(cats) {
  const grid  = document.getElementById('categoriesGrid');
  const empty = document.getElementById('catsEmpty');
  if (!grid) return;
  const parents = cats.filter(c => c.parent_id === null || c.parent_id === undefined);
  grid.replaceChildren();
  if (!parents.length) {
    empty && empty.classList.remove('hidden');
    return;
  }
  // Show max 8 parent cats
  parents.slice(0, 8).forEach((cat, i) => grid.appendChild(renderCatCard(cat, i === 0 && parents.length > 3)));
  document.getElementById('categoriesSection')?.classList.remove('hidden');
}

/* ---- Homepage load ---- */
async function loadHome() {
  try {
    const [featRes, dealsRes, bestRes, recentRes, catRes] = await Promise.all([
      fetch('api/products.php?sort=featured&per_page=8').then(r => r.json()).catch(() => ({})),
      fetch('api/products.php?deals=1&per_page=8').then(r => r.json()).catch(() => ({})),
      fetch('api/products.php?sort=bestselling&per_page=8').then(r => r.json()).catch(() => ({})),
      fetch('api/recent.php').then(r => r.json()).catch(() => ({})),
      fetch('api/categories.php').then(r => r.json()).catch(() => ({})),
    ]);

    // Featured: show section with empty state if no products
    const featGrid    = document.getElementById('featuredGrid');
    const featEmpty   = document.getElementById('featuredEmpty');
    if (featGrid) featGrid.replaceChildren();
    if (featRes.products && featRes.products.length) {
      featRes.products.slice(0, 8).forEach(p => featGrid?.appendChild(renderProductCard(p)));
      featEmpty?.classList.add('hidden');
    } else {
      featEmpty?.classList.remove('hidden');
    }

    if (dealsRes.products && dealsRes.products.length)  fillRow('dealsGrid',  'dealsSection',  dealsRes.products, false);
    if (bestRes.products  && bestRes.products.length)   fillRow('bestGrid',   'bestSection',   bestRes.products,  false);
    if (recentRes.products && recentRes.products.length) fillRow('recentGrid', 'recentSection', recentRes.products, false);
    if (catRes.categories) renderCategories(catRes.categories);
    else {
      document.getElementById('categoriesGrid').replaceChildren();
      document.getElementById('catsEmpty')?.classList.remove('hidden');
    }

  } catch (err) {
    console.error('Homepage load error:', err);
    // Show empty states on failure
    document.getElementById('featuredGrid')?.replaceChildren();
    document.getElementById('featuredEmpty')?.classList.remove('hidden');
    document.getElementById('categoriesGrid').replaceChildren();
    document.getElementById('catsEmpty')?.classList.remove('hidden');
  }
}

/* ---- Add-to-cart delegation ---- */
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-add-product]');
  if (!btn) return;
  try { Cart.add(JSON.parse(btn.dataset.addProduct)); } catch { /* malformed */ }
});

loadHome();
