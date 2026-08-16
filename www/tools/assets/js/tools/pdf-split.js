// Rozdělení PDF — čistě client-side přes pdf-lib + JSZip (líně načtené).
(function () {
  'use strict';
  var file = null;
  var mode = 'each';
  var lastBlob = null;
  var drop = ToolUI.el('ps-drop');
  var list = ToolUI.el('ps-list');
  var seg = ToolUI.el('ps-mode');
  var chunkOpt = ToolUI.el('ps-chunk-opt');
  var rangesOpt = ToolUI.el('ps-ranges-opt');
  var runBtn = ToolUI.el('ps-run');
  var clearBtn = ToolUI.el('ps-clear');
  var prog = ToolUI.el('ps-prog');
  var progLabel = ToolUI.el('ps-prog-label');
  var err = ToolUI.el('ps-error');
  var result = ToolUI.el('ps-result');
  var resSub = ToolUI.el('ps-result-sub');
  var dlBtn = ToolUI.el('ps-download');

  function err_(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function render() {
    ToolUI.renderFileList(list, file ? [file] : [], function () { file = null; render(); });
    runBtn.disabled = !file;
    clearBtn.disabled = !file;
  }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'],
    multiple: false,
    onFiles: function (arr) { clearErr(); file = arr[0]; render(); },
    onError: err_
  });

  clearBtn.addEventListener('click', function () {
    file = null; render(); clearErr(); result.classList.add('hidden');
    prog.classList.add('hidden'); progLabel.classList.add('hidden');
  });

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x === b;
      x.classList.toggle('active', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    chunkOpt.classList.toggle('hidden', mode !== 'chunk');
    rangesOpt.classList.toggle('hidden', mode !== 'ranges');
  });

  // Parse "1-3, 4, 5-8" → [[1,3],[4,4],[5,8]] (1-based, inkluzivní).
  function parseRanges(text, pageCount) {
    var parts = text.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!parts.length) throw new Error('Zadejte alespoň jeden rozsah.');
    var out = [];
    parts.forEach(function (p) {
      var m = p.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        var a = +m[1], b = +m[2];
        if (a < 1 || b > pageCount || a > b) throw new Error('Neplatný rozsah "' + p + '".');
        out.push([a, b]);
      } else if (/^\d+$/.test(p)) {
        var n = +p;
        if (n < 1 || n > pageCount) throw new Error('Strana ' + n + ' neexistuje (dokument má ' + pageCount + ' stran).');
        out.push([n, n]);
      } else {
        throw new Error('Neplatný zápis "' + p + '". Použijte tvar 1-3 nebo 4.');
      }
    });
    return out;
  }

  runBtn.addEventListener('click', function () {
    if (!file) return;
    clearErr(); result.classList.add('hidden');
    runBtn.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 5, 'Načítám knihovny…');

    Promise.all([
      ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js'),
      ToolUI.loadScript('/tools/assets/js/lib/jszip.min.js')
    ]).then(function () {
      return file.arrayBuffer();
    }).then(function (buf) {
      return window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
    }).then(function (src) {
      var pageCount = src.getPageCount();
      var groups; // pole polí 0-based indexů
      if (mode === 'each') {
        groups = [];
        for (var i = 0; i < pageCount; i++) groups.push([i]);
      } else if (mode === 'chunk') {
        var n = Math.max(1, parseInt(ToolUI.el('ps-n').value, 10) || 1);
        groups = [];
        for (var j = 0; j < pageCount; j += n) {
          var g = [];
          for (var k = j; k < Math.min(j + n, pageCount); k++) g.push(k);
          groups.push(g);
        }
      } else {
        var ranges = parseRanges(ToolUI.el('ps-ranges').value, pageCount);
        groups = ranges.map(function (r) {
          var g = [];
          for (var p = r[0]; p <= r[1]; p++) g.push(p - 1);
          return g;
        });
      }
      return buildZip(src, groups);
    }).then(function (blob) {
      lastBlob = blob;
      ToolUI.setProgress(prog, 100, 'Hotovo');
      prog.classList.add('hidden'); progLabel.classList.add('hidden');
      resSub.textContent = ToolUI.fmtSize(blob.size);
      result.classList.remove('hidden');
      runBtn.disabled = false;
      if (window.toast) toast.success('PDF bylo rozděleno');
    }).catch(function (e) {
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); runBtn.disabled = false;
      err_(e && e.message ? e.message : 'Rozdělení selhalo.');
    });

    function buildZip(src, groups) {
      var PDFLib = window.PDFLib;
      var zip = new JSZip();
      var done = 0;
      function step(i) {
        if (i >= groups.length) {
          ToolUI.setProgress(prog, 92, 'Balím ZIP…');
          return zip.generateAsync({ type: 'blob' });
        }
        ToolUI.setProgress(prog, 10 + Math.round(80 * done / groups.length), 'Vytvářím soubor ' + (i + 1) + '/' + groups.length);
        var idxs = groups[i];
        return PDFLib.PDFDocument.create().then(function (ndoc) {
          return ndoc.copyPages(src, idxs).then(function (copied) {
            copied.forEach(function (pg) { ndoc.addPage(pg); });
            return ndoc.save();
          });
        }).then(function (bytes) {
          var name = idxs.length === 1
            ? 'strana-' + (idxs[0] + 1) + '.pdf'
            : 'strany-' + (idxs[0] + 1) + '-' + (idxs[idxs.length - 1] + 1) + '.pdf';
          zip.file(name, bytes);
          done++;
          return step(i + 1);
        });
      }
      return step(0);
    }
  });

  dlBtn.addEventListener('click', function () {
    if (lastBlob) ToolUI.download(lastBlob, 'pdf-split.zip');
  });
})();