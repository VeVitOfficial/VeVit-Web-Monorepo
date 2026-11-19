// YAML ↔ JSON převodník, čistě client-side (lazy-load js-yaml).
(function () {
  'use strict';
  var seg = ToolUI.el('yj-mode'), inEl = ToolUI.el('yj-in'), out = ToolUI.el('yj-out');
  var run = ToolUI.el('yj-run'), copyBtn = ToolUI.el('yj-copy'), swap = ToolUI.el('yj-swap');
  var err = ToolUI.el('yj-error');
  var mode = 'y2j', loaded = false;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function ensureLib(cb) {
    if (window.jsyaml) { loaded = true; cb(); return; }
    ToolUI.loadScript('/tools/assets/js/lib/js-yaml.min.js', function (ok) {
      if (!ok || !window.jsyaml) return fail('Knihovnu js-yaml se nepodařilo načíst.');
      loaded = true; clearErr(); cb();
    });
  }

  function convert() {
    clearErr();
    if (!inEl.value.trim()) { out.value = ''; copyBtn.disabled = true; return; }
    ensureLib(function () {
      try {
        if (mode === 'y2j') {
          var obj = window.jsyaml.load(inEl.value);
          out.value = JSON.stringify(obj, null, 2);
        } else {
          var obj2 = JSON.parse(inEl.value);
          out.value = window.jsyaml.dump(obj2, { indent: 2, lineWidth: 100 });
        }
        copyBtn.disabled = !out.value;
      } catch (e) {
        out.value = ''; copyBtn.disabled = true;
        fail(mode === 'y2j' ? 'Neplatný YAML: ' + e.message : 'Neplatný JSON: ' + e.message);
      }
    });
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  });
  run.addEventListener('click', convert);
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
  swap.addEventListener('click', function () {
    inEl.value = out.value;
    var other = mode === 'y2j' ? 'j2y' : 'y2j';
    var btn = seg.querySelector('button[data-mode="' + other + '"]'); if (btn) btn.click();
    convert();
  });
})();