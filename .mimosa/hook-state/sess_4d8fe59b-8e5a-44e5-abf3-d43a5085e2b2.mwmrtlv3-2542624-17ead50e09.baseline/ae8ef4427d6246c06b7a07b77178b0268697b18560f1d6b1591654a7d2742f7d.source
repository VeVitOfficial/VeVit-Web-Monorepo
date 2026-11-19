// Převod formátu obrázku přes canvas (PNG/JPEG/WebP/BMP), čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('ic-drop'), work = ToolUI.el('ic-work'), src = ToolUI.el('ic-src'), dst = ToolUI.el('ic-dst');
  var format = ToolUI.el('ic-format'), q = ToolUI.el('ic-q'), qV = ToolUI.el('ic-q-v'), qWrap = ToolUI.el('ic-q-wrap');
  var conv = ToolUI.el('ic-conv'), dl = ToolUI.el('ic-dl'), info = ToolUI.el('ic-info'), err = ToolUI.el('ic-error');
  var img = new Image(), blob = null, outExt = 'png';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function fmtSize(b) { return (b / 1024).toFixed(1) + ' kB'; }

  // 24bit BMP encoder (bottom-up, row padding na 4 bajty).
  function bmpEncode(canvas) {
    var cx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    var data = cx.getImageData(0, 0, w, h).data;
    var rowBytes = Math.floor((24 * w + 31) / 32) * 4;
    var size = 54 + rowBytes * h;
    var buf = new ArrayBuffer(size), v = new DataView(buf);
    v.setUint8(0, 66); v.setUint8(1, 77); v.setUint32(2, size, true); v.setUint32(10, 54, true);
    v.setUint32(14, 40, true); v.setInt32(18, w, true); v.setInt32(22, h, true);
    v.setUint16(26, 1, true); v.setUint16(28, 24, true); v.setUint32(34, rowBytes * h, true);
    v.setInt32(38, 2835, true); v.setInt32(42, 2835, true);
    for (var y = 0; y < h; y++) {
      var sy = h - 1 - y, off = 54 + y * rowBytes;
      for (var x = 0; x < w; x++) {
        var s = (sy * w + x) * 4;
        v.setUint8(off + x * 3, data[s + 2]); v.setUint8(off + x * 3 + 1, data[s + 1]); v.setUint8(off + x * 3 + 2, data[s]);
      }
    }
    return new Blob([buf], { type: 'image/bmp' });
  }

  function setQVisibility() {
    var lossy = format.value === 'image/jpeg' || format.value === 'image/webp';
    qWrap.style.display = lossy ? '' : 'none';
  }

  function convert() {
    clearErr();
    if (!img.naturalWidth) return;
    var fmt = format.value;
    var c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    var cx = c.getContext('2d');
    if (fmt === 'image/jpeg' || fmt === 'image/bmp') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); }
    cx.drawImage(img, 0, 0);
    var ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/bmp': 'bmp' }[fmt];
    outExt = ext;
    if (fmt === 'image/bmp') { blob = bmpEncode(c); dst.src = URL.createObjectURL(blob); after(ext, blob.size); }
    else c.toBlob(function (b) { blob = b; dst.src = URL.createObjectURL(b); after(ext, b.size); }, fmt, (+q.value) / 100);
  }
  function after(ext, size) {
    dl.disabled = false;
    info.textContent = 'Výstup: .' + ext + ', ' + fmtSize(size);
  }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'],
    multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 25 * 1024 * 1024) return fail('Obrázek je příliš velký (max 25 MB).');
      var url = URL.createObjectURL(f);
      img.onload = function () {
        src.src = url; work.classList.remove('hidden'); setQVisibility(); convert();
      };
      img.onerror = function () { fail('Obrázek se nepodařilo načíst.'); };
      img.src = url;
    },
    onError: fail
  });

  format.addEventListener('change', function () { setQVisibility(); convert(); });
  q.addEventListener('input', function () { qV.textContent = q.value; convert(); });
  conv.addEventListener('click', convert);
  dl.addEventListener('click', function () { if (blob) ToolUI.download(blob, 'obrazek.' + outExt); });
})();