// Vodoznak (text/logo) přes canvas, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('wm-drop'), work = ToolUI.el('wm-work'), cv = ToolUI.el('wm-canvas'), ctx = cv.getContext('2d');
  var seg = ToolUI.el('wm-mode'), textGrp = ToolUI.el('wm-text-grp'), logoGrp = ToolUI.el('wm-logo-grp'), colorGrp = ToolUI.el('wm-color-grp');
  var size = ToolUI.el('wm-size'), op = ToolUI.el('wm-op'), opV = ToolUI.el('wm-op-v'), color = ToolUI.el('wm-color');
  var posWrap = ToolUI.el('wm-pos'), format = ToolUI.el('wm-format'), dl = ToolUI.el('wm-dl'), err = ToolUI.el('wm-error');
  var img = new Image(), logo = null, mode = 'text', pos = 'mr';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function draw() {
    if (!img.naturalWidth) return;
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0);
    var pad = Math.round(cv.width * 0.02);
    var ox = { l: pad, c: cv.width / 2, r: cv.width - pad }[pos[1]];
    var oy = { t: pad, c: cv.height / 2, b: cv.height - pad }[pos[0]];
    ctx.globalAlpha = (+op.value) / 100;
    if (mode === 'text') {
      var fs = Math.round(cv.width * (+size.value) / 100 * 0.4);
      ctx.font = 'bold ' + fs + 'px sans-serif';
      ctx.fillStyle = color.value;
      ctx.textAlign = { l: 'left', c: 'center', r: 'right' }[pos[1]];
      ctx.textBaseline = { t: 'top', c: 'middle', b: 'bottom' }[pos[0]];
      ctx.fillText(ToolUI.el('wm-text').value, ox, oy);
    } else if (logo) {
      var lw = cv.width * (+size.value) / 100;
      var lh = logo.naturalHeight * (lw / logo.naturalWidth);
      var x = { l: pad, c: cv.width / 2 - lw / 2, r: cv.width - pad - lw }[pos[1]];
      var y = { t: pad, c: cv.height / 2 - lh / 2, b: cv.height - pad - lh }[pos[0]];
      ctx.drawImage(logo, x, y, lw, lh);
    }
    ctx.globalAlpha = 1;
    dl.disabled = false;
  }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 25 * 1024 * 1024) return fail('Obrázek je příliš velký (max 25 MB).');
      img.onload = function () { work.classList.remove('hidden'); draw(); };
      img.onerror = function () { fail('Obrázek se nepodařilo načíst.'); };
      img.src = URL.createObjectURL(f);
    },
    onError: fail
  });
  ToolUI.dropzone(ToolUI.el('wm-logo-drop'), {
    accept: ['image/png', 'image/jpeg', 'image/webp'], multiple: false,
    onFiles: function (arr) {
      logo = new Image();
      logo.onload = draw;
      logo.src = URL.createObjectURL(arr[0]);
    },
    onError: fail
  });

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
    textGrp.classList.toggle('hidden', mode !== 'text'); colorGrp.classList.toggle('hidden', mode !== 'text');
    logoGrp.classList.toggle('hidden', mode !== 'logo'); draw();
  });
  posWrap.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-pos]'); if (!b) return;
    pos = b.dataset.pos;
    Array.prototype.forEach.call(posWrap.querySelectorAll('button'), function (x) { x.classList.toggle('active', x === b); });
    draw();
  });
  [size, op, color, ToolUI.el('wm-text'), format].forEach(function (e) {
    e.addEventListener('input', function () { if (e === op) opV.textContent = op.value; draw(); });
  });
  dl.addEventListener('click', function () {
    cv.toBlob(function (b) {
      var ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[format.value];
      ToolUI.download(b, 'vodoznak.' + ext);
    }, format.value, 0.92);
  });
})();