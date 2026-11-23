// PDF → obrázky (pdf.js render + JSZip), čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('pi-drop'), work = ToolUI.el('pi-work'), scale = ToolUI.el('pi-scale');
  var format = ToolUI.el('pi-format'), qGrp = ToolUI.el('pi-q-grp'), q = ToolUI.el('pi-q');
  var run = ToolUI.el('pi-run'), err = ToolUI.el('pi-error');
  var prog = ToolUI.el('pi-prog'), progLabel = ToolUI.el('pi-prog-label');
  var file = null;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function ensurePdfjs() {
    if (window.pdfjsLib) return Promise.resolve();
    return ToolUI.loadScript('/tools/assets/js/lib/pdf.min.js').then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/tools/assets/js/lib/pdf.worker.min.js';
    });
  }
  function ensureJszip() {
    if (window.JSZip) return Promise.resolve();
    return ToolUI.loadScript('/tools/assets/js/lib/jszip.min.js');
  }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'], multiple: false,
    onFiles: function (arr) { clearErr(); file = arr[0]; work.classList.remove('hidden'); run.disabled = false; },
    onError: fail
  });
  format.addEventListener('change', function () { qGrp.classList.toggle('hidden', format.value !== 'image/jpeg'); });

  run.addEventListener('click', function () {
    if (!file) return;
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 5, 'Načítám knihovny…');
    var s = parseFloat(scale.value) || 1.5, mime = format.value, qual = parseFloat(q.value) || 0.82;
    var ext = mime === 'image/png' ? 'png' : 'jpg';
    Promise.all([ensurePdfjs(), ensureJszip()]).then(function () {
      ToolUI.setProgress(prog, 15, 'Načítám PDF…');
      return file.arrayBuffer();
    }).then(function (buf) {
      return window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
    }).then(function (pdfDoc) {
      var total = pdfDoc.numPages, zip = new JSZip(), i = 1;
      function step() {
        if (i > total) {
          ToolUI.setProgress(prog, 92, 'Balím ZIP…');
          return zip.generateAsync({ type: 'blob' }).then(function (b) { return { blob: b }; });
        }
        ToolUI.setProgress(prog, 15 + Math.round(75 * (i - 1) / total), 'Renderuji stranu ' + i + '/' + total);
        return pdfDoc.getPage(i).then(function (page) {
          var vp = page.getViewport({ scale: s });
          var cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
          var ctx = cv.getContext('2d');
          if (mime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); }
          return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
            return new Promise(function (res) { cv.toBlob(res, mime, qual); });
          }).then(function (blob) {
            var name = 'strana-' + String(i).padStart(3, '0') + '.' + ext;
            zip.file(name, blob);
            i++; return step();
          });
        });
      }
      return step();
    }).then(function (r) {
      ToolUI.setProgress(prog, 100, 'Hotovo');
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      ToolUI.download(r.blob, 'pdf-obrazky.zip');
      if (window.toast) toast.success('Obrázky vygenerovány');
    }).catch(function (e) {
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      fail(e && e.message ? e.message : 'Převod selhal.');
    });
  });
})();