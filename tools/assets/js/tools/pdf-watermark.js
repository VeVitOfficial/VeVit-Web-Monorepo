// Vodoznak PDF přes pdf-lib, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('pw-drop'), work = ToolUI.el('pw-work'), text = ToolUI.el('pw-text');
  var size = ToolUI.el('pw-size'), op = ToolUI.el('pw-op'), angle = ToolUI.el('pw-angle');
  var color = ToolUI.el('pw-color'), tile = ToolUI.el('pw-tile');
  var run = ToolUI.el('pw-run'), err = ToolUI.el('pw-error');
  var prog = ToolUI.el('pw-prog'), progLabel = ToolUI.el('pw-prog-label');
  var file = null;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function hex2rgb(h) { h = h.replace('#', ''); return window.PDFLib.rgb(parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255); }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'], multiple: false,
    onFiles: function (arr) { clearErr(); file = arr[0]; work.classList.remove('hidden'); run.disabled = false; },
    onError: fail
  });

  run.addEventListener('click', function () {
    if (!file) return;
    if (!text.value.trim()) return fail('Zadejte text vodoznaku.');
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 10, 'Načítám pdf-lib…');
    ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
      ToolUI.setProgress(prog, 30, 'Načítám PDF…');
      return file.arrayBuffer();
    }).then(function (buf) { return window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); })
      .then(function (doc) {
        return doc.embedFont(window.PDFLib.StandardFonts.HelveticaBold).then(function (font) {
          ToolUI.setProgress(prog, 50, 'Vkládám vodoznak…');
          var fs = +size.value || 48, deg = +angle.value || 0, alpha = (+op.value || 25) / 100;
          var col = hex2rgb(color.value);
          var pages = doc.getPages();
          pages.forEach(function (pg) {
            var w = pg.getWidth(), h = pg.getHeight();
            var txt = text.value, tw = font.widthOfTextAtSize(txt, fs);
            if (tile.checked) {
              var step = tw + fs * 1.5, stepY = fs * 2.5;
              for (var y = -h; y < h * 2; y += stepY) {
                for (var x = -w; x < w * 2; x += step) {
                  pg.drawText(txt, { x: x, y: y, size: fs, font: font, color: col, opacity: alpha, rotate: window.PDFLib.degrees(deg) });
                }
              }
            } else {
              pg.drawText(txt, { x: (w - tw) / 2, y: h / 2 - fs / 2, size: fs, font: font, color: col, opacity: alpha, rotate: window.PDFLib.degrees(deg) });
            }
          });
          ToolUI.setProgress(prog, 85, 'Ukládám…');
          return doc.save({ useObjectStreams: true });
        });
      }).then(function (bytes) {
        ToolUI.setProgress(prog, 100, 'Hotovo');
        prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
        ToolUI.download(new Blob([bytes], { type: 'application/pdf' }), 'vodoznak.pdf');
        if (window.toast) toast.success('Vodoznak přidán');
      }).catch(function (e) {
        prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
        fail(e && e.message ? e.message : 'Vodoznak selhal.');
      });
  });
})();