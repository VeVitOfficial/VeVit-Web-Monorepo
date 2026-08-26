// Komprese PDF — čistě client-side.
// lossless: pdf-lib re-save (useObjectStreams). raster: pdf.js render stran → JPEG → pdf-lib.
(function () {
  'use strict';
  var file = null, mode = 'lossless', lastBlob = null, origSize = 0;
  var drop = ToolUI.el('pc-drop'), list = ToolUI.el('pc-list');
  var seg = ToolUI.el('pc-mode'), hint = ToolUI.el('pc-mode-hint'), rasterOpt = ToolUI.el('pc-raster-opt');
  var dpi = ToolUI.el('pc-dpi'), dpiVal = ToolUI.el('pc-dpi-val');
  var q = ToolUI.el('pc-q'), qVal = ToolUI.el('pc-q-val');
  var runBtn = ToolUI.el('pc-run'), clearBtn = ToolUI.el('pc-clear');
  var prog = ToolUI.el('pc-prog'), progLabel = ToolUI.el('pc-prog-label');
  var err = ToolUI.el('pc-error');
  var preview = ToolUI.el('pc-preview'), origFrame = ToolUI.el('pc-orig-frame'), newFrame = ToolUI.el('pc-new-frame');
  var result = ToolUI.el('pc-result'), resSub = ToolUI.el('pc-result-sub'), dlBtn = ToolUI.el('pc-download');

  var HINTS = {
    lossless: 'Přeuloží PDF beze ztráty — text zůstává výběratelný. Redukce je obvykle malá.',
    raster: 'Strany se vyrenderují jako JPEG v daném rozlišení. Větší redukce, ale text přestane být výběratelný.'
  };

  function err_(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function clearFrame(f) { while (f.firstChild) f.removeChild(f.firstChild); }

  function render() {
    ToolUI.renderFileList(list, file ? [file] : [], function () { file = null; render(); });
    runBtn.disabled = !file;
    clearBtn.disabled = !file;
  }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'], multiple: false,
    onFiles: function (arr) { clearErr(); file = arr[0]; origSize = file.size; render(); },
    onError: err_
  });

  clearBtn.addEventListener('click', function () {
    file = null; render(); clearErr(); result.classList.add('hidden'); preview.classList.add('hidden');
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
    hint.textContent = HINTS[mode];
    rasterOpt.classList.toggle('hidden', mode !== 'raster');
  });

  dpi.addEventListener('input', function () { dpiVal.textContent = dpi.value; });
  q.addEventListener('input', function () { qVal.textContent = parseFloat(q.value).toLocaleString(document.documentElement.lang || 'cs'); });

  function ensurePdfjs() {
    if (window.pdfjsLib) return Promise.resolve();
    return ToolUI.loadScript('/tools/assets/js/lib/pdf.min.js').then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/tools/assets/js/lib/pdf.worker.min.js';
    });
  }

  function pct(o, n) {
    if (o <= 0) return '—';
    var d = Math.round((1 - n / o) * 100);
    return (d >= 0 ? '−' + d + ' %' : '+' + (-d) + ' %');
  }

  function showResult(blob) {
    lastBlob = blob;
    resSub.textContent = ToolUI.fmtSize(origSize) + ' → ' + ToolUI.fmtSize(blob.size) + ' · ' + pct(origSize, blob.size);
    result.classList.remove('hidden');
  }

  function finish(blob) {
    ToolUI.setProgress(prog, 100, 'Hotovo');
    prog.classList.add('hidden'); progLabel.classList.add('hidden'); runBtn.disabled = false;
    showResult(blob);
    if (window.toast) toast.success('PDF bylo komprimováno');
  }

  runBtn.addEventListener('click', function () {
    if (!file) return;
    clearErr(); result.classList.add('hidden'); preview.classList.add('hidden');
    clearFrame(origFrame); clearFrame(newFrame);
    runBtn.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 5, 'Načítám pdf-lib…');

    ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
      if (mode === 'lossless') return lossless();
      return raster();
    }).then(finish).catch(function (e) {
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); runBtn.disabled = false;
      err_(e && e.message ? e.message : 'Komprese selhala.');
    });
  });

  // ── Bezztrátové přeuložení ─────────────────────────────────────
  function lossless() {
    ToolUI.setProgress(prog, 30, 'Načítám PDF…');
    return file.arrayBuffer().then(function (buf) {
      return window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
    }).then(function (doc) {
      ToolUI.setProgress(prog, 70, 'Optimalizuji a ukládám…');
      return doc.save({ useObjectStreams: true });
    }).then(function (bytes) {
      return new Blob([bytes], { type: 'application/pdf' });
    });
  }

  // ── Rastr: pdf.js render → JPEG → pdf-lib ─────────────────────
  function raster() {
    var DPI = parseInt(dpi.value, 10) || 120;
    var QUAL = parseFloat(q.value) || 0.72;
    var bufView = null;
    return ensurePdfjs().then(function () {
      ToolUI.setProgress(prog, 10, 'Načítám PDF…');
      return file.arrayBuffer();
    }).then(function (buf) {
      bufView = new Uint8Array(buf); // pdf.js může spotřebovat ArrayBuffer
      return window.pdfjsLib.getDocument({ data: bufView }).promise;
    }).then(function (pdfDoc) {
      var total = pdfDoc.numPages;
      var newDocP = window.PDFLib.PDFDocument.create();
      var i = 1;
      function step() {
        if (i > total) {
          ToolUI.setProgress(prog, 92, 'Ukládám komprimované PDF…');
          return newDocP.then(function (d) { return d.save(); }).then(function (bytes) {
            return new Blob([bytes], { type: 'application/pdf' });
          });
        }
        ToolUI.setProgress(prog, 10 + Math.round(78 * (i - 1) / total), 'Renderuji stranu ' + i + '/' + total);
        return pdfDoc.getPage(i).then(function (page) {
          var viewport = page.getViewport({ scale: DPI / 72 });
          var canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          var ctx = canvas.getContext('2d');
          return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
            return new Promise(function (res) { canvas.toBlob(res, 'image/jpeg', QUAL); });
          }).then(function (blob) {
            return blob.arrayBuffer();
          }).then(function (jpgBuf) {
            return newDocP.then(function (ndoc) {
              // rozměry strany v bodech (1 pt = 1/72 in)
              var wPt = viewport.width / DPI * 72;
              var hPt = viewport.height / DPI * 72;
              return ndoc.embedJpg(jpgBuf).then(function (img) {
                var pg = ndoc.addPage([wPt, hPt]);
                pg.drawImage(img, { x: 0, y: 0, width: wPt, height: hPt });
                // náhled první strany (původní i nový)
                if (i === 1) {
                  appendThumb(origFrame, canvas);
                  appendThumbFromCanvas(newFrame, canvas);
                }
                i++;
                return step();
              });
            });
          });
        });
      }
      return step();
    });
  }

  function appendThumb(frame, canvas) {
    var img = document.createElement('canvas');
    img.width = canvas.width; img.height = canvas.height;
    img.getContext('2d').drawImage(canvas, 0, 0);
    img.style.maxWidth = '100%'; img.style.maxHeight = '24rem'; img.style.objectFit = 'contain';
    clearFrame(frame); frame.appendChild(img);
    preview.classList.remove('hidden');
  }
  function appendThumbFromCanvas(frame, canvas) {
    appendThumb(frame, canvas); // v rastrém režimu je nová 1. strana totožná s renderem
  }

  dlBtn.addEventListener('click', function () {
    if (lastBlob) ToolUI.download(lastBlob, 'komprimovano.pdf');
  });
})();
