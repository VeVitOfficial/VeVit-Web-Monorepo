// Extrakce textu z PDF přes pdf.js, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('pe-drop'), work = ToolUI.el('pe-work'), out = ToolUI.el('pe-out');
  var copyBtn = ToolUI.el('pe-copy'), dlBtn = ToolUI.el('pe-dl'), err = ToolUI.el('pe-error');
  var prog = ToolUI.el('pe-prog'), progLabel = ToolUI.el('pe-prog-label');
  var text = '', baseName = 'pdf-text.txt';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function ensurePdfjs() {
    if (window.pdfjsLib) return Promise.resolve();
    return ToolUI.loadScript('/tools/assets/js/lib/pdf.min.js').then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/tools/assets/js/lib/pdf.worker.min.js';
    });
  }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var file = arr[0];
      baseName = file.name.replace(/\.pdf$/i, '') + '.txt';
      work.classList.remove('hidden');
      prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
      out.value = ''; copyBtn.disabled = true; dlBtn.disabled = true;
      ToolUI.setProgress(prog, 5, 'Načítám pdf.js…');
      ensurePdfjs().then(function () {
        ToolUI.setProgress(prog, 15, 'Načítám PDF…');
        return file.arrayBuffer();
      }).then(function (buf) { return window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise; })
        .then(function (pdfDoc) {
          var total = pdfDoc.numPages, parts = [], i = 1;
          function step() {
            if (i > total) { return parts.join('\n\n'); }
            ToolUI.setProgress(prog, 15 + Math.round(80 * (i - 1) / total), 'Extrahuji stranu ' + i + '/' + total);
            return pdfDoc.getPage(i).then(function (page) {
              return page.getTextContent().then(function (tc) {
                var last = null, line = '';
                tc.items.forEach(function (it) {
                  if (last !== null && Math.abs(it.transform[5] - last) > 2) { line += '\n'; }
                  line += it.str; last = it.transform[5];
                });
                parts.push(line);
                i++; return step();
              });
            });
          }
          return step();
        }).then(function (t) {
          text = t || '';
          out.value = text;
          if (!text.trim()) { out.value = 'PDF neobsahuje extrahovatelný text (pravděpodobně je to sken / obrázek).'; }
          ToolUI.setProgress(prog, 100, 'Hotovo');
          prog.classList.add('hidden'); progLabel.classList.add('hidden');
          copyBtn.disabled = false; dlBtn.disabled = false;
          if (window.toast) toast.success('Text extrahován');
        }).catch(function (e) {
          prog.classList.add('hidden'); progLabel.classList.add('hidden');
          fail(e && e.message ? e.message : 'Extrakce selhala.');
        });
    },
    onError: fail
  });
  copyBtn.addEventListener('click', function () { ToolUI.copyText(text, copyBtn); });
  dlBtn.addEventListener('click', function () { ToolUI.download(new Blob([text], { type: 'text/plain' }), baseName); });
})();