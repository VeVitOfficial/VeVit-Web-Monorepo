// Číslování stran PDF přes pdf-lib, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('pn-drop'), work = ToolUI.el('pn-work'), pos = ToolUI.el('pn-pos');
  var start = ToolUI.el('pn-start'), fmt = ToolUI.el('pn-fmt'), size = ToolUI.el('pn-size');
  var run = ToolUI.el('pn-run'), err = ToolUI.el('pn-error');
  var prog = ToolUI.el('pn-prog'), progLabel = ToolUI.el('pn-prog-label');
  var file = null;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'], multiple: false,
    onFiles: function (arr) { clearErr(); file = arr[0]; work.classList.remove('hidden'); run.disabled = false; },
    onError: fail
  });

  run.addEventListener('click', function () {
    if (!file) return;
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 10, 'Načítám pdf-lib…');
    ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
      ToolUI.setProgress(prog, 30, 'Načítám PDF…');
      return file.arrayBuffer();
    }).then(function (buf) { return window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); })
      .then(function (doc) {
        var total = doc.getPageCount(), s = +start.value || 0, fs = +size.value || 10;
        var fontP = doc.embedFont(window.PDFLib.StandardFonts.Helvetica);
        return fontP.then(function (font) {
          ToolUI.setProgress(prog, 55, 'Přidávám čísla…');
          var pages = doc.getPages();
          for (var i = 0; i < pages.length; i++) {
            var pg = pages[i], w = pg.getWidth(), h = pg.getHeight();
            var txt = fmt.value.replace(/\{n\}/g, String(s + i + 1)).replace(/\{t\}/g, String(total));
            var tw = font.widthOfTextAtSize(txt, fs);
            var m = 18, vertical = pos.value[0] === 't';
            var horiz = pos.value[1];
            var x = horiz === 'l' ? m : horiz === 'r' ? w - m - tw : (w - tw) / 2;
            var y = vertical ? h - m - fs : m;
            pg.drawText(txt, { x: x, y: y, size: fs, font: font, color: window.PDFLib.rgb(0.2, 0.2, 0.2) });
          }
          ToolUI.setProgress(prog, 85, 'Ukládám…');
          return doc.save({ useObjectStreams: true });
        });
      }).then(function (bytes) {
        ToolUI.setProgress(prog, 100, 'Hotovo');
        prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
        ToolUI.download(new Blob([bytes], { type: 'application/pdf' }), 'cislovano.pdf');
        if (window.toast) toast.success('Čísla stran přidána');
      }).catch(function (e) {
        prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
        fail(e && e.message ? e.message : 'Číslování selhalo.');
      });
  });
})();