// Tvůrce animovaného GIFu ze sekvence obrázků, čistě client-side (gifenc).
(function () {
  'use strict';
  var drop = ToolUI.el('gm-drop'), list = ToolUI.el('gm-list'), work = ToolUI.el('gm-work');
  var delay = ToolUI.el('gm-delay'), width = ToolUI.el('gm-width'), run = ToolUI.el('gm-run'), err = ToolUI.el('gm-error');
  var prog = ToolUI.el('gm-prog'), progLabel = ToolUI.el('gm-prog-label');
  var out = ToolUI.el('gm-out'), card = ToolUI.el('gm-card');
  var files = [], MAX = 15 * 1024 * 1024;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function setP(p, l) { ToolUI.setProgress(prog, p, l); progLabel.textContent = l; }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'], multiple: true,
    onFiles: function (arr) {
      clearErr();
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].size > MAX) return fail('Obrázek „' + arr[i].name + '" je příliš velký (max ' + ToolUI.fmtSize(MAX) + ').');
        files.push(arr[i]);
      }
      ToolUI.renderFileList(list, files.map(function (f) { return { name: f.name, size: f.size }; }), function (idx) {
        files.splice(idx, 1);
        if (!files.length) { list.classList.add('hidden'); work.classList.add('hidden'); run.disabled = true; }
      }, { reorder: true, onMove: function (i, dir) { var j = i + dir; if (j < 0 || j >= files.length) return; var t = files[i]; files[i] = files[j]; files[j] = t; } });
      list.classList.remove('hidden'); work.classList.remove('hidden'); run.disabled = files.length < 2;
    },
    onError: fail
  });

  function loadImage(f, cb) {
    var url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function () { URL.revokeObjectURL(url); cb(img); };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }

  function ensureLib(cb) {
    if (window.gifenc && window.gifenc.GIFEncoder) return cb();
    ToolUI.loadScript('/tools/assets/js/lib/gifenc.js', cb);
  }

  run.addEventListener('click', function () {
    if (files.length < 2) return fail('Přidejte alespoň dva obrázky.');
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    setP(5, 'Načítám obrázky…');

    // Načti všechny obrázky.
    var imgs = new Array(files.length), loaded = 0, failed = false;
    files.forEach(function (f, i) {
      loadImage(f, function (im) {
        if (failed) return;
        if (!im) { failed = true; prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; return fail('Obrázek „' + f.name + '" se nepodařilo načíst.'); }
        imgs[i] = im; loaded++;
        setP(5 + Math.round((loaded / files.length) * 25), 'Načítám obrázky…');
        if (loaded === files.length) build(imgs);
      });
    });
  });

  function build(imgs) {
    ensureLib(function () {
      var W, H;
      var w = +width.value || 0;
      if (w > 0) { W = w; H = Math.round(imgs[0].naturalHeight * (w / imgs[0].naturalWidth)) || w; }
      else { W = imgs[0].naturalWidth || imgs[0].width; H = imgs[0].naturalHeight || imgs[0].height; }
      // Omezení rozumné velikosti (GIF encoder je citlivý na velké plátno).
      if (W * H > 1280 * 1280) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; return fail('Příliš velký GIF (max cca 1280×1280). Zmenšete šířku.'); }

      var enc = window.gifenc.GIFEncoder();
      var dly = Math.max(20, +delay.value || 200);
      var n = imgs.length;
      for (var i = 0; i < n; i++) {
        var c = document.createElement('canvas'); c.width = W; c.height = H;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
        ctx.drawImage(imgs[i], 0, 0, W, H);
        var data = ctx.getImageData(0, 0, W, H).data;
        var palette = window.gifenc.quantize(data, 256);
        var index = window.gifenc.applyPalette(data, palette);
        enc.writeFrame(index, W, H, { palette: palette, delay: dly });
        setP(30 + Math.round(((i + 1) / n) * 65), 'Kóduji rameček ' + (i + 1) + '/' + n + '…');
      }
      enc.finish();
      var bytes = enc.bytes();
      var blob = new Blob([bytes], { type: 'image/gif' });
      setP(100, 'Hotovo');
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      out.classList.remove('hidden');
      card.innerHTML = '';
      var url = URL.createObjectURL(blob);
      var wrap = document.createElement('div'); wrap.className = 'stack-sm';
      var im = document.createElement('img'); im.src = url; im.alt = 'GIF'; im.style.maxWidth = '100%'; im.style.borderRadius = '0.5rem';
      wrap.appendChild(im);
      var dl = document.createElement('button'); dl.type = 'button'; dl.className = 'btn btn-secondary btn-touch';
      dl.textContent = 'Stáhnout GIF (' + ToolUI.fmtSize(blob.size) + ')';
      dl.addEventListener('click', function () { ToolUI.download(blob, 'animace.gif'); });
      wrap.appendChild(dl);
      card.appendChild(wrap);
      if (window.toast) toast.success('GIF vytvořeno');
    });
  }
})();