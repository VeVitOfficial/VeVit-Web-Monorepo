// Hub search uses the unique structured dataset, never duplicated landing-page cards.
(function () {
  'use strict';
  var Core = window.VeVitHubSearch, search = document.getElementById('hub-search');
  if (!Core || !search) return;
  var sections = document.getElementById('sections-view'), results = document.getElementById('search-results'), grid = document.getElementById('results-grid'), title = document.getElementById('results-title'), loading = document.getElementById('results-loading'), error = document.getElementById('results-error'), clear = document.getElementById('hub-search-clear');
  var controls = { category: document.getElementById('hub-filter-category'), processing: document.getElementById('hub-filter-processing'), status: document.getElementById('hub-filter-status'), sort: document.getElementById('hub-sort'), newOnly: document.getElementById('hub-filter-new') };
  var reset = document.getElementById('hub-filters-reset'), index = [], state, active = -1, cards = [];
  var colors = { pdf:'#f59e0b', image:'#ec4899', media:'#8b5cf6', text:'#10b981', ai:'#0ea5e9', dev:'#06b6d4', security:'#6b7280', calc:'#ef4444' };
  var statuses = { limited:'Omezeně dostupný', experimental:'Experimentální', coming_soon:'Připravujeme', unavailable_on_wedos:'Nedostupné na WEDOS', broken:'Nefunkční' };

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
    if (t.new) { var n = document.createElement('span'); n.className = 'badge badge-new'; n.textContent = 'NOVÉ'; badges.appendChild(n); }
    if (statuses[t.status]) { var s = document.createElement('span'); s.className = 'badge badge-status-' + t.status; s.textContent = statuses[t.status]; badges.appendChild(s); }
    top.appendChild(icon); top.appendChild(badges); a.appendChild(top); name.className = 'name'; appendHighlighted(name, t.name, state.q); a.appendChild(name); desc.className = 'desc'; appendHighlighted(desc, t.description, state.q); a.appendChild(desc);
    footer.className = 'footer'; loc.className = 'badge ' + (t.processing_location === 'client' ? 'badge-loc-local' : 'badge-loc-other'); loc.textContent = t.processing_location === 'client' ? 'Lokálně' : (t.processing_location === 'external_ai' ? 'Přes AI' : 'Na serveru'); open.className = 'open'; open.textContent = 'Otevřít →'; footer.appendChild(loc); footer.appendChild(open); a.appendChild(footer); return a;
  }
  function setActive(next) { if (!cards.length) { active = -1; search.removeAttribute('aria-activedescendant'); return; } active = (next + cards.length) % cards.length; cards.forEach(function (el, i) { var selected = i === active; el.classList.toggle('is-active', selected); el.setAttribute('aria-selected', String(selected)); }); search.setAttribute('aria-activedescendant', cards[active].id); cards[active].scrollIntoView({ block:'nearest' }); }
  function render() {
    if (!index.length) return; var found = Core.search(index, state), show = activeState();
    setHidden(sections, show); setHidden(results, !show); setHidden(loading, true); setHidden(error, true); search.setAttribute('aria-expanded', String(show && found.results.length > 0));
    while (grid.firstChild) grid.removeChild(grid.firstChild); cards = []; active = -1;
    found.results.slice(0, 50).forEach(function (item, i) { var el = card(item, i); cards.push(el); grid.appendChild(el); });
    title.textContent = found.results.length ? found.results.length + ' výsledků' + (state.q ? ' pro „' + state.q + '“' : '') : 'Žádné výsledky';
    document.getElementById('results-empty').classList.toggle('hidden', found.results.length > 0);
    grid.classList.toggle('hidden', found.results.length === 0); updateUrl();
  }
  function changed() { state.q = search.value.slice(0, 80); state.category = controls.category.value; state.processing = controls.processing.value; state.status = controls.status.value; state.sort = controls.sort.value; state.newOnly = controls.newOnly.checked; setControls(); render(); }
  fetch('/tools/assets/data/tools.json', { credentials:'same-origin' }).then(function (r) { if (!r.ok) throw new Error('dataset'); return r.json(); }).then(function (data) {
    if (!data || data.schema_version !== 1 || !Array.isArray(data.tools)) throw new Error('dataset');
    index = Core.buildIndex(data.tools); if (!index.length) throw new Error('empty');
    state = Core.parseState(location.search, { categories: (data.categories || []).map(function (x) { return x.id; }), statuses: ['working','limited','experimental','coming_soon','unavailable_on_wedos','broken'] }); setControls(); render();
  }).catch(function () { search.disabled = true; Object.keys(controls).forEach(function (key) { controls[key].disabled = true; }); setHidden(loading, true); setHidden(error, false); });
  search.addEventListener('input', changed); Object.keys(controls).forEach(function (key) { controls[key].addEventListener('change', changed); });
  clear.addEventListener('click', function () { search.value = ''; changed(); search.focus(); });
  reset.addEventListener('click', function () { state = Core.defaultState(); setControls(); render(); });
  search.addEventListener('keydown', function (event) { if (event.key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); } else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); } else if (event.key === 'Enter' && active >= 0) { event.preventDefault(); cards[active].click(); } else if (event.key === 'Escape') { if (search.value) { search.value = ''; changed(); } else { search.setAttribute('aria-expanded', 'false'); } } });
  document.addEventListener('keydown', function (event) { var tag = document.activeElement && document.activeElement.tagName; if ((event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') { event.preventDefault(); search.focus(); } });
}());
