(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.VeVitHubSearch = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var MAX_QUERY = 80;
  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }
  function tokens(value) { return normalize(value).split(' ').filter(Boolean); }
  function uniqueTools(tools) {
    var map = new Map();
    (Array.isArray(tools) ? tools : []).forEach(function (tool) { if (tool && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.slug || '') && !map.has(tool.slug)) map.set(tool.slug, tool); });
    return Array.from(map.values());
  }
  function buildIndex(tools) {
    return uniqueTools(tools).map(function (tool) {
      var name = normalize(tool.name), aliases = (tool.aliases || []).map(normalize), keywords = (tool.keywords || []).map(normalize), slug = normalize(tool.slug), description = normalize(tool.description);
      return { tool: tool, name: name, aliases: aliases, keywords: keywords, slug: slug, description: description, tokenPool: tokens([name].concat(aliases, keywords, [slug]).join(' ')) };
    });
  }
  function distance(a, b, limit) {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    var prev = [], cur = [], i, j; for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) { cur[0] = i; var min = cur[0]; for (j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); min = Math.min(min, cur[j]); } if (min > limit) return limit + 1; prev = cur; cur = []; }
    return prev[b.length];
  }
  function score(entry, query) {
    if (!query) return 0;
    var qTokens = tokens(query), aggregate = [entry.name].concat(entry.aliases, entry.keywords, [entry.slug, entry.description]).join(' ');
    if (!qTokens.every(function (token) { return aggregate.indexOf(token) !== -1; })) return 0;
    if (entry.name === query) return 1000;
    if (entry.name.indexOf(query) === 0) return 900;
    if (entry.name.indexOf(query) !== -1) return 740;
    if (entry.aliases.some(function (x) { return x === query; })) return 700;
    if (entry.aliases.some(function (x) { return x.indexOf(query) === 0; })) return 660;
    if (entry.keywords.some(function (x) { return x === query; })) return 640;
    if (entry.keywords.some(function (x) { return x.indexOf(query) === 0; })) return 600;
    if (entry.slug === query) return 560;
    if (entry.slug.indexOf(query) !== -1) return 500;
    return entry.description.indexOf(query) !== -1 ? 320 : 300;
  }
  function fuzzy(entry, query) {
    if (tokens(query).length !== 1 || query.length < 4) return 0;
    var limit = query.length <= 6 ? 1 : 2, best = limit + 1;
    entry.tokenPool.forEach(function (token) { best = Math.min(best, distance(query, token, limit)); });
    return best <= limit ? 220 - best * 30 : 0;
  }
  function defaultState() { return { q: '', category: '', processing: '', status: '', newOnly: false, sort: 'relevance' }; }
  function search(index, state) {
    state = Object.assign(defaultState(), state || {}); var query = normalize(String(state.q || '').slice(0, MAX_QUERY));
    var results = index.filter(function (entry) {
      var t = entry.tool; return (!state.category || t.category === state.category) && (!state.processing || t.processing_location === state.processing) && (!state.status || t.status === state.status) && (!state.newOnly || t.new === true);
    }).map(function (entry) { var direct = score(entry, query); return { tool: entry.tool, score: direct || fuzzy(entry, query) }; }).filter(function (item) { return !query || item.score > 0; });
    results.sort(function (a, b) {
      if (state.sort === 'name') return a.tool.name.localeCompare(b.tool.name, 'cs');
      if (state.sort === 'newest') return (b.tool.new === true) - (a.tool.new === true) || a.tool.name.localeCompare(b.tool.name, 'cs');
      return b.score - a.score || a.tool.name.localeCompare(b.tool.name, 'cs') || a.tool.slug.localeCompare(b.tool.slug, 'cs');
    });
    return { results: results, query: query };
  }
  function parseState(search, allowed) {
    var state = defaultState(), p = new URLSearchParams(String(search || '').replace(/^\?/, '')), q = (p.get('q') || '').trim();
    if (q && q.length <= MAX_QUERY) state.q = q;
    if ((allowed.categories || []).indexOf(p.get('category')) !== -1) state.category = p.get('category');
    if (['client', 'vevit_server', 'external_ai'].indexOf(p.get('processing')) !== -1) state.processing = p.get('processing');
    if ((allowed.statuses || []).indexOf(p.get('status')) !== -1) state.status = p.get('status');
    state.newOnly = p.get('new') === '1';
    if (['relevance', 'name', 'newest'].indexOf(p.get('sort')) !== -1) state.sort = p.get('sort');
    return state;
  }
  function serializeState(state) {
    var p = new URLSearchParams(); if (state.q) p.set('q', state.q); if (state.category) p.set('category', state.category); if (state.processing) p.set('processing', state.processing); if (state.status) p.set('status', state.status); if (state.newOnly) p.set('new', '1'); if (state.sort && state.sort !== 'relevance') p.set('sort', state.sort); return p.toString();
  }
  return { normalize: normalize, buildIndex: buildIndex, search: search, defaultState: defaultState, parseState: parseState, serializeState: serializeState };
}));
