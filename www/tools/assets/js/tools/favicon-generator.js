// Favicon generátor — PNG více velikostí + ICO + ZIP, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('fg-drop'), work = ToolUI.el('fg-work'), preview = ToolUI.el('fg-preview');
  var dlIco = ToolUI.el('fg-dl-ico'), dlZip = ToolUI.el('fg-dl-zip'), err = ToolUI.el('fg-error');
  var bg = ToolUI.el('fg-bg');
  var img = new Image(), pngs = {}; // size -> Blob

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function sizes() {
    var arr = []; Array.prototype.forEach.call(document.querySelectorAll('.fg-sz:checked'), function (c) { arr.push(+c.value); });
    return arr.sort(function (a, b) { return a - b; });
  }

  function renderSize(s) {
    var c = document.createElement('canvas'); c.width = s; c.height = s;
    var cx = c.getContext('2d'); cx.imageSmoothingQuality = 'high';
    if (bg.value) { cx.fillStyle = bg.value; cx.fillRect(0, 0, s, s); }
    cx.drawImage(img, 0, 0, s, s);
    return new Promise(function (res) { c.toBlob(function (b) { res(b); }, 'image/png'); });
  }

  // ICO = ICONDIR (6B) + ICONDIRENTRY (16B each) + PNG blob data (Vista+ podporuje PNG záznamy).
  function buildIco(blobs) {
    var count = blobs.length, headerLen = 6 + count * 16;
    var total = headerLen;
    blobs.forEach(function (b) { total += b.size; });
    var buf = new ArrayBuffer(total), dv = new DataView(buf), u8 = new Uint8Array(buf);
    dv.setUint16(0, 0, true);  // reserved
    dv.setUint16(2, 1, true);  // type = icon
    dv.setUint16(4, count, true);
    var off = headerLen;
    for (var i = 0; i < count; i++) {
      var b = blobs[i], sz = b.size, size = b._size;
      var dim = size >= 256 ? 0 : size;
      dv.setUint8(6 + i * 16 + 0, dim);  // šířka
      dv.setUint8(6 + i * 16 + 1, dim);  // výška
      dv.setUint8(6 + i * 16 + 2, 0);    // paleta
      dv.setUint8(6 + i * 16 + 3, 0);    // reserved
      dv.setUint16(6 + i * 16 + 4, 1, true);   // planes
      dv.setUint16(6 + i * 16 + 6, 32, true);  // bpp
      dv.setUint32(6 + i * 16 + 8, sz, true);   // bytes
      dv.setUint32(6 + i * 16 + 12, off, true); // offset
      u8.set(new Uint8Array(b), off);
      off += sz;
    }
    return new Blob([buf], { type: 'image/x-icon' });
  }

  function generate() {
    var szs = sizes();
    if (!szs.length) return fail('Vyberte alespoň jednu velikost.');
    var tasks = szs.map(function (s) { return renderSize(s).then(function (b) { b._size = s; pngs[s] = b; return b; }); });
    Promise.all(tasks).then(function (blobs) {
      preview.textContent = '';
      blobs.forEach(function (b) {
        var wrap = document.createElement('div'); wrap.className = 'stack-sm'; wrap.style.alignItems = 'center';
        var im = document.createElement('img'); im.src = URL.createObjectURL(b); im.style.width = Math.min(96, b._size) + 'px'; im.style.height = Math.min(96, b._size) + 'px'; im.style.imageRendering = b._size <= 32 ? 'pixelated' : 'auto';
        var lbl = document.createElement('span'); lbl.className = 'muted'; lbl.style.fontSize = '0.75rem'; lbl.textContent = b._size + '×' + b._size;
        wrap.appendChild(im); wrap.appendChild(lbl); preview.appendChild(wrap);
      });
      var ico = buildIco(blobs);
      pngs._ico = ico;
      dlIco.disabled = false; dlZip.disabled = false;
    });
  }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 25 * 1024 * 1024) return fail('Obrázek je příliš velký (max 25 MB).');
      img.onload = function () { work.classList.remove('hidden'); generate(); };
      img.onerror = function () { fail('Obrázek se nepodařilo načíst.'); };
      img.src = URL.createObjectURL(f);
    },
    onError: fail
  });
  Array.prototype.forEach.call(document.querySelectorAll('.fg-sz'), function (c) { c.addEventListener('change', function () { if (img.naturalWidth) generate(); }); });
  bg.addEventListener('input', function () { if (img.naturalWidth) generate(); });
  dlIco.addEventListener('click', function () { ToolUI.download(pngs._ico, 'favicon.ico'); });
  dlZip.addEventListener('click', function () {
    ToolUI.loadScript('/tools/assets/js/lib/jszip.min.js', function (ok) {
      if (!ok || !window.JSZip) return fail('Knihovnu JSZip se nepodařilo načíst.');
      var zip = new JSZip();
      Object.keys(pngs).forEach(function (k) {
        if (k === '_ico') zip.file('favicon.ico', pngs._ico);
        else zip.file('favicon-' + k + '.png', pngs[k]);
      });
      zip.generateAsync({ type: 'blob' }).then(function (b) { ToolUI.download(b, 'favicony.zip'); });
    });
  });
})();