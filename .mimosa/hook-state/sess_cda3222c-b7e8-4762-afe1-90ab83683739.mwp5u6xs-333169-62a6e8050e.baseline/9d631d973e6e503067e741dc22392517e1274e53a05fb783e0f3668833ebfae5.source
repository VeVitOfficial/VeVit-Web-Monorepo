// Zvětšení obrázku přes canvas (bicubic/smooth), čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('up-drop'), work = ToolUI.el('up-work'), src = ToolUI.el('up-src'), dst = ToolUI.el('up-dst');
  var scale = ToolUI.el('up-scale'), format = ToolUI.el('up-format');
  var run = ToolUI.el('up-run'), dl = ToolUI.el('up-dl'), info = ToolUI.el('up-info'), err = ToolUI.el('up-error');
  var img = new Image(), blob = null, outExt = 'png';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function upscale() {
    clearErr();
    if (!img.naturalWidth) return;
    var s = +scale.value, w = img.naturalWidth * s, h = img.naturalHeight * s;
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var cx = c.getContext('2d');
    cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
    var fmt = format.value;
    if (fmt === 'image/jpeg') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); }
    cx.drawImage(img, 0, 0, w, h);
    outExt = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[fmt];
    c.toBlob(function (b) {
      blob = b; dst.src = URL.createObjectURL(b);
      info.textContent = img.naturalWidth + '×' + img.naturalHeight + ' → ' + w + '×' + h + ' px';
      dl.disabled = false;
    }, fmt, 0.92);
  }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 25 * 1024 * 1024) return fail('Obrázek je příliš velký (max 25 MB).');
      if (f.type === 'image/jpeg' && img.naturalWidth > 4000) return fail('Obrázek je příliš velký pro zvětšení.');
      var url = URL.createObjectURL(f);
      img.onload = function () { src.src = url; work.classList.remove('hidden'); upscale(); };
      img.onerror = function () { fail('Obrázek se nepodařilo načíst.'); };
      img.src = url;
    },
    onError: fail
  });
  [scale, format].forEach(function (e) { e.addEventListener('change', upscale); });
  run.addEventListener('click', upscale);
  dl.addEventListener('click', function () { if (blob) ToolUI.download(blob, 'zvetseno.' + outExt); });
})();