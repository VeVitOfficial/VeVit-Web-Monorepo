// Organizace PDF (reorder/remove stran) přes pdf-lib, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('po-drop'), fileEl = ToolUI.el('po-file'), work = ToolUI.el('po-work'), list = ToolUI.el('po-list');
  var run = ToolUI.el('po-run'), err = ToolUI.el('po-error');
  var undo = ToolUI.el('po-undo'), lifecycle = ToolUI.el('tool-root')._toolLifecycle;
  var prog = ToolUI.el('po-prog'), progLabel = ToolUI.el('po-prog-label');
  var file = null, sourceBytes = null, order = [], thumbnails = [], history = [], dragged = -1;

  function fail(m) { ToolUI.showError(err, m); }
  function clearErr() { ToolUI.clearError(err); }

  function snapshot() { history.push(order.slice()); if (history.length > 30) history.shift(); undo.disabled = false; }
  function reset() { file = null; sourceBytes = null; order = []; thumbnails = []; history = []; list.replaceChildren(); fileEl.classList.add('hidden'); work.classList.add('hidden'); undo.disabled = true; lifecycle.setState('idle'); }

  function ensurePdfjs() {
    if (window.pdfjsLib) return Promise.resolve();
    return ToolUI.loadScript('/tools/assets/js/lib/pdf.min.js').then(function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/tools/assets/js/lib/pdf.worker.min.js'; });
  }

  function render() {
    list.replaceChildren();
    order.forEach(function (idx, i) {
      var card = document.createElement('article'); card.className = 'pdf-page-card is-selected'; card.draggable = true; card.dataset.index = String(i);
      var frame = document.createElement('span'); frame.className = 'pdf-page-thumb';
      if (thumbnails[idx]) { var image = thumbnails[idx].cloneNode(); image.alt = ''; frame.appendChild(image); }
      var label = document.createElement('span'); label.textContent = ToolUI.t('page', { number: idx + 1 });
      var actions = document.createElement('span'); actions.className = 'pdf-page-actions';
      [['move_up', -1], ['move_down', 1]].forEach(function (spec) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-ghost btn-icon-sm'; b.disabled = i + spec[1] < 0 || i + spec[1] >= order.length; b.setAttribute('aria-label', ToolUI.t(spec[0], { name: label.textContent }));
        b.appendChild(ToolUI.icon('Upload', 14)); if (spec[1] > 0) b.firstChild.style.transform = 'rotate(180deg)';
        b.addEventListener('click', function () { snapshot(); var j = i + spec[1], temp = order[i]; order[i] = order[j]; order[j] = temp; render(); }); actions.appendChild(b);
      });
      var remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-ghost btn-icon-sm fi-remove'; remove.setAttribute('aria-label', ToolUI.t('remove_file', { name: label.textContent })); remove.appendChild(ToolUI.icon('X', 14));
      remove.addEventListener('click', function () { snapshot(); order.splice(i, 1); render(); }); actions.appendChild(remove);
      card.appendChild(frame); card.appendChild(label); card.appendChild(actions); list.appendChild(card);
      card.addEventListener('dragstart', function () { dragged = i; card.classList.add('is-dragging'); });
      card.addEventListener('dragend', function () { dragged = -1; card.classList.remove('is-dragging'); });
      card.addEventListener('dragover', function (e) { e.preventDefault(); });
      card.addEventListener('drop', function (e) { e.preventDefault(); if (dragged < 0 || dragged === i) return; snapshot(); var moved = order.splice(dragged, 1)[0]; order.splice(i, 0, moved); render(); });
    });
    run.disabled = order.length < 1;
  }

  undo.addEventListener('click', function () { if (!history.length) return; order = history.pop(); undo.disabled = !history.length; render(); });

  ToolUI.dropzone(drop, {
    accept: ['.pdf'], multiple: false, maxSize: 100 * 1024 * 1024,
    onFiles: function (arr) {
      clearErr();
      file = arr[0]; reset(); file = arr[0]; lifecycle.setState('processing', ToolUI.t('loading'));
      ToolUI.renderFileList(fileEl, [file], reset); fileEl.classList.remove('hidden');
      ToolUI.setProgress(prog, 0, '');
      Promise.all([ensurePdfjs(), file.arrayBuffer()]).then(function (values) {
        sourceBytes = values[1]; return window.pdfjsLib.getDocument({ data: new Uint8Array(sourceBytes.slice(0)) }).promise;
      }).then(function (doc) {
        order = []; thumbnails = []; var jobs = [];
        for (var i = 0; i < doc.numPages; i++) order.push(i);
        for (var p = 1; p <= Math.min(doc.numPages, 60); p++) (function (number) {
          jobs.push(doc.getPage(number).then(function (page) { var vp = page.getViewport({ scale: .25 }); var cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height); thumbnails[number - 1] = cv; return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; }));
        })(p);
        return Promise.all(jobs);
      }).then(function () { work.classList.remove('hidden'); render(); lifecycle.setState('ready'); })
        .catch(function (e) { fail(e && e.message ? e.message : ToolUI.t('load_failed')); });
    },
    onError: fail
  });

  run.addEventListener('click', function () {
    if (!file || !order.length) return;
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    lifecycle.setState('processing'); ToolUI.setProgress(prog, 15, ToolUI.t('loading'));
    ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
      ToolUI.setProgress(prog, 35, ToolUI.t('loading'));
      return sourceBytes ? sourceBytes.slice(0) : file.arrayBuffer();
    }).then(function (buf) { return window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); })
      .then(function (src) {
        ToolUI.setProgress(prog, 55, ToolUI.t('state_processing'));
        return window.PDFLib.PDFDocument.create().then(function (dst) {
          var indices = order.map(function (i) { return i; });
          return dst.copyPages(src, indices).then(function (copied) {
            copied.forEach(function (pg) { dst.addPage(pg); });
            ToolUI.setProgress(prog, 85, ToolUI.t('saving'));
            return dst.save({ useObjectStreams: true });
          });
        });
      }).then(function (bytes) {
        ToolUI.setProgress(prog, 100, ToolUI.t('state_success'));
        prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
        ToolUI.download(new Blob([bytes], { type: 'application/pdf' }), 'usporadano.pdf');
      }).catch(function (e) {
        prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
        fail(e && e.message ? e.message : ToolUI.t('unknown_error'));
      });
  });
})();
