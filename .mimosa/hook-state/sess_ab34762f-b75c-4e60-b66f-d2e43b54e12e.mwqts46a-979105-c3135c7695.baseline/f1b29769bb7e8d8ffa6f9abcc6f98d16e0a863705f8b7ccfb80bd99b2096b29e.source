// Interaktivní oříznutí obrázku v canvasu, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('cr-drop'), work = ToolUI.el('cr-work'), cv = ToolUI.el('cr-canvas');
  var ratio = ToolUI.el('cr-ratio'), clearBtn = ToolUI.el('cr-clear'), applyBtn = ToolUI.el('cr-apply');
  var format = ToolUI.el('cr-format'), coords = ToolUI.el('cr-coords'), err = ToolUI.el('cr-error');
  var fields = ['x', 'y', 'w', 'h'].map(function (name) { return ToolUI.el('cr-' + name); });
  var resultPreview = ToolUI.el('cr-result-preview'), resultImage = ToolUI.el('cr-result-image');
  var lifecycle = ToolUI.el('tool-root')._toolLifecycle;
  var ctx = cv.getContext('2d');
  var img = new Image(), scale = 1;
  var sel = null, drag = null; // sel = {x,y,w,h} v display coords

  function fail(m) { ToolUI.showError(err, m); }
  function clearErr() { ToolUI.clearError(err); }

  function syncFields() {
    var values = sel ? [sel.x, sel.y, sel.w, sel.h].map(function (v) { return Math.round(v * scale); }) : ['', '', '', ''];
    fields.forEach(function (field, index) { field.value = values[index]; });
  }

  function syncFromFields() {
    var values = fields.map(function (field) { return Math.max(0, parseFloat(field.value) || 0) / scale; });
    if (!values[2] || !values[3]) return;
    sel = { x: Math.min(values[0], cv.width), y: Math.min(values[1], cv.height), w: Math.min(values[2], cv.width - values[0]), h: Math.min(values[3], cv.height - values[1]) };
    applyBtn.disabled = !sel.w || !sel.h; draw(); lifecycle.setState('ready');
  }
  fields.forEach(function (field) { field.addEventListener('input', syncFromFields); });

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
      coords.textContent = Math.round(sel.w) + '×' + Math.round(sel.h) + ' px → ' + Math.round(sel.w * scale) + '×' + Math.round(sel.h * scale) + ' px';
      syncFields(); lifecycle.setState('ready');
    } else { sel = null; applyBtn.disabled = true; draw(); syncFields(); coords.textContent = ToolUI.t('state_ready'); }
  }
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);

  clearBtn.addEventListener('click', function () { sel = null; applyBtn.disabled = true; draw(); syncFields(); resultPreview.classList.add('hidden'); coords.textContent = ToolUI.t('state_ready'); });
  ratio.addEventListener('change', function () { if (sel && sel.w) { sel = clampRect({ x: sel.x, y: sel.y }, { x: sel.x + sel.w, y: sel.y + sel.h }); draw(); } });

  applyBtn.addEventListener('click', function () {
    if (!sel || !img.naturalWidth) return;
    lifecycle.setState('processing'); applyBtn.disabled = true;
    var sx = sel.x * scale, sy = sel.y * scale, sw = sel.w * scale, sh = sel.h * scale;
    var out = document.createElement('canvas'); out.width = Math.round(sw); out.height = Math.round(sh);
    var ox = out.getContext('2d');
    var fmt = format.value;
    if (fmt === 'image/jpeg') { ox.fillStyle = '#fff'; ox.fillRect(0, 0, out.width, out.height); }
    ox.drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
    var ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[fmt];
    out.toBlob(function (b) {
      if (!b) { applyBtn.disabled = false; return fail(ToolUI.t('unknown_error')); }
      var previewUrl = lifecycle.objectUrl(b); resultImage.src = previewUrl; resultPreview.classList.remove('hidden');
      ToolUI.download(b, 'image-crop.' + ext); applyBtn.disabled = false;
    }, fmt, 0.92);
  });

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'], multiple: false, maxSize: 25 * 1024 * 1024,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      lifecycle.cleanup(); lifecycle = ToolUI.lifecycle(ToolUI.el('tool-root')); ToolUI.el('tool-root')._toolLifecycle = lifecycle;
      var url = lifecycle.objectUrl(f); lifecycle.setState('processing', ToolUI.t('loading'));
      img.onload = function () {
        var maxW = 700, maxH = 480;
        var w = img.naturalWidth, h = img.naturalHeight;
        var s = Math.min(maxW / w, maxH / h, 1);
        cv.width = Math.round(w * s); cv.height = Math.round(h * s);
        scale = w / cv.width;
        sel = null; applyBtn.disabled = true;
        work.classList.remove('hidden'); draw();
        syncFields(); resultPreview.classList.add('hidden'); coords.textContent = ToolUI.t('state_ready'); lifecycle.setState('ready');
      };
      img.onerror = function () { fail(ToolUI.t('load_failed')); };
      img.src = url;
    },
    onError: fail
  });
})();
