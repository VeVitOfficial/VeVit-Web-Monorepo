// Filtry obrázku přes canvas (ctx.filter), čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('if-drop'), work = ToolUI.el('if-work'), preview = ToolUI.el('if-preview');
  var format = ToolUI.el('if-format'), dl = ToolUI.el('if-dl'), err = ToolUI.el('if-error');
  var img = new Image(), canvas = null, ctx = null;
  var toggles = { grayscale: false, sepia: false };

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function val(id) { return ToolUI.el(id).value; }
  function filterStr() {
    var parts = [
      'brightness(' + val('if-b') + '%)',
      'contrast(' + val('if-c') + '%)',
      'saturate(' + val('if-s') + '%)',
      'hue-rotate(' + val('if-h') + 'deg)',
      'blur(' + val('if-bl') + 'px)',
      'invert(' + val('if-i') + '%)'
    ];
    if (toggles.grayscale) parts.push('grayscale(100%)');
    if (toggles.sepia) parts.push('sepia(100%)');
    return parts.join(' ');
  }

  function render() {
    if (!img.naturalWidth) return;
    if (!canvas) { canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; ctx = canvas.getContext('2d'); }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = filterStr();
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';
    preview.src = canvas.toDataURL('image/png');
    dl.disabled = false;
  }

  function bind(id, suffix) {
    var e = ToolUI.el(id), lab = ToolUI.el(id + '-v');
    e.addEventListener('input', function () { lab.textContent = e.value; render(); });
  }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 25 * 1024 * 1024) return fail('Obrázek je příliš velký (max 25 MB).');
      canvas = null;
      img.onload = function () { work.classList.remove('hidden'); render(); };
      img.onerror = function () { fail('Obrázek se nepodařilo načíst.'); };
      img.src = URL.createObjectURL(f);
    },
    onError: fail
  });

  ['if-b', 'if-c', 'if-s', 'if-h', 'if-bl', 'if-i'].forEach(bind);
  document.querySelectorAll('[data-tog]').forEach(function (b) {
    b.addEventListener('click', function () {
      toggles[b.dataset.tog] = !toggles[b.dataset.tog];
      b.classList.toggle('btn-primary', toggles[b.dataset.tog]);
      b.classList.toggle('btn-ghost', !toggles[b.dataset.tog]);
      render();
    });
  });
  ToolUI.el('if-reset').addEventListener('click', function () {
    toggles = { grayscale: false, sepia: false };
    [{ id: 'if-b', v: 100 }, { id: 'if-c', v: 100 }, { id: 'if-s', v: 100 }, { id: 'if-h', v: 0 }, { id: 'if-bl', v: 0 }, { id: 'if-i', v: 0 }].forEach(function (o) {
      ToolUI.el(o.id).value = o.v; ToolUI.el(o.id + '-v').textContent = o.v;
    });
    document.querySelectorAll('[data-tog]').forEach(function (b) { b.classList.remove('btn-primary'); b.classList.add('btn-ghost'); });
    render();
  });
  dl.addEventListener('click', function () {
    if (!canvas) return;
    var fmt = format.value, ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[fmt];
    canvas.toBlob(function (b) { ToolUI.download(b, 'obrazek-filtr.' + ext); }, fmt, 0.92);
  });
})();