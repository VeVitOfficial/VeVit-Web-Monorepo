// Open Graph meta generátor s živým náhledem karty, čistě client-side.
(function () {
  'use strict';
  var title = ToolUI.el('og-title'), desc = ToolUI.el('og-desc'), url = ToolUI.el('og-url');
  var img = ToolUI.el('og-img'), site = ToolUI.el('og-site'), type = ToolUI.el('og-type');
  var out = ToolUI.el('og-out'), copyBtn = ToolUI.el('og-copy');
  var cImg = ToolUI.el('og-card-img'), cSite = ToolUI.el('og-card-site'), cTitle = ToolUI.el('og-card-title'), cDesc = ToolUI.el('og-card-desc');

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function host(u) { try { return new URL(u).hostname; } catch (e) { return u || ''; } }

  function build() {
    var t = title.value, d = desc.value, u = url.value, i = img.value, s = site.value, ty = type.value;
    cTitle.textContent = t || 'Titulek stránky';
    cDesc.textContent = d || 'Popis stránky…';
    cSite.textContent = s || host(u) || 'example.com';
    if (i) { cImg.textContent = ''; cImg.style.backgroundImage = 'url("' + i + '")'; }
    else { cImg.textContent = 'Bez obrázku'; cImg.style.backgroundImage = 'none'; }

    var lines = [
      '<meta property="og:title" content="' + esc(t) + '">',
      '<meta property="og:description" content="' + esc(d) + '">',
      '<meta property="og:type" content="' + esc(ty) + '">'
    ];
    if (u) lines.push('<meta property="og:url" content="' + esc(u) + '">');
    if (i) lines.push('<meta property="og:image" content="' + esc(i) + '">');
    if (s) lines.push('<meta property="og:site_name" content="' + esc(s) + '">');
    lines.push('<meta name="twitter:card" content="summary_large_image">');
    lines.push('<meta name="twitter:title" content="' + esc(t) + '">');
    lines.push('<meta name="twitter:description" content="' + esc(d) + '">');
    if (i) lines.push('<meta name="twitter:image" content="' + esc(i) + '">');
    out.value = lines.join('\n');
    copyBtn.disabled = false;
  }

  [title, desc, url, img, site, type].forEach(function (e) { e.addEventListener('input', build); e.addEventListener('change', build); });
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
  build();
})();