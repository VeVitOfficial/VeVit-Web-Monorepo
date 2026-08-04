// Sloučení PDF — čistě client-side přes pdf-lib (líně načtený).
(function () {
  'use strict';
  var files = [];
  var lastBlob = null;
  var drop = ToolUI.el('pm-drop');
  var list = ToolUI.el('pm-list');
  var runBtn = ToolUI.el('pm-run');
  var clearBtn = ToolUI.el('pm-clear');
  var prog = ToolUI.el('pm-prog');
  var progLabel = ToolUI.el('pm-prog-label');
  var err = ToolUI.el('pm-error');
  var result = ToolUI.el('pm-result');
  var resName = ToolUI.el('pm-result-name');
  var resSub = ToolUI.el('pm-result-sub');
  var dlBtn = ToolUI.el('pm-download');

  function err_(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function render() {
    ToolUI.renderFileList(list, files, removeAt, {
      reorder: true,
      onMove: function (i, dir) {
        var j = i + dir;
        if (j < 0 || j >= files.length) return;
        var t = files[i]; files[i] = files[j]; files[j] = t;
        render();
      }
    });
    runBtn.disabled = files.length < 2;
    clearBtn.disabled = files.length === 0;
  }
  function removeAt(i) { files.splice(i, 1); render(); }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'],
    multiple: true,
    onFiles: function (arr) {
      clearErr();
      arr.forEach(function (f) { files.push(f); });
      render();
    },
    onError: err_
  });

  clearBtn.addEventListener('click', function () {
    files = []; render(); clearErr(); hideResult(); prog.classList.add('hidden'); progLabel.classList.add('hidden');
  });

  function hideResult() { result.classList.add('hidden'); }

  runBtn.addEventListener('click', function () {
    if (files.length < 2) return;
    clearErr(); hideResult();
    runBtn.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 5, 'Načítám pdf-lib…');

    ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
      var PDFLib = window.PDFLib;
      var out = PDFLib.PDFDocument.create();
      var done = 0;
      function step(i) {
        if (i >= files.length) {
          ToolUI.setProgress(prog, 95, 'Ukládám sloučené PDF…');
          return out.then(function (doc) { return doc.save(); }).then(function (bytes) {
            lastBlob = new Blob([bytes], { type: 'application/pdf' });
            ToolUI.setProgress(prog, 100, 'Hotovo');
            prog.classList.add('hidden'); progLabel.classList.add('hidden');
            resName.textContent = 'slouceno.pdf';
            resSub.textContent = files.length + ' souborů · ' + ToolUI.fmtSize(lastBlob.size);
            result.classList.remove('hidden');
            runBtn.disabled = false;
            if (window.toast) toast.success('PDF bylo sloučeno');
          });
        }
        ToolUI.setProgress(prog, 10 + Math.round(80 * done / files.length), 'Zpracovávám ' + (i + 1) + '/' + files.length + ': ' + files[i].name);
        return files[i].arrayBuffer().then(function (buf) {
          return PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
        }).then(function (src) {
          return out.then(function (doc) {
            return doc.copyPages(src, src.getPageIndices()).then(function (pages) {
              pages.forEach(function (p) { doc.addPage(p); });
              done++;
              return step(i + 1);
            });
          });
        }).catch(function (e) { throw new Error('Nelze načíst ' + files[i].name + ': ' + (e.message || e)); });
      }
      return step(0).catch(function (e) {
        prog.classList.add('hidden'); progLabel.classList.add('hidden'); runBtn.disabled = false;
        err_(e.message || 'Sloučení selhalo.');
      });
    }).catch(function () {
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); runBtn.disabled = false;
      err_('Nelze načíst knihovnu pdf-lib.');
    });
  });

  dlBtn.addEventListener('click', function () {
    if (lastBlob) ToolUI.download(lastBlob, 'slouceno.pdf');
  });
})();