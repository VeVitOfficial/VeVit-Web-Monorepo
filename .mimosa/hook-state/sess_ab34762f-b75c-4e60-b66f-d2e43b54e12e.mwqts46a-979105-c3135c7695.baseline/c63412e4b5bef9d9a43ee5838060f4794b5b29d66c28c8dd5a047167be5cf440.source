// CSS/JS/HTML formátovač a minifikátor, čistě client-side (js-beautify lazy-load + regex minify).
(function () {
  'use strict';
  var langSeg = ToolUI.el('fj-lang'), actSeg = ToolUI.el('fj-act'), indent = ToolUI.el('fj-indent');
  var inEl = ToolUI.el('fj-in'), out = ToolUI.el('fj-out'), run = ToolUI.el('fj-run');
  var copyBtn = ToolUI.el('fj-copy'), err = ToolUI.el('fj-error');
  var lang = 'css', act = 'beautify';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function wireSeg(seg, setVal, dataAttr) {
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[' + dataAttr + ']'); if (!b) return;
      setVal(b.getAttribute(dataAttr));
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
        var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    });
  }
  wireSeg(langSeg, function (v) { lang = v; }, 'data-lang');
  wireSeg(actSeg, function (v) { act = v; }, 'data-act');

  function loadAll(srcs, i, cb) {
    if (i >= srcs.length) return cb(true);
    ToolUI.loadScript(srcs[i], function (ok) { if (!ok) return cb(false); loadAll(srcs, i + 1, cb); });
  }
  function ensureBeautify(cb) {
    var need = [];
    if (lang === 'js') { if (!window.js_beautify) need.push('/tools/assets/js/lib/beautify.min.js'); }
    else if (lang === 'css') { if (!window.css_beautify) need.push('/tools/assets/js/lib/beautify-css.js'); }
    else {
      if (!window.js_beautify) need.push('/tools/assets/js/lib/beautify.min.js');
      if (!window.css_beautify) need.push('/tools/assets/js/lib/beautify-css.js');
      if (!window.html_beautify) need.push('/tools/assets/js/lib/beautify-html.js');
    }
    if (!need.length) return cb(true);
    loadAll(need, 0, cb);
  }

  function minify(l, s) {
    if (l === 'css') {
      return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>~+])\s*/g, '$1').replace(/;}/g, '}').trim();
    }
    if (l === 'html') {
      return s.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
    }
    // JS — konzervativní: odstraň blokové komentáře, spoj řádky mezerou, kolaps mezer.
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');
    s = s.replace(/\r\n?/g, '\n');
    s = s.split('\n').map(function (line) { return line.replace(/\s+$/, ''); }).join('\n');
    s = s.replace(/\n\s*\n/g, '\n').replace(/[ \t]{2,}/g, ' ');
    return s.trim();
  }

  function compute() {
    clearErr();
    if (!inEl.value) { out.value = ''; copyBtn.disabled = true; return; }
    if (act === 'minify') {
      try { out.value = minify(lang, inEl.value); copyBtn.disabled = !out.value; }
      catch (e) { out.value = ''; copyBtn.disabled = true; fail('Chyba: ' + e.message); }
      return;
    }
    ensureBeautify(function (ok) {
      if (!ok) return fail('Knihovnu se nepodařilo načíst.');
      try {
        var opts = { indent_size: +indent.value || 2, end_with_newline: false };
        if (lang === 'js') out.value = window.js_beautify(inEl.value, opts);
        else if (lang === 'css') out.value = window.css_beautify(inEl.value, opts);
        else out.value = window.html_beautify(inEl.value, opts);
        copyBtn.disabled = !out.value;
      } catch (e) { out.value = ''; copyBtn.disabled = true; fail('Chyba: ' + e.message); }
    });
  }

  run.addEventListener('click', compute);
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
})();