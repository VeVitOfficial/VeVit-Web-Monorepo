// Komprese obrázku přes canvas, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('co-drop'), work = ToolUI.el('co-work'), src = ToolUI.el('co-src'), dst = ToolUI.el('co-dst');
  var format = ToolUI.el('co-format'), q = ToolUI.el('co-q'), qV = ToolUI.el('co-q-v'), maxD = ToolUI.el('co-max');
  var run = ToolUI.el('co-run'), dl = ToolUI.el('co-dl'), info = ToolUI.el('co-info'), err = ToolUI.el('co-error');
  var img = new Image(), blob = null, origSize = 0, outExt = 'jpg';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function fmtSize(b) { return (b / 1024).toFixed(1) + ' kB'; }

  function compress() {
    clearErr();
    if (!img.naturalWidth) return;
    var fmt = format.value, md = +maxD.value || 0;
    var w = img.naturalWidth, h = img.naturalHeight;
    if (md > 0 && (w > md || h > md)) { var s = md / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var cx = c.getContext('2d');
    if (fmt === 'image/jpeg') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); }
    cx.drawImage(img, 0, 0, w, h);
    outExt = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[fmt];
    c.toBlob(function (b) {
      blob = b; dst.src = URL.createObjectURL(b);
      var pct = origSize ? Math.round((1 - b.size / origSize) * 100) : 0;
      info.textContent = 'Původní: ' + fmtSize(origSize) + ' → výsledek: ' + fmtSize(b.size) + ' (–' + Math.max(0, pct) + ' %)';
      dl.disabled = false;
    }, fmt, fmt === 'image/png' ? undefined : (+q.value) / 100);
  }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 25 * 1024 * 1024) return fail('Obrázek je příliš velký (max 25 MB).');
      origSize = f.size;
      var url = URL.createObjectURL(f);
      img.onload = function () { src.src = url; work.classList.remove('hidden'); compress(); };
      img.onerror = function () { fail('Obrázek se nepodařilo načíst.'); };
      img.src = url;
    },
    onError: fail
  });
  q.addEventListener('input', function () { qV.textContent = q.value; });
  [format, maxD].forEach(function (e) { e.addEventListener('change', compress); e.addEventListener('input', compress); });
  run.addEventListener('click', compress);
  dl.addEventListener('click', function () { if (blob) ToolUI.download(blob, 'komprimovano.' + outExt); });
})();