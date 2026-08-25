// Koláž více obrázků přes canvas (cover-fit), čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('ic-drop'), work = ToolUI.el('ic-work'), list = ToolUI.el('ic-list');
  var cv = ToolUI.el('ic-canvas'), ctx = cv.getContext('2d');
  var layout = ToolUI.el('ic-layout'), gap = ToolUI.el('ic-gap'), bg = ToolUI.el('ic-bg'), format = ToolUI.el('ic-format');
  var dl = ToolUI.el('ic-dl'), err = ToolUI.el('ic-error');
  var imgs = []; // {img, name}

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function drawCover(img, x, y, w, h) {
    var iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(w / iw, h / ih);
    var dw = iw * s, dh = ih * s, dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function cells(n, mode) {
    var g = +gap.value || 0;
    var cols, rows;
    if (mode === 'row') { cols = n; rows = 1; }
    else if (mode === 'col') { cols = 1; rows = n; }
    else if (mode === '2x2') { cols = rows = 2; }
    else if (mode === '3x3') { cols = rows = 3; }
    else if (mode === 'hero') {
      // 1 velká vlevo + zbytek vpravo n/2 sloupců
      cols = Math.ceil((n - 1) / 2) + 1; rows = 2; return heroCells(n, g, cols, rows);
    }
    else { // grid auto
      cols = Math.ceil(Math.sqrt(n)); rows = Math.ceil(n / cols);
    }
    var out = [];
    for (var i = 0; i < n; i++) {
      var c = i % cols, r = Math.floor(i / cols);
      out.push({ x: c, y: r, w: 1, h: 1 });
    }
    return { grid: out, cols: cols, rows: rows, g: g };
  }

  function heroCells(n, g, cols, rows) {
    var out = [{ x: 0, y: 0, w: cols, h: rows }]; // placeholder, přepsáno
    // hlavní zabírá 1 sloupec přes celou výšku, zbytek v pravé části mřížka
    var rightCols = cols - 1, i = 1, r = 0, c = 0;
    var rest = [];
    for (; i < n; i++) {
      rest.push({ x: 1 + c, y: r, w: 1, h: 1 });
      c++; if (c >= rightCols) { c = 0; r++; }
    }
    return { grid: [{ x: 0, y: 0, w: 1, h: rows }].concat(rest), cols: cols, rows: rows, g: g };
  }

  function render() {
    if (imgs.length < 2) { dl.disabled = true; return; }
    var info = cells(imgs.length, layout.value);
    var cellW = 480, cellH = 360;
    var totalW = info.cols * cellW + (info.cols + 1) * info.g;
    var totalH = info.rows * cellH + (info.rows + 1) * info.g;
    cv.width = totalW; cv.height = totalH;
    ctx.fillStyle = bg.value; ctx.fillRect(0, 0, totalW, totalH);
    info.grid.forEach(function (c, i) {
      if (i >= imgs.length) return;
      var x = info.g + c.x * (cellW + info.g) + c.w * (cellW + info.g) - cellW - info.g;
      var y = info.g + c.y * (cellH + info.g) + c.h * (cellH + info.g) - cellH - info.g;
      var w = c.w * cellW + (c.w - 1) * info.g;
      var h = c.h * cellH + (c.h - 1) * info.g;
      drawCover(imgs[i].img, x, y, w, h);
    });
    dl.disabled = false;
  }

  function renderList() {
    ToolUI.renderFileList(list, imgs.map(function (it) { return { name: it.name, size: 0 }; }), function (idx) {
      imgs.splice(idx, 1); renderList(); render();
    });
  }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp'], multiple: true,
    onFiles: function (arr) {
      clearErr();
      arr.forEach(function (f) {
        if (f.size > 25 * 1024 * 1024) return fail('Obrázek ' + f.name + ' je příliš velký (max 25 MB).');
        var img = new Image();
        img.onload = function () { render(); };
        img.onerror = function () { fail('Obrázek ' + f.name + ' se nepodařilo načíst.'); };
        img.src = URL.createObjectURL(f);
        imgs.push({ img: img, name: f.name });
      });
      if (imgs.length > 9) { imgs = imgs.slice(0, 9); fail('Maximálně 9 obrázků, přebývající byly ignorovány.'); }
      if (imgs.length < 2) return fail('Přidejte alespoň 2 obrázky.');
      work.classList.remove('hidden'); renderList(); render();
    },
    onError: fail
  });
  [layout, gap, bg].forEach(function (e) { e.addEventListener('input', render); e.addEventListener('change', render); });
  dl.addEventListener('click', function () {
    cv.toBlob(function (b) { var ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[format.value]; ToolUI.download(b, 'kolaz.' + ext); }, format.value, 0.92);
  });
})();