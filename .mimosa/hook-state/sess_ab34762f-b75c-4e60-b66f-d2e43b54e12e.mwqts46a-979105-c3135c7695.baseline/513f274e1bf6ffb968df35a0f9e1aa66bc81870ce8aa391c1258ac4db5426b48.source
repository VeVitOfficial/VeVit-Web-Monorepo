// Otočení/překlopení obrázku přes canvas, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('rf-drop'), work = ToolUI.el('rf-work'), preview = ToolUI.el('rf-preview');
  var format = ToolUI.el('rf-format'), dl = ToolUI.el('rf-dl'), err = ToolUI.el('rf-error');
  var canvas = null, ctx = null, outExt = 'png';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function ensureCanvas(w, h) { canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; ctx = canvas.getContext('2d'); }
  function redraw() {
    var fmt = format.value;
    outExt = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[fmt];
    if (fmt === 'image/jpeg') {
      var tmp = document.createElement('canvas'); tmp.width = canvas.width; tmp.height = canvas.height;
      var tx = tmp.getContext('2d'); tx.fillStyle = '#fff'; tx.fillRect(0, 0, tmp.width, tmp.height); tx.drawImage(canvas, 0, 0);
      preview.src = tmp.toDataURL(fmt, 0.92);
    } else preview.src = canvas.toDataURL(fmt);
    dl.disabled = false;
  }

  function apply(op) {
    if (!canvas) return;
    var tmp = document.createElement('canvas');
    var w = canvas.width, h = canvas.height, tx;
    if (op === 'rot90' || op === 'rot270') { tmp.width = h; tmp.height = w; }
    else { tmp.width = w; tmp.height = h; }
    tx = tmp.getContext('2d');
    if (op === 'rot90') { tx.translate(h, 0); tx.rotate(Math.PI / 2); }
    else if (op === 'rot270') { tx.translate(0, w); tx.rotate(-Math.PI / 2); }
    else if (op === 'rot180') { tx.translate(w, h); tx.rotate(Math.PI); }
    else if (op === 'fliph') { tx.translate(w, 0); tx.scale(-1, 1); }
    else if (op === 'flipv') { tx.translate(0, h); tx.scale(1, -1); }
    tx.drawImage(canvas, 0, 0);
    ensureCanvas(tmp.width, tmp.height);
    ctx.drawImage(tmp, 0, 0);
    redraw();
  }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 25 * 1024 * 1024) return fail('Obrázek je příliš velký (max 25 MB).');
      var img = new Image();
      img.onload = function () {
        ensureCanvas(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(img, 0, 0);
        work.classList.remove('hidden'); redraw();
      };
      img.onerror = function () { fail('Obrázek se nepodařilo načíst.'); };
      img.src = URL.createObjectURL(f);
    },
    onError: fail
  });

  document.querySelectorAll('[data-op]').forEach(function (b) { b.addEventListener('click', function () { apply(b.dataset.op); }); });
  format.addEventListener('change', redraw);
  dl.addEventListener('click', function () {
    if (!canvas) return;
    var fmt = format.value;
    canvas.toBlob(function (b) { ToolUI.download(b, 'obrazek.' + outExt); }, fmt, 0.92);
  });
})();