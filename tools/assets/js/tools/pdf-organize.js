// Organizace PDF (reorder/remove stran) přes pdf-lib, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('po-drop'), work = ToolUI.el('po-work'), list = ToolUI.el('po-list');
  var run = ToolUI.el('po-run'), err = ToolUI.el('po-error');
  var prog = ToolUI.el('po-prog'), progLabel = ToolUI.el('po-prog-label');
  var file = null, order = []; // pole původních indexů (0-based) v aktuálním pořadí

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function render() {
    var files = order.map(function (idx) { return { name: 'Strana ' + (idx + 1), size: 0 }; });
    ToolUI.renderFileList(list, files, function (i) { order.splice(i, 1); render(); }, {
      reorder: true,
      onMove: function (i, dir) {
        var j = i + dir; if (j < 0 || j >= order.length) return;
        var t = order[i]; order[i] = order[j]; order[j] = t; render();
      }
    });
    run.disabled = order.length < 1;
  }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      file = arr[0];
      ToolUI.setProgress(prog, 0, '');
      ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
        return file.arrayBuffer();
      }).then(function (buf) { return window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); })
        .then(function (doc) {
          var n = doc.getPageCount(); order = [];
          for (var i = 0; i < n; i++) order.push(i);
          work.classList.remove('hidden'); render();
        }).catch(function (e) { fail(e && e.message ? e.message : 'Načtení PDF selhalo.'); });
    },
    onError: fail
  });

  run.addEventListener('click', function () {
    if (!file || !order.length) return;
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 15, 'Načítám pdf-lib…');
    ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
      ToolUI.setProgress(prog, 35, 'Načítám PDF…');
      return file.arrayBuffer();
    }).then(function (buf) { return window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); })
      .then(function (src) {
        ToolUI.setProgress(prog, 55, 'Přerovnávám stránky…');
        return window.PDFLib.PDFDocument.create().then(function (dst) {
          var indices = order.map(function (i) { return i; });
          return dst.copyPages(src, indices).then(function (copied) {
            copied.forEach(function (pg) { dst.addPage(pg); });
            ToolUI.setProgress(prog, 85, 'Ukládám…');
            return dst.save({ useObjectStreams: true });
          });
        });
      }).then(function (bytes) {
        ToolUI.setProgress(prog, 100, 'Hotovo');
        prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
        ToolUI.download(new Blob([bytes], { type: 'application/pdf' }), 'usporadano.pdf');
        if (window.toast) toast.success('PDF bylo uspořádáno');
      }).catch(function (e) {
        prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
        fail(e && e.message ? e.message : 'Uložení selhalo.');
      });
  });
})();