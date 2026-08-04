// Meme generátor (Impact text), čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('mm-drop'), work = ToolUI.el('mm-work'), cv = ToolUI.el('mm-canvas'), ctx = cv.getContext('2d');
  var top = ToolUI.el('mm-top'), bottom = ToolUI.el('mm-bottom'), size = ToolUI.el('mm-size');
  var format = ToolUI.el('mm-format'), dl = ToolUI.el('mm-dl'), err = ToolUI.el('mm-error');
  var img = new Image();

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function wrap(text, maxChars) {
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (test.length > maxChars && cur) { lines.push(cur); cur = w; }
      else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function drawText(text, align) {
    if (!text) return;
    var fs = Math.round(cv.width * (+size.value) / 100);
    ctx.font = 'bold ' + fs + 'px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = Math.max(2, fs / 12);
    ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff';
    var maxChars = Math.max(8, Math.round(cv.width / (fs * 0.55)));
    var lines = wrap(text.toUpperCase(), maxChars);
    var lh = fs * 1.05, pad = fs * 0.3;
    var startY = align === 'top' ? pad + fs : cv.height - pad - (lines.length - 1) * lh;
    lines.forEach(function (ln, i) {
      var y = startY + i * lh;
      ctx.strokeText(ln, cv.width / 2, y);
      ctx.fillText(ln, cv.width / 2, y);
    });
  }

  function draw() {
    if (!img.naturalWidth) return;
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0);
    drawText(top.value, 'top');
    drawText(bottom.value, 'bottom');
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
  [top, bottom, size].forEach(function (e) { e.addEventListener('input', draw); });
  dl.addEventListener('click', function () {
    cv.toBlob(function (b) { var ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[format.value]; ToolUI.download(b, 'meme.' + ext); }, format.value, 0.92);
  });
})();