// Hub search uses the unique structured dataset, never duplicated landing-page cards.
(function () {
  'use strict';
  var Core = window.VeVitHubSearch, search = document.getElementById('hub-search');
  if (!Core || !search) return;
  var sections = document.getElementById('sections-view'), results = document.getElementById('search-results'), grid = document.getElementById('results-grid'), title = document.getElementById('results-title'), loading = document.getElementById('results-loading'), error = document.getElementById('results-error'), clear = document.getElementById('hub-search-clear');
  var controls = { category: document.getElementById('hub-filter-category'), processing: document.getElementById('hub-filter-processing'), status: document.getElementById('hub-filter-status'), sort: document.getElementById('hub-sort'), newOnly: document.getElementById('hub-filter-new') };
  var reset = document.getElementById('hub-filters-reset'), index = [], state, active = -1, cards = [];
  // CSP-safe: data injektována jako <script type="application/json"> bloky
  // (id vv-hub-data / vv-hub-i18n), ne jako inline spustitelný script. Viz tools/index.php.
  function readJsonBlock(id) { try { var el = document.getElementById(id); return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; } }
  var I18N = readJsonBlock('vv-hub-i18n') || {};
  // Barvy odpovídají CATEGORY_COLORS v registry.php (fallback, pokud chybí injektovaný dataset).
  var colors = { pdf:'#f59e0b', image:'#8b5cf6', media:'#ec4899', text:'#6b7280', ai:'#0ea5e9', dev:'#06b6d4', security:'#10b981', calc:'#ef4444' };
  var statuses = I18N.statuses || { limited:'Omezeně dostupný', experimental:'Experimentální', coming_soon:'Připravujeme', unavailable_on_wedos:'Nedostupné na WEDOS', broken:'Nefunkční' };
  var LOC = I18N.loc || { client:'Lokálně', external_ai:'Přes AI', vevit_server:'Na serveru' };
  var TXT = { badge_new: I18N.badge_new || 'NOVÉ', card_open: I18N.card_open || 'Otevřít →', results_title: I18N.results_title || '{count} výsledků pro „{q}“', results_count: I18N.results_count || '{count} výsledků', results_title_empty: I18N.results_title_empty || 'Žádné výsledky' };

  function activeState() { return !!(state.q || state.category || state.processing || state.status || state.newOnly); }
  function setHidden(el, hidden) { if (el) el.classList.toggle('hidden', hidden); }
  function setControls() { search.value = state.q; controls.category.value = state.category; controls.processing.value = state.processing; controls.status.value = state.status; controls.sort.value = state.sort; controls.newOnly.checked = state.newOnly; setHidden(clear, !state.q); }
  function updateUrl() { var q = Core.serializeState(state); history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash); }
  function appendHighlighted(target, text, query) {
    var original = String(text || ''), normalized = Core.normalize(original), needle = Core.normalize(query || ''), map = [], offset = 0;
    Array.prototype.forEach.call(original, function (char) { var piece = Core.normalize(char); for (var i = 0; i < piece.length; i++) map.push(offset); offset += char.length; });
    var start = needle ? normalized.indexOf(needle) : -1;
    if (start < 0 || !needle) { target.textContent = original; return; }
    var end = start + needle.length, originalStart = map[start] || 0, originalEnd = end < map.length ? map[end] : original.length;
    target.appendChild(document.createTextNode(original.slice(0, originalStart)));
    var mark = document.createElement('mark'); mark.textContent = original.slice(originalStart, originalEnd); target.appendChild(mark);
    target.appendChild(document.createTextNode(original.slice(originalEnd)));
  }
  function card(item, pos) {
    var t = item.tool, a = document.createElement('a'), accent = document.createElement('span'), top = document.createElement('div'), icon = document.createElement('span'), badges = document.createElement('span'), name = document.createElement('h3'), desc = document.createElement('p'), footer = document.createElement('div'), loc = document.createElement('span'), open = document.createElement('span');
    a.className = 'tool-card'; a.href = '/tools/' + encodeURIComponent(t.slug); a.dataset.slug = t.slug; a.dataset.category = t.category; a.dataset.processingLocation = t.processing_location; a.dataset.status = t.status; a.dataset.new = String(!!t.new); a.id = 'hub-result-' + pos; a.setAttribute('role', 'option'); a.setAttribute('aria-selected', 'false'); a.tabIndex = -1;
    accent.className = 'accent'; accent.style.background = colors[t.category] || '#10b981'; a.appendChild(accent);
    top.className = 'top'; icon.className = 'icon-box'; icon.style.background = (colors[t.category] || '#10b981') + '15'; icon.textContent = String(t.icon || '•').slice(0, 1); badges.className = 'hub-card-badges';
    if (t.new) { var n = document.createElement('span'); n.className = 'badge badge-new'; n.textContent = TXT.badge_new; badges.appendChild(n); }
    if (statuses[t.status]) { var s = document.createElement('span'); s.className = 'badge badge-status-' + t.status; s.textContent = statuses[t.status]; badges.appendChild(s); }
    top.appendChild(icon); top.appendChild(badges); a.appendChild(top); name.className = 'name'; appendHighlighted(name, t.name, state.q); a.appendChild(name); desc.className = 'desc'; appendHighlighted(desc, t.description, state.q); a.appendChild(desc);
    footer.className = 'footer'; loc.className = 'badge ' + (t.processing_location === 'client' ? 'badge-loc-local' : 'badge-loc-other'); loc.textContent = LOC[t.processing_location] || (t.processing_location === 'client' ? 'Lokálně' : (t.processing_location === 'external_ai' ? 'Přes AI' : 'Na serveru')); open.className = 'open'; open.textContent = TXT.card_open; footer.appendChild(loc); footer.appendChild(open); a.appendChild(footer); return a;
  }
  function setActive(next) { if (!cards.length) { active = -1; search.removeAttribute('aria-activedescendant'); return; } active = (next + cards.length) % cards.length; cards.forEach(function (el, i) { var selected = i === active; el.classList.toggle('is-active', selected); el.setAttribute('aria-selected', String(selected)); }); search.setAttribute('aria-activedescendant', cards[active].id); cards[active].scrollIntoView({ block:'nearest' }); }
  function render() {
    if (!index.length) return; var found = Core.search(index, state), show = activeState();
    setHidden(sections, show); setHidden(results, !show); setHidden(loading, true); setHidden(error, true); search.setAttribute('aria-expanded', String(show && found.results.length > 0));
    while (grid.firstChild) grid.removeChild(grid.firstChild); cards = []; active = -1;
    found.results.slice(0, 50).forEach(function (item, i) { var el = card(item, i); cards.push(el); grid.appendChild(el); });
    var _n = found.results.length;
    title.textContent = _n ? (state.q ? TXT.results_title.replace('{count}', _n).replace('{q}', state.q) : TXT.results_count.replace('{count}', _n)) : TXT.results_title_empty;
    document.getElementById('results-empty').classList.toggle('hidden', found.results.length > 0);
    grid.classList.toggle('hidden', found.results.length === 0); updateUrl();
  }
  function changed() { state.q = search.value.slice(0, 80); state.category = controls.category.value; state.processing = controls.processing.value; state.status = controls.status.value; state.sort = controls.sort.value; state.newOnly = controls.newOnly.checked; setControls(); render(); }
  function initData(data) {
    if (!data || data.schema_version !== 1 || !Array.isArray(data.tools)) throw new Error('dataset');
    if (Array.isArray(data.categories)) data.categories.forEach(function (c) { if (c && c.id && c.color) colors[c.id] = c.color; });
    index = Core.buildIndex(data.tools); if (!index.length) throw new Error('empty');
    state = Core.parseState(location.search, { categories: (data.categories || []).map(function (x) { return x.id; }), statuses: ['working','limited','experimental','coming_soon','unavailable_on_wedos','broken'] }); setControls(); render();
  }
  function failLoad() { search.disabled = true; Object.keys(controls).forEach(function (key) { controls[key].disabled = true; }); setHidden(loading, true); setHidden(error, false); }
  var hubData = readJsonBlock('vv-hub-data');
  if (hubData) { try { initData(hubData); } catch (e) { failLoad(); } }
  else { fetch('/tools/assets/data/tools.json', { credentials:'same-origin' }).then(function (r) { if (!r.ok) throw new Error('dataset'); return r.json(); }).then(initData).catch(failLoad); }
  search.addEventListener('input', changed); Object.keys(controls).forEach(function (key) { controls[key].addEventListener('change', changed); });
  clear.addEventListener('click', function () { search.value = ''; changed(); search.focus(); });
  reset.addEventListener('click', function () { state = Core.defaultState(); setControls(); render(); });
  search.addEventListener('keydown', function (event) { if (event.key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); } else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); } else if (event.key === 'Enter' && active >= 0) { event.preventDefault(); cards[active].click(); } else if (event.key === 'Escape') { if (search.value) { search.value = ''; changed(); } else { search.setAttribute('aria-expanded', 'false'); } } });
  document.addEventListener('keydown', function (event) { var tag = document.activeElement && document.activeElement.tagName; if ((event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') { event.preventDefault(); search.focus(); } });
}());
