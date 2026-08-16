// Interaktivní oříznutí obrázku v canvasu, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('cr-drop'), work = ToolUI.el('cr-work'), cv = ToolUI.el('cr-canvas');
  var ratio = ToolUI.el('cr-ratio'), clearBtn = ToolUI.el('cr-clear'), applyBtn = ToolUI.el('cr-apply');
  var format = ToolUI.el('cr-format'), coords = ToolUI.el('cr-coords'), err = ToolUI.el('cr-error');
  var ctx = cv.getContext('2d');
  var img = new Image(), scale = 1;
  var sel = null, drag = null; // sel = {x,y,w,h} v display coords

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    if (sel && sel.w && sel.h) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      // 4 obdélníky mimo výběr
      ctx.fillRect(0, 0, cv.width, sel.y);
      ctx.fillRect(0, sel.y + sel.h, cv.width, cv.height - sel.y - sel.h);
      ctx.fillRect(0, sel.y, sel.x, sel.h);
      ctx.fillRect(sel.x + sel.w, sel.y, cv.width - sel.x - sel.w, sel.h);
      ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
      ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
    }
  }

  function pos(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
  }
  function clampRect(a, b) {
    var x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    var w = Math.abs(a.x - b.x), h = Math.abs(a.y - b.y);
    var r = parseFloat(ratio.value);
    if (r > 0) { h = w / r; if (b.y < a.y) y = a.y - h; }
    if (x < 0) { w += x; x = 0; } if (y < 0) { h += y; y = 0; }
    if (x + w > cv.width) w = cv.width - x; if (y + h > cv.height) h = cv.height - y;
    return { x: x, y: y, w: Math.max(0, w), h: Math.max(0, h) };
  }

  cv.addEventListener('pointerdown', function (e) {
    if (!img.naturalWidth) return;
    cv.setPointerCapture(e.pointerId);
    drag = pos(e); sel = { x: drag.x, y: drag.y, w: 0, h: 0 };
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag) return;
    sel = clampRect(drag, pos(e));
    draw();
  });
  function endDrag() {
    if (!drag) return;
    drag = null;
    if (sel && sel.w > 4 && sel.h > 4) {
      applyBtn.disabled = false;
      coords.textContent = 'Výběr: ' + Math.round(sel.w) + '×' + Math.round(sel.h) + ' px (zobrazeno) → ' +
        Math.round(sel.w * scale) + '×' + Math.round(sel.h * scale) + ' px (originál)';
    } else { sel = null; applyBtn.disabled = true; draw(); coords.textContent = 'Tažením nakreslete obdélník.'; }
  }
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);

  clearBtn.addEventListener('click', function () { sel = null; applyBtn.disabled = true; draw(); coords.textContent = 'Tažením nakreslete obdélník.'; });
  ratio.addEventListener('change', function () { if (sel && sel.w) { sel = clampRect({ x: sel.x, y: sel.y }, { x: sel.x + sel.w, y: sel.y + sel.h }); draw(); } });

  applyBtn.addEventListener('click', function () {
    if (!sel || !img.naturalWidth) return;
    var sx = sel.x * scale, sy = sel.y * scale, sw = sel.w * scale, sh = sel.h * scale;
    var out = document.createElement('canvas'); out.width = Math.round(sw); out.height = Math.round(sh);
    var ox = out.getContext('2d');
    var fmt = format.value;
    if (fmt === 'image/jpeg') { ox.fillStyle = '#fff'; ox.fillRect(0, 0, out.width, out.height); }
    ox.drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
    var ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[fmt];
    out.toBlob(function (b) { ToolUI.download(b, 'obrazek-orez.' + ext); }, fmt, 0.92);
  });

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 25 * 1024 * 1024) return fail('Obrázek je příliš velký (max 25 MB).');
      var url = URL.createObjectURL(f);
      img.onload = function () {
        var maxW = 700, maxH = 480;
        var w = img.naturalWidth, h = img.naturalHeight;
        var s = Math.min(maxW / w, maxH / h, 1);
        cv.width = Math.round(w * s); cv.height = Math.round(h * s);
        scale = w / cv.width;
        sel = null; applyBtn.disabled = true;
        work.classList.remove('hidden'); draw();
        coords.textContent = 'Tažením nakreslete obdélník pro oříznutí.';
      };
      img.onerror = function () { fail('Obrázek se nepodařilo načíst.'); };
      img.src = url;
    },
    onError: fail
  });
})();